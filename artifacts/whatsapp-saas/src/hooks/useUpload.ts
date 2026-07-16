/**
 * useUpload — React hook for managing the multimedia upload queue.
 *
 * Wraps uploadService (singleton) in React state so components re-render
 * whenever the queue changes. Adds drag-and-drop and paste handlers.
 *
 * Usage:
 *   const {
 *     items,       // UploadItem[] — current queue
 *     isDragging,  // boolean — user is hovering a file over the drop zone
 *     addFiles,    // (File[]) => void
 *     sendAll,     // () => Promise<void> — upload + send each item
 *     ...
 *   } = useUpload({ conversation, onSendMedia });
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { uploadService } from '@/services/upload.service';
import { classifyMimetype } from '@/services/storage/interfaces/StorageFile';
import { sendMedia, buildOptimisticMediaMessage } from '@/services/message.service';
import type { UploadItem } from '@/services/storage/interfaces/StorageUpload';
import type { Conversation, Message } from '@/types/chat';

export interface UseUploadOptions {
  conversation: Conversation | null;
  /** Called with the optimistic message immediately after each send attempt. */
  onOptimisticMessage?: (msg: Message) => void;
  /** Called with the real message once the Evolution API responds. */
  onRealMessage?: (optimisticId: string, real: Message) => void;
  /** Called when a message send fails — optimistic message should be removed. */
  onSendError?: (optimisticId: string) => void;
}

export interface UseUploadReturn {
  items: UploadItem[];
  isDragging: boolean;
  hasItems: boolean;
  /** Add files to the queue (validates each one). */
  addFiles: (files: File[]) => void;
  /** Remove a single item (revokes preview URL). */
  removeItem: (id: string) => void;
  /** Retry a failed upload. */
  retryItem: (id: string) => Promise<void>;
  /** Cancel an in-progress upload. */
  cancelItem: (id: string) => void;
  /** Update the caption for a queued item. */
  updateCaption: (id: string, caption: string) => void;
  /** Clear all completed / cancelled items from queue. */
  clearCompleted: () => void;
  /** Clear the entire queue. */
  clear: () => void;
  /** Upload all queued items and send them via the Evolution API. */
  sendAll: () => Promise<void>;
  /** DragEvent handlers — spread onto the drop zone element. */
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver:  (e: React.DragEvent) => void;
    onDrop:      (e: React.DragEvent) => void;
  };
  /** ClipboardEvent handler for Ctrl+V / paste. */
  onPaste: (e: React.ClipboardEvent | ClipboardEvent) => void;
}

export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const { conversation, onOptimisticMessage, onRealMessage, onSendError } = options;

  const [items, setItems]         = useState<UploadItem[]>(() => uploadService.getItems());
  const [isDragging, setDragging] = useState(false);
  const dragCounterRef            = useRef(0);

  // ─── Subscribe to uploadService changes ───────────────────────────────
  useEffect(() => {
    const unsub = uploadService.subscribe(setItems);
    return unsub;
  }, []);

  // ─── Add files ─────────────────────────────────────────────────────────
  const addFiles = useCallback((files: File[]) => {
    const { errors } = uploadService.prepareFiles(files);
    errors.forEach((err) => toast.error(err));
  }, []);

  // ─── Item controls ─────────────────────────────────────────────────────
  const removeItem = useCallback((id: string) => {
    uploadService.removeItem(id);
  }, []);

  const retryItem = useCallback(async (id: string) => {
    try {
      await uploadService.retryUpload(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao tentar novamente.';
      toast.error(msg);
    }
  }, []);

  const cancelItem = useCallback((id: string) => {
    uploadService.cancelUpload(id);
  }, []);

  const updateCaption = useCallback((id: string, caption: string) => {
    uploadService.updateCaption(id, caption);
  }, []);

  const clearCompleted = useCallback(() => uploadService.clearCompleted(), []);
  const clear          = useCallback(() => uploadService.clear(), []);

  // ─── Send all ──────────────────────────────────────────────────────────
  const sendAll = useCallback(async () => {
    if (!conversation) {
      toast.error('Nenhuma conversa selecionada.');
      return;
    }

    const queued = uploadService.getItems().filter(
      (it) => it.status === 'queued' || it.status === 'error',
    );
    if (!queued.length) return;

    // Use contact.phone which is always the real phone number.
    // For @lid chats, normaliseChat already resolved it from the last message key.
    const phone = conversation.contact.phone;

    for (const item of queued) {
      // 1. Upload file to storage (S3 or base64)
      let uploaded: UploadItem;
      try {
        uploaded = await uploadService.uploadItem(item.id);
      } catch {
        // uploadItem already set status='error' — skip to next
        continue;
      }

      if (!uploaded.result) continue;

      const category = classifyMimetype(item.file.type);
      const mediaUrl = uploaded.result.url;

      // For base64 results: strip the data URI prefix — Evolution API
      // expects raw base64 without the "data:image/jpeg;base64," header.
      const isBase64 = mediaUrl.startsWith('data:');
      const media    = isBase64 ? mediaUrl.split(',')[1] : mediaUrl;

      // 2. Build optimistic message for immediate UI feedback
      const optimistic = buildOptimisticMediaMessage(
        conversation.id,
        conversation.instanceName,
        category,
        item.file.type,
        isBase64 ? mediaUrl : mediaUrl,  // keep full data URI for local preview
        item.caption,
        item.file.name,
        item.file.size,
      );
      onOptimisticMessage?.(optimistic);

      // 3. Send via Evolution API
      try {
        const real = await sendMedia({
          instanceName: conversation.instanceName,
          number:       phone,
          mediatype:    category,
          mimetype:     item.file.type,
          media,
          caption:      item.caption || undefined,
          fileName:     category === 'document' ? item.file.name : undefined,
        });
        onRealMessage?.(optimistic.id, real);
        uploadService.removeItem(item.id);
      } catch (err) {
        onSendError?.(optimistic.id);
        const msg = err instanceof Error ? err.message : 'Erro ao enviar.';
        toast.error(`Falha ao enviar ${item.file.name}: ${msg}`);
      }
    }
  }, [conversation, onOptimisticMessage, onRealMessage, onSendError]);

  // ─── Drag handlers ─────────────────────────────────────────────────────
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) addFiles(files);
  }, [addFiles]);

  // ─── Paste handler ─────────────────────────────────────────────────────
  const onPaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  }, [addFiles]);

  return {
    items,
    isDragging,
    hasItems: items.length > 0,
    addFiles,
    removeItem,
    retryItem,
    cancelItem,
    updateCaption,
    clearCompleted,
    clear,
    sendAll,
    dragHandlers: { onDragEnter, onDragLeave, onDragOver, onDrop },
    onPaste,
  };
}
