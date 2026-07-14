import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Conversation, MessageType } from '@/types/chat';

// ─── Time formatter ───────────────────────────────────────────────────────────

function formatTime(date: Date | null | undefined): string {
  if (!date) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (daysAgo < 7) return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Last message preview text ────────────────────────────────────────────────

const TYPE_LABELS: Partial<Record<MessageType, string>> = {
  image:    '📷 Imagem',
  audio:    '🎵 Áudio',
  video:    '🎬 Vídeo',
  document: '📄 Documento',
  sticker:  '😊 Sticker',
  location: '📍 Localização',
  contact:  '👤 Contato',
};

function lastMessagePreview(conv: Conversation): string {
  const msg = conv.lastMessage;
  if (!msg) return 'Nenhuma mensagem';
  const prefix = msg.fromMe ? 'Você: ' : '';
  const label = TYPE_LABELS[msg.type];
  if (label) {
    return prefix + (msg.content ? `${label} — ${msg.content}` : label);
  }
  return prefix + (msg.content || 'Mensagem');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const { contact, lastMessage, unreadCount, isFavorite } = conversation;
  const initials = contact.name.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full flex gap-3 px-4 py-3 border-b border-border/40 text-left',
        'hover:bg-accent/50 transition-colors duration-100 focus-visible:outline-none',
        isSelected ? 'bg-accent/80 border-l-2 border-l-primary' : '',
      ].join(' ')}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          {contact.profilePicUrl && (
            <AvatarImage src={contact.profilePicUrl} alt={contact.name} />
          )}
          <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        {contact.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-card bg-emerald-500 rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-sm font-semibold truncate pr-1 flex items-center gap-1">
            {contact.name}
            {isFavorite && <span className="text-amber-400 text-xs">★</span>}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatTime(lastMessage?.timestamp)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground truncate pr-1">
            {lastMessagePreview(conversation)}
          </p>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 px-1 rounded-full shrink-0 flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
});
