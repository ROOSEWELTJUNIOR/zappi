import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Paperclip, Mic, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSend: (text: string) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
}

export function MessageInput({ onSend, sending, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setText('');
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onSend(trimmed);
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

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <div className="p-3 bg-card border-t border-border shrink-0">
      <div
        className={[
          'flex items-end gap-2 bg-background border rounded-xl p-2 transition-all',
          canSend || text.length > 0
            ? 'border-primary/50 ring-1 ring-primary/20'
            : 'border-border',
        ].join(' ')}
      >
        {/* Attachment (placeholder) */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
          title="Anexo (em breve)"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Emoji (placeholder) */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
          title="Emoji (em breve)"
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          rows={1}
          disabled={disabled || sending}
          className={[
            'flex-1 bg-transparent resize-none outline-none py-1.5 text-sm',
            'placeholder:text-muted-foreground/60 leading-relaxed',
            'min-h-[36px] max-h-32 overflow-y-auto',
            disabled ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        />

        {/* Audio (placeholder) */}
        {!text.trim() && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
            title="Áudio (em breve)"
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}

        {/* Send */}
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
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </div>
  );
}
