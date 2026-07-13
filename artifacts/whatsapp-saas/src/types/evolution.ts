/** Raw connection state values returned by the Evolution API. */
export type EvolutionState = 'open' | 'close' | 'connecting' | 'qrcode' | 'refused';

/** Normalised status used internally by the UI. */
export type ConnectionStatus = 'OPEN' | 'CONNECTING' | 'QRCODE' | 'OFFLINE' | 'CLOSED';

// ─── Instance shapes ─────────────────────────────────────────────────────────

export interface EvolutionInstanceInfo {
  instanceName: string;
  integration?: string;
  token?: string;
  serverUrl?: string;
  apikey?: string;
  status?: string;
}

export interface EvolutionProfilePicture {
  wuid?: string;
  profilePictureUrl?: string;
}

export interface EvolutionConnectionStatus {
  state: EvolutionState;
}

/** One element from the `GET /instance/fetchInstances` response array. */
export interface EvolutionInstanceItem {
  instance: EvolutionInstanceInfo;
  connectionStatus?: EvolutionConnectionStatus;
  profilePicUrl?: string | null;
  profileName?: string | null;
  profileStatus?: string | null;
  phoneNumber?: string | null;
}

/** Response from `GET /instance/connectionState/{name}`. */
export interface EvolutionConnectionStateResponse {
  instance: {
    instanceName: string;
    state: EvolutionState;
  };
}

/** Response from `GET /instance/connect/{name}` (QR code). */
export interface EvolutionConnectResponse {
  base64?: string;
  code?: string;
  count?: number;
  /** Some versions wrap in a `qrcode` object. */
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

// ─── UI model ────────────────────────────────────────────────────────────────

/** Normalised connection model used by all UI components. */
export interface Connection {
  instanceName: string;
  displayName: string;
  status: ConnectionStatus;
  phone?: string | null;
  profilePicUrl?: string | null;
  profileName?: string | null;
  createdAt?: string | null;
}
