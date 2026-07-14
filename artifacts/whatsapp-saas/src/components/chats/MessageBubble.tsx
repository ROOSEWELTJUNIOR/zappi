import { memo } from 'react';
import { Check, CheckCheck, Clock, Image, FileText, Mic, Video, MapPin, User, Smile } from 'lucide-react';
import type { Message, MessageStatus } from '@/types/chat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'PENDING':
      return <Clock className="w-3 h-3" />;
    case 'SENT':
      return <Check className="w-3 h-3" />;
    case 'DELIVERED':
      return <CheckCheck className="w-3 h-3" />;
    case 'READ':
      return <CheckCheck className="w-3 h-3 text-sky-400" />;
  }
}

// ─── Media placeholder components ────────────────────────────────────────────

function ImagePlaceholder({ caption }: { caption?: string }) {
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="w-48 h-36 bg-black/10 flex items-center justify-center rounded-lg border border-border/40">
        <Image className="w-8 h-8 opacity-30" />
      </div>
      {caption && <p className="text-sm mt-1">{caption}</p>}
    </div>
  );
}

function AudioPlaceholder() {
  return (
    <div className="flex items-center gap-3 bg-black/5 rounded-xl px-3 py-2.5 min-w-[180px]">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Mic className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 h-1 bg-border rounded-full" />
      <span className="text-xs text-muted-foreground shrink-0">0:00</span>
    </div>
  );
}

function VideoPlaceholder({ caption }: { caption?: string }) {
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="w-48 h-36 bg-black/10 flex items-center justify-center rounded-lg border border-border/40">
        <Video className="w-8 h-8 opacity-30" />
      </div>
      {caption && <p className="text-sm mt-1">{caption}</p>}
    </div>
  );
}

function DocumentPlaceholder({ fileName }: { fileName?: string }) {
  return (
    <div className="flex items-center gap-3 bg-black/5 rounded-xl px-3 py-2.5 min-w-[180px]">
      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-blue-500" />
      </div>
      <span className="text-sm truncate max-w-[130px]">{fileName ?? 'Documento'}</span>
    </div>
  );
}

function StickerPlaceholder() {
  return (
    <div className="w-20 h-20 bg-black/5 rounded-xl flex items-center justify-center">
      <Smile className="w-8 h-8 opacity-30" />
    </div>
  );
}

function LocationPlaceholder({ content }: { content: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <MapPin className="w-4 h-4 text-red-500 shrink-0" />
      <span>{content || 'Localização'}</span>
    </div>
  );
}

function ContactPlaceholder({ content }: { content: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <User className="w-4 h-4 text-primary shrink-0" />
      <span>{content || 'Contato'}</span>
    </div>
  );
}

// ─── Message content renderer ─────────────────────────────────────────────────

function MessageContent({ message }: { message: Message }) {
  const { type, content, attachment } = message;

  switch (type) {
    case 'image':
      return <ImagePlaceholder caption={content || attachment?.caption} />;
    case 'audio':
      return <AudioPlaceholder />;
    case 'video':
      return <VideoPlaceholder caption={content || attachment?.caption} />;
    case 'document':
      return <DocumentPlaceholder fileName={attachment?.fileName ?? content} />;
    case 'sticker':
      return <StickerPlaceholder />;
    case 'location':
      return <LocationPlaceholder content={content} />;
    case 'contact':
      return <ContactPlaceholder content={content} />;
    case 'unknown':
      return (
        <span className="text-sm italic text-muted-foreground">
          [mensagem não suportada]
        </span>
      );
    default:
      // text / reaction / extendedText
      return (
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </p>
      );
  }
}

// ─── Date separator ───────────────────────────────────────────────────────────

export function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] font-medium bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full text-muted-foreground">
        {formatDate(date)}
      </span>
    </div>
  );
}

// ─── Main bubble ──────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.fromMe;

  return (
    <div className={`flex gap-2 max-w-[80%] ${isOutgoing ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {/* Bubble */}
      <div
        className={[
          'relative px-3 py-2 rounded-2xl shadow-sm',
          isOutgoing
            ? 'bg-primary text-primary-foreground rounded-br-sm shadow-[0_2px_8px_rgba(124,58,237,0.2)]'
            : 'bg-card border border-border rounded-bl-sm',
        ].join(' ')}
      >
        <MessageContent message={message} />

        {/* Time + status */}
        <div
          className={`flex items-center gap-1 mt-1 justify-end ${
            isOutgoing ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          <span className="text-[10px]">{formatTime(message.timestamp)}</span>
          {isOutgoing && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
});
