/**
 * MessageBubble — renders a single chat message bubble.
 *
 * Routes each MessageType to its dedicated media component:
 *  image    → MediaMessageImage
 *  video    → MediaMessageVideo
 *  audio    → MediaMessageAudio
 *  document → MediaMessageDocument
 *  sticker  → MediaMessageSticker
 *  location → MediaMessageLocation
 *  contact  → MediaMessageContact
 *  gif      → MediaMessageImage (treated as animated image)
 *  text / reaction / poll / unknown → inline renderers
 *
 * All media components are lazy-loaded to keep the initial bundle small.
 * DateSeparator is kept as a named export (used by ChatWindow).
 */
import { memo, lazy, Suspense } from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import type { Message, MessageStatus } from '@/types/chat';

// ─── Lazy media components ─────────────────────────────────────────────────────

const MediaMessageImage    = lazy(() => import('./media/MediaMessageImage').then((m) => ({ default: m.MediaMessageImage })));
const MediaMessageVideo    = lazy(() => import('./media/MediaMessageVideo').then((m) => ({ default: m.MediaMessageVideo })));
const MediaMessageAudio    = lazy(() => import('./media/MediaMessageAudio').then((m) => ({ default: m.MediaMessageAudio })));
const MediaMessageDocument = lazy(() => import('./media/MediaMessageDocument').then((m) => ({ default: m.MediaMessageDocument })));
const MediaMessageSticker  = lazy(() => import('./media/MediaMessageSticker').then((m) => ({ default: m.MediaMessageSticker })));
const MediaMessageLocation = lazy(() => import('./media/MediaMessageLocation').then((m) => ({ default: m.MediaMessageLocation })));
const MediaMessageContact  = lazy(() => import('./media/MediaMessageContact').then((m) => ({ default: m.MediaMessageContact })));

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
    case 'PENDING':   return <Clock     className="w-3 h-3" />;
    case 'SENT':      return <Check     className="w-3 h-3" />;
    case 'DELIVERED': return <CheckCheck className="w-3 h-3" />;
    case 'READ':      return <CheckCheck className="w-3 h-3 text-sky-400" />;
  }
}

// ─── Fallback skeleton (while lazy component loads) ───────────────────────────

function MediaSkeleton() {
  return (
    <div className="w-48 h-28 rounded-xl bg-muted/30 animate-pulse" />
  );
}

// ─── Message content router ───────────────────────────────────────────────────

function MessageContent({ message }: { message: Message }) {
  const { type, content, attachment, fromMe } = message;

  switch (type) {
    case 'image':
      return (
        <Suspense fallback={<MediaSkeleton />}>
          <MediaMessageImage
            attachment={attachment ?? { type: 'image' }}
            fromMe={fromMe}
          />
        </Suspense>
      );

    case 'gif':
      // GIF treated as image; the attachment carries the video URL
      return (
        <Suspense fallback={<MediaSkeleton />}>
          <MediaMessageImage
            attachment={{ ...(attachment ?? { type: 'image' }), type: 'image' }}
            fromMe={fromMe}
          />
        </Suspense>
      );

    case 'video':
      return (
        <Suspense fallback={<MediaSkeleton />}>
          <MediaMessageVideo attachment={attachment ?? { type: 'video' }} />
        </Suspense>
      );

    case 'audio':
      return (
        <Suspense fallback={
          <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5 min-w-[220px] animate-pulse">
            <div className="w-9 h-9 rounded-full bg-muted/60" />
            <div className="flex-1 h-2 bg-muted/60 rounded" />
          </div>
        }>
          <MediaMessageAudio
            attachment={attachment ?? { type: 'audio' }}
            fromMe={fromMe}
          />
        </Suspense>
      );

    case 'document':
      return (
        <Suspense fallback={
          <div className="flex items-center gap-3 bg-muted/20 rounded-xl px-3 py-2.5 min-w-[200px] animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 bg-muted/60 rounded w-3/4" />
              <div className="h-2 bg-muted/40 rounded w-1/2" />
            </div>
          </div>
        }>
          <MediaMessageDocument
            attachment={attachment ?? { type: 'document' }}
            content={content}
            fromMe={fromMe}
          />
        </Suspense>
      );

    case 'sticker':
      return (
        <Suspense fallback={<div className="w-28 h-28 rounded-xl bg-muted/20 animate-pulse" />}>
          <MediaMessageSticker attachment={attachment ?? { type: 'sticker' }} />
        </Suspense>
      );

    case 'location':
      return (
        <Suspense fallback={<MediaSkeleton />}>
          <MediaMessageLocation message={message} />
        </Suspense>
      );

    case 'contact':
      return (
        <Suspense fallback={
          <div className="flex items-center gap-3 bg-muted/20 rounded-xl px-3 py-2.5 min-w-[180px] animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 bg-muted/60 rounded w-2/3" />
            </div>
          </div>
        }>
          <MediaMessageContact message={message} />
        </Suspense>
      );

    case 'reaction':
      return (
        <span className="text-2xl leading-tight select-none">{content || '👍'}</span>
      );

    case 'poll':
      return (
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <p className="text-sm font-semibold">{content}</p>
          <p className="text-[10px] text-muted-foreground">Enquete · Toque para votar</p>
        </div>
      );

    case 'unknown':
      return (
        <span className="text-sm italic text-muted-foreground">
          [mensagem não suportada]
        </span>
      );

    default:
      // text + extendedText
      return (
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>
      );
  }
}

// ─── Date separator (named export — used by ChatWindow) ───────────────────────

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

  // Stickers have no bubble shell
  if (message.type === 'sticker') {
    return (
      <div className={`flex gap-2 max-w-[80%] ${isOutgoing ? 'self-end flex-row-reverse' : 'self-start'}`}>
        <MessageContent message={message} />
      </div>
    );
  }

  return (
    <div className={`flex gap-2 max-w-[80%] ${isOutgoing ? 'self-end flex-row-reverse' : 'self-start'}`}>
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
