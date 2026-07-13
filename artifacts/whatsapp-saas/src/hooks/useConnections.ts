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
  normaliseState,
  EvolutionError,
} from '@/services/evolution.service';
import type { Connection } from '@/types/evolution';

const POLL_INTERVAL_MS = 5_000;

function mapToConnection(item: Awaited<ReturnType<typeof listInstances>>[number]): Connection {
  return {
    instanceName: item.instance.instanceName,
    displayName: item.instance.instanceName,
    status: normaliseState(item.connectionStatus?.state),
    phone: item.phoneNumber ?? null,
    profilePicUrl: item.profilePicUrl ?? null,
    profileName: item.profileName ?? null,
    createdAt: null,
  };
}

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch all instances ────────────────────────────────────────────────
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const items = await listInstances();
      setConnections(items.map(mapToConnection));
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao carregar conexões.';
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ─── Polling ────────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => fetchAll(true), POLL_INTERVAL_MS);
  }, [fetchAll]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchAll();
    startPolling();
    return () => stopPolling();
  }, [fetchAll, startPolling, stopPolling]);

  // ─── Update a single connection's status ────────────────────────────────
  const refreshStatus = useCallback(async (instanceName: string) => {
    try {
      const status = await getConnectionState(instanceName);
      setConnections((prev) =>
        prev.map((c) => (c.instanceName === instanceName ? { ...c, status } : c)),
      );
      return status;
    } catch {
      return null;
    }
  }, []);

  // ─── Create new instance ────────────────────────────────────────────────
  const addConnection = useCallback(async (name: string): Promise<boolean> => {
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
  }, [fetchAll]);

  // ─── Delete instance ────────────────────────────────────────────────────
  const removeConnection = useCallback(async (instanceName: string) => {
    try {
      await deleteInstance(instanceName);
      setConnections((prev) => prev.filter((c) => c.instanceName !== instanceName));
      toast.success('Instância excluída com sucesso.');
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao excluir instância.';
      toast.error(msg);
    }
  }, []);

  // ─── Logout instance ────────────────────────────────────────────────────
  const disconnectConnection = useCallback(async (instanceName: string) => {
    try {
      await logoutInstance(instanceName);
      setConnections((prev) =>
        prev.map((c) =>
          c.instanceName === instanceName ? { ...c, status: 'OFFLINE' as const } : c,
        ),
      );
      toast.success('Desconectado com sucesso.');
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao desconectar.';
      toast.error(msg);
    }
  }, []);

  // ─── Restart instance ───────────────────────────────────────────────────
  const reconnectConnection = useCallback(async (instanceName: string) => {
    try {
      await restartInstance(instanceName);
      toast.success('Instância reiniciada.');
      setTimeout(() => refreshStatus(instanceName), 2000);
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao reconectar.';
      toast.error(msg);
    }
  }, [refreshStatus]);

  // ─── Fetch QR code ──────────────────────────────────────────────────────
  const getQRCode = useCallback(async (instanceName: string): Promise<string | null> => {
    try {
      return await fetchQRCode(instanceName);
    } catch (err) {
      const msg =
        err instanceof EvolutionError ? err.message : 'Erro ao buscar QR Code.';
      toast.error(msg);
      return null;
    }
  }, []);

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
