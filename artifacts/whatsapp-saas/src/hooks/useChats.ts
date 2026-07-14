/**
 * useChats — manages the conversation list.
 *
 * - Detects the first OPEN instance automatically via listInstances.
 * - Polls /chat/findChats every 5 s to keep the list fresh.
 * - Exposes filter/search state for the UI.
 * - Does NOT manage individual message state — that lives in useMessages.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { listInstances } from '@/services/evolution.service';
import { findChats } from '@/services/chat.service';
import type { Conversation, ChatFilter } from '@/types/chat';

const POLL_MS = 5_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChats() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [instanceName, setInstanceName]   = useState<string | null>(null);
  const [filter, setFilter]               = useState<ChatFilter>('ALL');
  const [search, setSearch]               = useState('');

  // Local-only flags (not persisted to API)
  const [favorites, setFavorites]         = useState<Set<string>>(new Set());
  const [closed, setClosed]               = useState<Set<string>>(new Set());

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // ─── Detect the first OPEN instance ─────────────────────────────────────
  const detectInstance = useCallback(async (): Promise<string | null> => {
    try {
      const instances = await listInstances();
      const open = instances.find((i) => {
        const s = typeof i.connectionStatus === 'string'
          ? i.connectionStatus
          : (i.connectionStatus as { state?: string } | undefined)?.state;
        return (s ?? '').toLowerCase() === 'open';
      });
      const name = open?.name ?? open?.instance?.instanceName ?? null;
      return name ?? null;
    } catch {
      return null;
    }
  }, []);

  // ─── Fetch conversations ─────────────────────────────────────────────────
  const fetchConversations = useCallback(
    async (instance: string, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await findChats(instance);
        if (!mountedRef.current) return;

        // Merge local-only state (favorites, closed status)
        setConversations((prev) => {
          const prevMap = new Map(prev.map((c) => [c.id, c]));
          return data.map((c) => ({
            ...c,
            isFavorite: favorites.has(c.id) || (prevMap.get(c.id)?.isFavorite ?? false),
            status: closed.has(c.id) ? 'CLOSED' : c.status,
          }));
        });
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : 'Erro ao carregar conversas.';
        if (!silent) setError(msg);
      } finally {
        if (!mountedRef.current) return;
        if (!silent) setLoading(false);
      }
    },
    [favorites, closed],
  );

  // ─── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    let instance: string | null = null;

    const init = async () => {
      instance = await detectInstance();
      if (!mountedRef.current) return;

      if (!instance) {
        setLoading(false);
        setError('Nenhuma instância conectada. Conecte uma instância no módulo Conexões.');
        return;
      }

      setInstanceName(instance);
      await fetchConversations(instance, false);

      // Start polling
      pollingRef.current = setInterval(() => {
        if (instance) fetchConversations(instance, true);
      }, POLL_MS);
    };

    init();

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Manual refresh ──────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!instanceName) return;
    await fetchConversations(instanceName, false);
  }, [instanceName, fetchConversations]);

  // ─── Toggle favorite ─────────────────────────────────────────────────────
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)),
    );
  }, []);

  // ─── Close / reopen conversation ─────────────────────────────────────────
  const closeConversation = useCallback((id: string) => {
    setClosed((prev) => new Set([...prev, id]));
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'CLOSED' } : c)),
    );
    toast.success('Conversa finalizada.');
  }, []);

  const reopenConversation = useCallback((id: string) => {
    setClosed((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'OPEN' } : c)),
    );
  }, []);

  // ─── Derived: filtered + searched list ──────────────────────────────────
  const filtered = conversations.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName  = c.contact.name.toLowerCase().includes(q);
      const matchPhone = c.contact.phone.includes(q);
      if (!matchName && !matchPhone) return false;
    }
    switch (filter) {
      case 'UNREAD':   return c.unreadCount > 0;
      case 'OPEN':     return c.status === 'OPEN';
      case 'CLOSED':   return c.status === 'CLOSED';
      case 'FAVORITE': return c.isFavorite;
      default:         return true;
    }
  });

  return {
    conversations: filtered,
    allConversations: conversations,
    loading,
    error,
    instanceName,
    filter,
    setFilter,
    search,
    setSearch,
    refresh,
    toggleFavorite,
    closeConversation,
    reopenConversation,
  };
}
