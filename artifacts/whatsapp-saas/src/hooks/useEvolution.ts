/**
 * useEvolution — central hook for all WhatsApp connection state.
 *
 * Smart polling strategy:
 * - Always polls every 5 s when the page is mounted.
 * - When ANY connection is in QRCODE or CONNECTING state, polls every 2 s instead.
 * - As soon as all connections are stable (OPEN / CLOSED / OFFLINE / etc.), reverts to 5 s.
 * - When a connection transitions to OPEN, its fresh profile is fetched automatically.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  listInstances,
  createInstance,
  deleteInstance,
  logoutInstance,
  restartInstance,
  getConnectionState,
  fetchQRCode,
  fetchProfile,
  normaliseState,
  EvolutionError,
} from '@/services/evolution.service';
import type { Connection, ConnectionStatus } from '@/types/evolution';

// Polling intervals
const POLL_IDLE_MS    = 5_000;  // normal — no pending connections
const POLL_ACTIVE_MS  = 2_000;  // fast   — at least one QRCODE / CONNECTING

/** Whether a status requires fast polling. */
function isPending(s: ConnectionStatus): boolean {
  return s === 'QRCODE' || s === 'CONNECTING';
}

// ─── Adapter: raw instance → Connection UI model ─────────────────────────────
//
// Evolution API v2.x (≥ 2.0) returns a FLAT object:
//   { name, connectionStatus: "connecting", number, profileName, profilePicUrl }
//
// v1.x returned a nested object:
//   { instance: { instanceName }, connectionStatus: { state: "connecting" }, phoneNumber }
//
// This function handles BOTH shapes transparently.

function resolveInstanceName(item: Awaited<ReturnType<typeof listInstances>>[number]): string {
  // v2: item.name  |  v1: item.instance.instanceName
  return item.name ?? item.instance?.instanceName ?? 'unknown';
}

function resolveConnectionStatus(
  item: Awaited<ReturnType<typeof listInstances>>[number],
): string | null {
  if (!item.connectionStatus) return null;
  // v2: connectionStatus is a plain string ("connecting", "open", …)
  if (typeof item.connectionStatus === 'string') return item.connectionStatus;
  // v1: connectionStatus is { state: "connecting" }
  return (item.connectionStatus as { state?: string }).state ?? null;
}

function resolvePhone(item: Awaited<ReturnType<typeof listInstances>>[number]): string | null {
  // v2: `number`  |  v1: `phoneNumber`
  return item.number ?? item.phoneNumber ?? null;
}

function mapToConnection(
  item: Awaited<ReturnType<typeof listInstances>>[number],
): Connection {
  const instanceName = resolveInstanceName(item);
  return {
    instanceName,
    displayName:   item.profileName ?? instanceName,
    status:        normaliseState(resolveConnectionStatus(item)),
    phone:         resolvePhone(item),
    profilePicUrl: item.profilePicUrl ?? null,
    profileName:   item.profileName   ?? null,
    pushName:      item.profileName   ?? null,
    lastUpdated:   new Date(),
    createdAt:     null,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useEvolution() {
  const [connections, setConnections]   = useState<Connection[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Track previous statuses so we can react to OPEN transitions
  const prevStatusRef = useRef<Map<string, ConnectionStatus>>(new Map());
  const pollingRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch all instances (adapter runs inside mapToConnection) ───────────
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const items = await listInstances();
      const next  = items.map(mapToConnection);

      setConnections((prev) => {
        // Detect OPEN transitions to trigger profile refresh
        const prevMap = new Map(prev.map((c) => [c.instanceName, c]));
        next.forEach((c) => {
          const was = prevStatusRef.current.get(c.instanceName);
          if (c.status === 'OPEN' && was && was !== 'OPEN') {
            // Profile just became available — re-fetch and merge
            fetchProfile(c.instanceName).then((profile) => {
              if (!profile) return;
              setConnections((cur) =>
                cur.map((x) =>
                  x.instanceName === c.instanceName
                    ? {
                        ...x,
                        profileName:   profile.name   ?? x.profileName,
                        profilePicUrl: profile.picture ?? x.profilePicUrl,
                        pushName:      profile.pushName ?? x.pushName,
                        lastUpdated:   new Date(),
                      }
                    : x,
                ),
              );
            });
            toast.success('WhatsApp conectado com sucesso! 🎉');
          }
          // Keep the old profilePicUrl/profileName if the new fetch has none
          // (avoids avatar flicker during polling)
          const old = prevMap.get(c.instanceName);
          if (old && c.status === 'OPEN') {
            c.profilePicUrl = c.profilePicUrl ?? old.profilePicUrl;
            c.profileName   = c.profileName   ?? old.profileName;
            c.pushName      = c.pushName      ?? old.pushName;
            c.phone         = c.phone         ?? old.phone;
          }
        });
        // Update status history
        prevStatusRef.current = new Map(next.map((c) => [c.instanceName, c.status]));
        return next;
      });
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao carregar conexões.';
      if (!silent) setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ─── Smart polling ───────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (interval: number) => {
      stopPolling();
      pollingRef.current = setInterval(() => fetchAll(true), interval);
    },
    [fetchAll, stopPolling],
  );

  // Adjust polling speed based on current connection statuses
  useEffect(() => {
    const hasPending = connections.some((c) => isPending(c.status));
    startPolling(hasPending ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    return stopPolling;
  }, [connections, startPolling, stopPolling]);

  // Initial load
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Refresh a single connection's status ────────────────────────────────
  const refreshStatus = useCallback(
    async (instanceName: string): Promise<ConnectionStatus | null> => {
      try {
        const status = await getConnectionState(instanceName);
        setConnections((prev) =>
          prev.map((c) =>
            c.instanceName === instanceName
              ? { ...c, status, lastUpdated: new Date() }
              : c,
          ),
        );
        return status;
      } catch {
        return null;
      }
    },
    [],
  );

  // ─── Create ──────────────────────────────────────────────────────────────
  const addConnection = useCallback(
    async (name: string): Promise<boolean> => {
      try {
        await createInstance(name);
        await fetchAll(true);
        return true;
      } catch (err) {
        const msg =
          err instanceof EvolutionError ? err.message : 'Erro ao criar conexão.';
        toast.error(msg);
        return false;
      }
    },
    [fetchAll],
  );

  // ─── Delete ──────────────────────────────────────────────────────────────
  const removeConnection = useCallback(async (instanceName: string) => {
    try {
      await deleteInstance(instanceName);
      setConnections((prev) => prev.filter((c) => c.instanceName !== instanceName));
      prevStatusRef.current.delete(instanceName);
      toast.success('Instância excluída com sucesso.');
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao excluir instância.';
      toast.error(msg);
    }
  }, []);

  // ─── Disconnect (logout) ─────────────────────────────────────────────────
  const disconnectConnection = useCallback(async (instanceName: string) => {
    try {
      await logoutInstance(instanceName);
      setConnections((prev) =>
        prev.map((c) =>
          c.instanceName === instanceName
            ? { ...c, status: 'DISCONNECTED' as const, lastUpdated: new Date() }
            : c,
        ),
      );
      toast.success('Desconectado com sucesso.');
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao desconectar.';
      toast.error(msg);
    }
  }, []);

  // ─── Reconnect (restart) ─────────────────────────────────────────────────
  const reconnectConnection = useCallback(
    async (instanceName: string) => {
      try {
        await restartInstance(instanceName);
        toast.success('Instância reiniciada. Aguardando conexão…');
        // Give the API a moment, then refresh status
        setTimeout(() => refreshStatus(instanceName), 2_000);
      } catch (err) {
        const msg =
          err instanceof EvolutionError ? err.message : 'Erro ao reconectar.';
        toast.error(msg);
      }
    },
    [refreshStatus],
  );

  // ─── QR Code ─────────────────────────────────────────────────────────────
  const getQRCode = useCallback(
    async (instanceName: string): Promise<string | null> => {
      try {
        return await fetchQRCode(instanceName);
      } catch (err) {
        const msg =
          err instanceof EvolutionError ? err.message : 'Erro ao buscar QR Code.';
        toast.error(msg);
        return null;
      }
    },
    [],
  );

  return {
    connections,
    loading,
    error,
    fetchAll,
    addConnection,
    removeConnection,
    disconnectConnection,
    reconnectConnection,
    refreshStatus,
    getQRCode,
  };
}
