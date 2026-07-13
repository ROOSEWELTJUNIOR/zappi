/**
 * Evolution API service.
 * All communication with the Evolution API must happen through this file.
 * Components must never call fetch/axios directly.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { evolutionConfig } from '@/config/evolution';
import type {
  EvolutionInstanceItem,
  EvolutionConnectionStateResponse,
  EvolutionConnectResponse,
  EvolutionCreateResponse,
  ConnectionStatus,
  EvolutionState,
} from '@/types/evolution';

// ─── Axios instance ──────────────────────────────────────────────────────────

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: evolutionConfig.baseUrl,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
      apikey: evolutionConfig.apiKey,
    },
  });

  client.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const status = err.response?.status;
      const data = err.response?.data as Record<string, unknown> | undefined;

      if (!err.response) {
        throw new EvolutionError('API offline ou inacessível. Verifique a URL configurada.', 'OFFLINE');
      }
      if (status === 401 || status === 403) {
        throw new EvolutionError('API Key inválida ou sem permissão de acesso.', 'UNAUTHORIZED');
      }
      if (status === 404) {
        const msg =
          (data?.message as string | undefined) ?? 'Instância não encontrada.';
        throw new EvolutionError(msg, 'NOT_FOUND');
      }
      if (status === 422) {
        const inner = (data as { error?: { message?: string } } | undefined)?.error?.message;
        const msg = inner ?? (data?.message as string | undefined) ?? 'Dados inválidos.';
        if (msg.toLowerCase().includes('already')) {
          throw new EvolutionError('Já existe uma instância com esse nome.', 'DUPLICATE');
        }
        throw new EvolutionError(msg, 'VALIDATION');
      }
      if (status === 408 || err.code === 'ECONNABORTED') {
        throw new EvolutionError('Tempo de resposta esgotado (timeout).', 'TIMEOUT');
      }
      throw new EvolutionError(
        (data?.message as string | undefined) ?? 'Erro desconhecido na API.',
        'UNKNOWN',
      );
    },
  );

  return client;
}

/** Typed error thrown by every method in this service. */
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

// ─── State normalisation ─────────────────────────────────────────────────────

export function normaliseState(raw?: EvolutionState | string | null): ConnectionStatus {
  switch ((raw ?? '').toLowerCase()) {
    case 'open':
      return 'OPEN';
    case 'connecting':
      return 'CONNECTING';
    case 'qrcode':
      return 'QRCODE';
    case 'close':
    case 'closed':
      return 'CLOSED';
    default:
      return 'OFFLINE';
  }
}

// ─── Service methods ─────────────────────────────────────────────────────────

/** List all instances registered in the Evolution API. */
export async function listInstances(): Promise<EvolutionInstanceItem[]> {
  const client = createClient();
  const { data } = await client.get<EvolutionInstanceItem[]>('/instance/fetchInstances');
  return Array.isArray(data) ? data : [];
}

/** Create a new Baileys instance and return the server response. */
export async function createInstance(name: string): Promise<EvolutionCreateResponse> {
  const client = createClient();
  const { data } = await client.post<EvolutionCreateResponse>('/instance/create', {
    instanceName: name,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
  });
  return data;
}

/** Delete an instance permanently. */
export async function deleteInstance(name: string): Promise<void> {
  const client = createClient();
  await client.delete(`/instance/delete/${name}`);
}

/**
 * Fetch the QR code for a given instance.
 * Returns the base64-encoded image string (data URI or raw base64).
 */
export async function fetchQRCode(name: string): Promise<string> {
  const client = createClient();
  const { data } = await client.get<EvolutionConnectResponse>(`/instance/connect/${name}`);

  const b64 =
    data.base64 ??
    data.qrcode?.base64 ??
    null;

  if (!b64) {
    throw new EvolutionError('QR Code expirado ou não disponível.', 'QR_EXPIRED');
  }

  // Ensure it's a proper data URI
  if (b64.startsWith('data:')) return b64;
  return `data:image/png;base64,${b64}`;
}

/** Connect (alias for fetchQRCode — triggers the connection flow). */
export const connectInstance = fetchQRCode;

/** Get the current connection state of an instance. */
export async function getConnectionState(name: string): Promise<ConnectionStatus> {
  const client = createClient();
  const { data } = await client.get<EvolutionConnectionStateResponse>(
    `/instance/connectionState/${name}`,
  );
  return normaliseState(data?.instance?.state);
}

/** Logout from WhatsApp (keeps the instance, drops the session). */
export async function logoutInstance(name: string): Promise<void> {
  const client = createClient();
  await client.delete(`/instance/logout/${name}`);
}

/** Restart an existing instance. */
export async function restartInstance(name: string): Promise<void> {
  const client = createClient();
  await client.put(`/instance/restart/${name}`);
}

/** Verify reachability and valid API key. Returns true if healthy. */
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
