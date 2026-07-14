/**
 * Evolution API — type definitions.
 * All raw API shapes and normalised UI models live here.
 * Components never import raw API types directly; they use the UI models below.
 */

// ─── Raw API state strings ────────────────────────────────────────────────────

/** Raw connection state values returned by the Evolution API (any version). */
export type EvolutionState =
  | 'open'
  | 'close'
  | 'closed'
  | 'connecting'
  | 'qrcode'
  | 'refused'
  | 'disconnected'
  | 'unknown';

// ─── Normalised UI status ─────────────────────────────────────────────────────

/**
 * Status values used by the UI. Derived from EvolutionState via normaliseState().
 * - OPEN        – WhatsApp session is live
 * - CONNECTING  – handshake in progress
 * - QRCODE      – waiting for QR scan
 * - CLOSED      – session closed by server
 * - DISCONNECTED– explicit logout / session dropped
 * - ERROR       – unknown/error state
 * - OFFLINE     – instance unreachable
 */
export type ConnectionStatus =
  | 'OPEN'
  | 'CONNECTING'
  | 'QRCODE'
  | 'CLOSED'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'OFFLINE';

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface EvolutionProfile {
  name?: string;
  pushName?: string;
  id?: string;
  numberExists?: boolean;
  picture?: string;
  status?: string;
}

// ─── QR Code ─────────────────────────────────────────────────────────────────

export interface QRCodeData {
  base64: string;
  code?: string;
}

// ─── Raw API response shapes ──────────────────────────────────────────────────

export interface EvolutionInstanceInfo {
  instanceName: string;
  integration?: string;
  token?: string;
  serverUrl?: string;
  apikey?: string;
  status?: string;
}

export interface EvolutionConnectionStatus {
  state: EvolutionState;
}

/**
 * One element from `GET /instance/fetchInstances`.
 *
 * Evolution API v2.x (≥ 2.0) returns a FLAT object — no nested `instance` wrapper.
 * v1.x returned { instance: { instanceName }, connectionStatus: { state } }.
 * We support both shapes in the adapter (normaliseInstance).
 */
export interface EvolutionInstanceItem {
  // ── v2.x flat fields ────────────────────────────────────────────────────
  id?: string;
  name?: string;                       // instanceName in v2
  connectionStatus?: string | EvolutionConnectionStatus; // flat string in v2
  number?: string | null;              // phone number in v2
  ownerJid?: string | null;
  clientName?: string | null;
  token?: string | null;
  integration?: string | null;

  // ── v1.x nested fields (kept for backward compat) ────────────────────
  instance?: EvolutionInstanceInfo;

  // ── Profile — present in both versions when connected ────────────────
  profilePicUrl?: string | null;
  profileName?: string | null;
  profileStatus?: string | null;
  phoneNumber?: string | null;         // v1 field name
}

/** Response from `GET /instance/connectionState/{name}`. */
export interface EvolutionConnectionStateResponse {
  instance: {
    instanceName: string;
    state: EvolutionState;
  };
  /** Some API versions return state at the top level. */
  state?: EvolutionState;
}

/** Response from `GET /instance/connect/{name}` (QR code). */
export interface EvolutionConnectResponse {
  base64?: string;
  code?: string;
  count?: number;
  /** v1 wraps the QR in a `qrcode` object. */
  qrcode?: {
    base64?: string;
    code?: string;
  };
}

/** Response from `POST /instance/create`. */
export interface EvolutionCreateResponse {
  instance: EvolutionInstanceInfo;
  qrcode?: {
    base64?: string;
    code?: string;
  };
  hash?: {
    apikey: string;
  };
}

/** Response from `GET /` — server info. */
export interface EvolutionApiInfo {
  version?: string;
  description?: string;
  status?: string;
  /** Some versions expose it under `message`. */
  message?: string;
}

// ─── UI model ─────────────────────────────────────────────────────────────────

/** Normalised connection model — used by all UI components. Never raw API shape. */
export interface Connection {
  instanceName: string;
  displayName: string;
  status: ConnectionStatus;
  phone?: string | null;
  profilePicUrl?: string | null;
  profileName?: string | null;
  pushName?: string | null;
  lastUpdated: Date;
  createdAt?: string | null;
}
