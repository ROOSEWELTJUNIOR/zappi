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
import { findMessages, markAsRead, jidToPhone, isPlausiblePhoneNumber } from '@/services/chat.service';
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessages(conversation: Conversation | null) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loading, setLoading]         = useState(false);
  const [sending, setSending]         = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef   = useRef(true);
  const convIdRef    = useRef<string | null>(null);
  const pageRef      = useRef(1);
  // Always-fresh snapshot of messages for use inside send() callback
  const messagesRef  = useRef<Message[]>([]);

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

  // Keep messagesRef in sync so send() can access current messages without
  // needing them in its dependency array (avoids stale closure).
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ─── Send a message ────────────────────────────────────────────────────
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      if (!conversation || !text.trim() || sending) return false;

      const trimmed = text.trim();
      const optimistic = buildOptimisticMessage(conversation.id, trimmed, conversation.instanceName);

      // Optimistic update
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);

      try {
        // Resolve the real phone number to use with the Evolution API.
        // contact.phone is set by normaliseChat; if it's a LID (>13 digits) it wasn't
        // corrected there (e.g. no lastMessage). In that case scan loaded messages.
        let phone = conversation.contact.phone;
        if (!isPlausiblePhoneNumber(phone)) {
          const fallback = messagesRef.current.find(
            (m) => m.remoteJid && isPlausiblePhoneNumber(m.remoteJid),
          );
          if (fallback) {
            phone = jidToPhone(fallback.remoteJid);
            console.warn('[phone-fix] contact.phone inválido, usando remoteJid de mensagem', {
              invalido: conversation.contact.phone,
              fallback: phone,
            });
          } else {
            console.warn('[phone-fix] sem fallback válido, enviando com phone original', {
              phone,
            });
          }
        }
        const real = await sendText(conversation.instanceName, phone, trimmed);
        if (!mountedRef.current) return true;

        // Replace optimistic with real message
        setMessages((prev) =>
          sortAsc(
            mergeMessages(
              prev.filter((m) => m.id !== optimistic.id),
              [real],
            ),
          ),
        );
        return true;
      } catch (err) {
        if (!mountedRef.current) return false;
        // Remove optimistic on failure
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
