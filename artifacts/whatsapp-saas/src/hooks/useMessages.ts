/**
 * useMessages — manages the message list for an open conversation.
 *
 * - Loads the last 40 messages on conversation open.
 * - Polls every 3 s for new messages while the conversation is active.
 * - Deduplicates messages by ID (never shows duplicates).
 * - Supports "load more" (scroll to top) via pagination.
 * - Supports optimistic send (shows message immediately, then replaces on API response).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { findMessages, markAsRead, isPlausiblePhoneNumber } from '@/services/chat.service';
import { sendText, buildOptimisticMessage } from '@/services/message.service';
import type { Message, Conversation } from '@/types/chat';

const POLL_MS    = 3_000;
const PAGE_LIMIT = 40;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Merge two message arrays, deduplicating by id. */
function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const ids = new Set(existing.map((m) => m.id));
  return [...existing, ...incoming.filter((m) => !ids.has(m.id))];
}

/** Sort messages oldest → newest. */
function sortAsc(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Scan normalised messages (newest first) for the first valid real phone number.
 * Checks remoteJidAlt (propagated from key.remoteJidAlt) before remoteJid so that
 * LID-addressed chats resolve to the real number.
 * Returns null when no real phone can be determined.
 */
function resolvePhoneFromMessages(contactPhone: string, messages: Message[]): string | null {
  if (isPlausiblePhoneNumber(contactPhone)) return contactPhone;
  const newest = [...messages].reverse();
  for (const m of newest) {
    if (m.remoteJidAlt && isPlausiblePhoneNumber(m.remoteJidAlt)) return m.remoteJidAlt.split('@')[0];
  }
  for (const m of newest) {
    if (m.remoteJid && isPlausiblePhoneNumber(m.remoteJid)) return m.remoteJid.split('@')[0];
  }
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessages(conversation: Conversation | null) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loading, setLoading]         = useState(false);
  const [sending, setSending]         = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  /** Resolved real phone number for this contact. null = LID unresolved (can't send). */
  const [resolvedPhone, setResolvedPhone] = useState<string | null>(null);

  const pollingRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef        = useRef(true);
  const convIdRef         = useRef<string | null>(null);
  const pageRef           = useRef(1);
  // Always-fresh snapshots for use inside send() callback
  const messagesRef       = useRef<Message[]>([]);
  const resolvedPhoneRef  = useRef<string | null>(null);

  // ─── Load a page of messages ───────────────────────────────────────────
  const loadPage = useCallback(
    async (conv: Conversation, page: number, silent = false): Promise<Message[]> => {
      if (!silent) setLoading(true);
      try {
        const data = await findMessages(conv.instanceName, conv.id, page, PAGE_LIMIT);
        if (!mountedRef.current) return [];
        setHasMore(data.length === PAGE_LIMIT);
        return data;
      } catch (err) {
        if (!mountedRef.current) return [];
        if (!silent) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar mensagens.';
          toast.error(msg);
        }
        return [];
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
      }
    },
    [],
  );

  // ─── Load older messages (pagination) ─────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!conversation || !hasMore || loading) return;
    const nextPage = pageRef.current + 1;
    const older = await loadPage(conversation, nextPage, false);
    if (!mountedRef.current) return;
    setMessages((prev) => sortAsc(mergeMessages(older, prev)));
    pageRef.current = nextPage;
    setCurrentPage(nextPage);
  }, [conversation, hasMore, loading, loadPage]);

  // ─── Poll for new messages (always page 1 — newest messages) ──────────
  const pollMessages = useCallback(async (conv: Conversation) => {
    const fresh = await loadPage(conv, 1, true);
    if (!mountedRef.current) return;
    setMessages((prev) => sortAsc(mergeMessages(prev, fresh)));
  }, [loadPage]);

  // ─── Reset when conversation changes ──────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // Stop previous polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!conversation) {
      setMessages([]);
      setLoading(false);
      setHasMore(false);
      convIdRef.current = null;
      pageRef.current = 1;
      setCurrentPage(1);
      return;
    }

    // New conversation opened
    convIdRef.current = conversation.id;
    pageRef.current = 1;
    setCurrentPage(1);
    setMessages([]);
    setHasMore(false);

    const init = async () => {
      const initial = await loadPage(conversation, 1, false);
      if (!mountedRef.current || convIdRef.current !== conversation.id) return;
      setMessages(sortAsc(initial));

      // Mark unread as read (best effort)
      if (conversation.unreadCount > 0) {
        const toRead = initial
          .filter((m) => !m.fromMe)
          .slice(0, conversation.unreadCount)
          .map((m) => ({ remoteJid: m.remoteJid, id: m.id, fromMe: false }));
        markAsRead(conversation.instanceName, toRead).catch(() => {/* non-fatal */});
      }

      // Start polling
      pollingRef.current = setInterval(() => {
        if (convIdRef.current === conversation.id) {
          pollMessages(conversation);
        }
      }, POLL_MS);
    };

    init();

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  // Keep refs in sync so send() can access current values without stale closures.
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { resolvedPhoneRef.current = resolvedPhone; }, [resolvedPhone]);

  // Recompute resolvedPhone whenever messages or the conversation changes.
  useEffect(() => {
    if (!conversation) {
      setResolvedPhone(null);
      return;
    }
    setResolvedPhone(resolvePhoneFromMessages(conversation.contact.phone, messages));
  }, [messages, conversation?.id, conversation?.contact.phone]);

  // ─── Send a message ────────────────────────────────────────────────────
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      if (!conversation || !text.trim() || sending) return false;

      const trimmed = text.trim();
      const optimistic = buildOptimisticMessage(conversation.id, trimmed, conversation.instanceName);

      setMessages((prev) => [...prev, optimistic]);
      setSending(true);

      try {
        const phone = resolvedPhoneRef.current;
        let real: Message;

        if (phone) {
          // Attempt 1: real phone number resolved from message history
          real = await sendText(conversation.instanceName, phone, trimmed);
        } else {
          // Attempt 2: direct LID send — Baileys has an internal LID→JID map and can
          // route the message even without a resolved phone number.
          const lidAddress = `${conversation.id.split('@')[0]}@lid`;
          try {
            real = await sendText(conversation.instanceName, lidAddress, trimmed);
          } catch {
            if (!mountedRef.current) return false;
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            toast.error('Número real não disponível — contato usa modo privado do WhatsApp (LID).');
            return false;
          }
        }

        if (!mountedRef.current) return true;
        setMessages((prev) =>
          sortAsc(mergeMessages(prev.filter((m) => m.id !== optimistic.id), [real])),
        );
        return true;
      } catch (err) {
        if (!mountedRef.current) return false;
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        const msg = err instanceof Error ? err.message : 'Erro ao enviar mensagem.';
        toast.error(msg);
        return false;
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    [conversation, sending],
  );

  // ─── Media message helpers (used by MessageInput / useUpload) ────────

  /** Add an optimistic media message immediately to the list. */
  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => sortAsc([...prev, msg]));
  }, []);

  /** Replace an optimistic message with the real one from the API. */
  const replaceMessage = useCallback((optimisticId: string, real: Message) => {
    setMessages((prev) =>
      sortAsc(
        mergeMessages(
          prev.filter((m) => m.id !== optimisticId),
          [real],
        ),
      ),
    );
  }, []);

  /** Remove a message by ID (used to roll back failed optimistic sends). */
  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return {
    messages,
    loading,
    sending,
    hasMore,
    currentPage,
    loadMore,
    send,
    addMessage,
    replaceMessage,
    removeMessage,
  };
}
