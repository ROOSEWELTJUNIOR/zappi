/**
 * Evolution API service.
 * ─────────────────────────────────────────────────────────────────────────────
 * ALL HTTP communication with the Evolution API happens here — nowhere else.
 * Components and hooks call these exported functions; they never use axios or
 * fetch directly.
 *
 * Adapter layer: raw API responses are normalised before leaving this file.
 * The rest of the app never depends on the raw shape.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { evolutionConfig } from '@/config/evolution';
import type {
  EvolutionInstanceItem,
  EvolutionConnectionStateResponse,
  EvolutionConnectResponse,
  EvolutionCreateResponse,
  EvolutionApiInfo,
  EvolutionProfile,
  ConnectionStatus,
  EvolutionState,
} from '@/types/evolution';

const IS_DEV = import.meta.env.DEV;

// ─── Singleton axios client ───────────────────────────────────────────────────

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  // Re-create if baseURL or apiKey ever changes (e.g. hot-reload in dev)
  const expectedBase = evolutionConfig.baseUrl;
  const expectedKey  = evolutionConfig.apiKey;

  if (_client) return _client;

  const client = axios.create({
    baseURL: expectedBase,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
      apikey: expectedKey,
    },
  });

  // ── Dev-only request logger ──────────────────────────────────────────────
  if (IS_DEV) {
    client.interceptors.request.use((config) => {
      // Never log the API key value
      const safeHeaders = { ...config.headers, apikey: '[REDACTED]' };
      console.debug(
        `[Evolution] ▶ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        { headers: safeHeaders, data: config.data ?? null },
      );
      return config;
    });
  }

  // ── Response interceptor ─────────────────────────────────────────────────
  client.interceptors.response.use(
    (res) => {
      if (IS_DEV) {
        console.debug(
          `[Evolution] ◀ ${res.status} ${res.config.url}`,
          res.data,
        );
      }
      return res;
    },
    (err: AxiosError) => {
      const status = err.response?.status;
      const data   = err.response?.data as Record<string, unknown> | undefined;

      if (IS_DEV) {
        console.warn(
          `[Evolution] ✖ ${status ?? 'no-response'} ${err.config?.url}`,
          err.message,
        );
      }

      // ── No response at all (CORS / network / offline) ────────────────────
      if (!err.response) {
        throw new EvolutionError(
          'API offline ou inacessível. Verifique a URL configurada.',
          'OFFLINE',
        );
      }

      // ── Auth ─────────────────────────────────────────────────────────────
      if (status === 401 || status === 403) {
        throw new EvolutionError(
          'API Key inválida ou sem permissão de acesso.',
          'UNAUTHORIZED',
        );
      }

      // ── Not found ────────────────────────────────────────────────────────
      if (status === 404) {
        const msg = extractMessage(data) ?? 'Instância não encontrada.';
        throw new EvolutionError(msg, 'NOT_FOUND');
      }

      // ── Unprocessable ────────────────────────────────────────────────────
      if (status === 422) {
        const msg = extractMessage(data) ?? 'Dados inválidos.';
        if (msg.toLowerCase().includes('already')) {
          throw new EvolutionError(
            'Já existe uma instância com esse nome.',
            'DUPLICATE',
          );
        }
        throw new EvolutionError(msg, 'VALIDATION');
      }

      // ── Timeout ──────────────────────────────────────────────────────────
      if (status === 408 || err.code === 'ECONNABORTED') {
        throw new EvolutionError(
          'Tempo de resposta esgotado (timeout).',
          'TIMEOUT',
        );
      }

      throw new EvolutionError(
        extractMessage(data) ?? 'Erro desconhecido na API.',
        'UNKNOWN',
      );
    },
  );

  _client = client;
  return client;
}

// ─── Typed error ─────────────────────────────────────────────────────────────

export class EvolutionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'OFFLINE'
      | 'UNAUTHORIZED'
      | 'NOT_FOUND'
      | 'DUPLICATE'
      | 'VALIDATION'
      | 'TIMEOUT'
      | 'QR_EXPIRED'
      | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'EvolutionError';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract a human-readable message from an arbitrary API error body. */
function extractMessage(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  // Try common fields across Evolution API versions
  return (
    (data.message as string | undefined) ??
    (data.error as string | undefined) ??
    ((data as { error?: { message?: string } }).error?.message) ??
    null
  );
}

/** Ensure a base64 string is a valid data URI. */
function toDataUri(raw: string): string {
  if (raw.startsWith('data:')) return raw;
  return `data:image/png;base64,${raw}`;
}

// ─── Adapter: state normalisation ────────────────────────────────────────────

/**
 * Converts any raw Evolution API state string into a stable ConnectionStatus.
 * This is the single place that knows about API version differences.
 */
export function normaliseState(raw?: EvolutionState | string | null): ConnectionStatus {
  switch ((raw ?? '').toLowerCase().trim()) {
    case 'open':
      return 'OPEN';
    case 'connecting':
      return 'CONNECTING';
    case 'qrcode':
      return 'QRCODE';
    case 'close':
    case 'closed':
      return 'CLOSED';
    case 'disconnected':
    case 'refused':
      return 'DISCONNECTED';
    case 'unknown':
    case 'error':
      return 'ERROR';
    default:
      return 'OFFLINE';
  }
}

// ─── Service methods ─────────────────────────────────────────────────────────

/** List all instances registered in the Evolution API. */
export async function listInstances(): Promise<EvolutionInstanceItem[]> {
  const { data } = await getClient().get<EvolutionInstanceItem[] | EvolutionInstanceItem>(
    '/instance/fetchInstances',
  );
  // Adapter: some versions return a single object, others an array
  return Array.isArray(data) ? data : [data];
}

/** Create a new Baileys instance. */
export async function createInstance(name: string): Promise<EvolutionCreateResponse> {
  const { data } = await getClient().post<EvolutionCreateResponse>('/instance/create', {
    instanceName: name,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
  });
  return data;
}

/** Delete an instance permanently. */
export async function deleteInstance(name: string): Promise<void> {
  await getClient().delete(`/instance/delete/${name}`);
}

/**
 * Fetch the QR code for a given instance.
 * Returns a data URI (data:image/png;base64,…).
 */
export async function fetchQRCode(name: string): Promise<string> {
  const { data } = await getClient().get<EvolutionConnectResponse>(
    `/instance/connect/${name}`,
  );

  // Adapter: handle both v1 (qrcode.base64) and v2 (base64) shapes
  const b64 = data.base64 ?? data.qrcode?.base64 ?? null;

  if (!b64) {
    throw new EvolutionError(
      'QR Code expirado ou indisponível. Tente reconectar a instância.',
      'QR_EXPIRED',
    );
  }

  return toDataUri(b64);
}

/** Alias — triggers the connection flow (same as fetching QR). */
export const connectInstance = fetchQRCode;

/** Get the current connection state of an instance. */
export async function getConnectionState(name: string): Promise<ConnectionStatus> {
  const { data } = await getClient().get<EvolutionConnectionStateResponse>(
    `/instance/connectionState/${name}`,
  );
  // Adapter: v1 nests in instance.state, v2 may expose state at root
  const raw = data?.instance?.state ?? data?.state ?? null;
  return normaliseState(raw);
}

/** Logout from WhatsApp — keeps the instance, drops the session. */
export async function logoutInstance(name: string): Promise<void> {
  await getClient().delete(`/instance/logout/${name}`);
}

/** Restart an existing instance. */
export async function restartInstance(name: string): Promise<void> {
  await getClient().put(`/instance/restart/${name}`);
}

/**
 * Fetch profile info for a connected instance.
 * Returns null gracefully if the instance isn't connected or profile is unavailable.
 */
export async function fetchProfile(instanceName: string): Promise<EvolutionProfile | null> {
  try {
    // v2: GET /instance/fetchInstances?instanceName={name} returns rich profile data
    const { data } = await getClient().get<EvolutionInstanceItem[] | EvolutionInstanceItem>(
      '/instance/fetchInstances',
      { params: { instanceName } },
    );
    const item = Array.isArray(data) ? data[0] : data;
    if (!item) return null;

    return {
      name: item.profileName ?? undefined,
      pushName: item.profileName ?? undefined,
      picture: item.profilePicUrl ?? undefined,
      status: item.profileStatus ?? undefined,
    };
  } catch {
    // Non-fatal — profile fetch is best-effort
    return null;
  }
}

/** Get Evolution API server info (version, status). */
export async function getApiInfo(): Promise<EvolutionApiInfo> {
  try {
    const { data } = await getClient().get<EvolutionApiInfo>('/');
    return data ?? {};
  } catch {
    return {};
  }
}

/** Verify reachability and valid API key. Returns { ok, message }. */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await listInstances();
    return { ok: true, message: 'Conectado com sucesso.' };
  } catch (err) {
    if (err instanceof EvolutionError) {
      return { ok: false, message: err.message };
    }
    return { ok: false, message: 'Falha ao conectar com a Evolution API.' };
  }
}
