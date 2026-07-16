/**
 * MessageInput — text + multimedia input bar.
 *
 * Extends the original component (onSend / sending / disabled props unchanged)
 * with full multimedia support:
 *
 *  • Paperclip → file picker (all allowed types, multiple)
 *  • Drag & Drop onto the entire input area
 *  • Ctrl+V / paste image from clipboard / PrintScreen
 *  • FilePreviewPanel shown above the input when files are queued
 *  • Upload progress per file with cancel / retry
 *  • Text send (Enter) untouched
 *
 * All uploads route through useUpload → uploadService → storageService.
 * The component never touches S3 or base64 directly.
 */
import {
  useState, useRef, useCallback, useEffect,
  KeyboardEvent, ChangeEvent,
} from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilePreviewPanel } from './FilePreviewPanel';
import { useUpload } from '@/hooks/useUpload';
import type { Message, Conversation } from '@/types/chat';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageInputProps {
  /** Original prop — sends plain text; must be preserved as-is. */
  onSend: (text: string) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
  /** Passed through from ChatWindow so useUpload can optimistically update messages. */
  conversation?: Conversation | null;
  onOptimisticMessage?: (msg: Message) => void;
  onRealMessage?: (optimisticId: string, real: Message) => void;
  onSendError?: (optimisticId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MessageInput({
  onSend,
  sending,
  disabled,
  conversation = null,
  onOptimisticMessage,
  onRealMessage,
  onSendError,
}: MessageInputProps) {
  const [text, setText]         = useState('');
  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const fileInputRef            = useRef<HTMLInputElement>(null);
  const dropZoneRef             = useRef<HTMLDivElement>(null);

  // ─── Upload hook ──────────────────────────────────────────────────────
  const {
    items,
    isDragging,
    hasItems,
    addFiles,
    removeItem,
    cancelItem,
    retryItem,
    updateCaption,
    clear,
    sendAll,
    dragHandlers,
    onPaste,
  } = useUpload({
    conversation,
    onOptimisticMessage,
    onRealMessage,
    onSendError,
  });

  // ─── Textarea auto-resize ─────────────────────────────────────────────
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  // ─── Text send ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    const ok = await onSend(trimmed);
    if (ok) {
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }, [text, sending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ─── File picker ──────────────────────────────────────────────────────
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) addFiles(files);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }, [addFiles]);

  // ─── Global paste listener (captures PrintScreen & clipboard images) ──
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      // Only handle paste when the input area is focused or no modal is open
      const active = document.activeElement;
      const isInChat =
        active === textareaRef.current ||
        dropZoneRef.current?.contains(active as Node);
      if (!isInChat) return;
      onPaste(e);
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [onPaste]);

  const canSend    = text.trim().length > 0 && !sending && !disabled;
  const isBusy     = disabled || sending;

  return (
    <div className="shrink-0 bg-card">
      {/* File preview panel — shown when files are queued */}
      {hasItems && (
        <FilePreviewPanel
          items={items}
          onRemove={removeItem}
          onCancel={cancelItem}
          onRetry={retryItem}
          onCaptionChange={updateCaption}
          onClear={clear}
          onSendAll={sendAll}
          disabled={isBusy}
        />
      )}

      {/* Input bar */}
      <div
        ref={dropZoneRef}
        className={[
          'relative p-3 transition-all',
          isDragging
            ? 'ring-2 ring-primary/50 ring-inset bg-primary/5'
            : '',
        ].join(' ')}
        {...dragHandlers}
      >
        {/* Drag-over overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/60 bg-primary/5 backdrop-blur-[2px] pointer-events-none">
            <Paperclip className="w-8 h-8 text-primary/70" />
            <span className="text-sm font-medium text-primary/80">Solte os arquivos aqui</span>
          </div>
        )}

        <div
          className={[
            'flex items-end gap-2 bg-background border rounded-xl p-2 transition-all',
            canSend || text.length > 0
              ? 'border-primary/50 ring-1 ring-primary/20'
              : 'border-border',
          ].join(' ')}
        >
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
            title="Anexar arquivo"
            disabled={isBusy}
            onClick={openFilePicker}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Emoji placeholder */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
            title="Emoji (em breve)"
            disabled={isBusy}
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={isDragging ? 'Solte aqui…' : 'Digite uma mensagem…'}
            rows={1}
            disabled={isBusy}
            className={[
              'flex-1 bg-transparent resize-none outline-none py-1.5 text-sm',
              'placeholder:text-muted-foreground/60 leading-relaxed',
              'min-h-[36px] max-h-32 overflow-y-auto',
              isBusy ? 'cursor-not-allowed opacity-50' : '',
            ].join(' ')}
          />

          {/* Send button */}
          <Button
            size="icon"
            className={[
              'shrink-0 h-9 w-9 rounded-lg transition-all',
              canSend
                ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(124,58,237,0.35)] hover:shadow-[0_0_18px_rgba(124,58,237,0.5)]'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            ].join(' ')}
            onClick={handleSend}
            disabled={!canSend}
            title="Enviar (Enter)"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 text-right mt-1 pr-1">
          Enter para enviar · Shift+Enter para nova linha · Ctrl+V para colar imagem
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv,.json,.apk"
        onChange={handleFileChange}
      />
    </div>
  );
}
