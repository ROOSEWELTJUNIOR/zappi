import { useEffect, useRef, useCallback } from 'react';
import {
  Phone, Info, ArrowLeft, Loader2, ChevronUp,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageBubble, DateSeparator } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatEmptyState } from './ChatEmptyState';
import { useMessages } from '@/hooks/useMessages';
import type { Conversation, Message } from '@/types/chat';

// ─── Group messages by date for date-separator rendering ─────────────────────

interface MessageGroup {
  date: Date;
  messages: Message[];
}

function groupByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentKey = '';

  for (const msg of messages) {
    const key = msg.timestamp.toDateString();
    if (key !== currentKey) {
      groups.push({ date: msg.timestamp, messages: [] });
      currentKey = key;
    }
    groups[groups.length - 1].messages.push(msg);
  }

  return groups;
}

// ─── Contact status line ──────────────────────────────────────────────────────

function ContactStatus({ isOnline }: { isOnline: boolean }) {
  if (isOnline) {
    return <span className="text-xs text-emerald-500 font-medium">Online</span>;
  }
  return <span className="text-xs text-muted-foreground">Offline</span>;
}

// ─── Chat header ──────────────────────────────────────────────────────────────

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  onInfoToggle: () => void;
  showInfoPanel: boolean;
}

function ChatHeader({ conversation, onBack, onInfoToggle, showInfoPanel }: ChatHeaderProps) {
  const { contact } = conversation;
  const initials = contact.name.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/90 backdrop-blur-sm shrink-0 z-10">
      {/* Back button (mobile) */}
      {onBack && (
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 md:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          {contact.profilePicUrl && (
            <AvatarImage src={contact.profilePicUrl} alt={contact.name} />
          )}
          <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        {contact.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-card bg-emerald-500 rounded-full" />
        )}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{contact.name}</p>
        <ContactStatus isOnline={contact.isOnline} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
          title="Ligar (em breve)"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={[
            'h-8 w-8 rounded-full transition-colors',
            showInfoPanel
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          title="Informações do contato"
          onClick={onInfoToggle}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Messages area ────────────────────────────────────────────────────────────

interface MessagesAreaProps {
  groups: MessageGroup[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  bottomRef: React.RefObject<HTMLDivElement>;
}

function MessagesArea({ groups, loading, hasMore, onLoadMore, bottomRef }: MessagesAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <ChevronUp className="h-3 w-3" />
            }
            Carregar mensagens anteriores
          </Button>
        </div>
      )}

      {loading && groups.length === 0 && (
        <div className="flex flex-col gap-4 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}
            >
              <div
                className="h-10 rounded-2xl bg-muted"
                style={{ width: `${100 + (i * 37) % 140}px` }}
              />
            </div>
          ))}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.date.toDateString()} className="flex flex-col gap-1">
          <DateSeparator date={group.date} />
          {group.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      ))}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChatWindowProps {
  conversation: Conversation | null;
  showInfoPanel: boolean;
  onBack?: () => void;
  onInfoToggle: () => void;
}

export function ChatWindow({
  conversation,
  showInfoPanel,
  onBack,
  onInfoToggle,
}: ChatWindowProps) {
  const { messages, loading, sending, hasMore, loadMore, send, addMessage, replaceMessage, removeMessage } =
    useMessages(conversation);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      const isInitialLoad = prevCountRef.current === 0;
      scrollToBottom(!isInitialLoad);
    }
    prevCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    prevCountRef.current = 0;
  }, [conversation?.id]);

  if (!conversation) {
    return <ChatEmptyState />;
  }

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onInfoToggle={onInfoToggle}
        showInfoPanel={showInfoPanel}
      />

      <MessagesArea
        groups={groups}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        bottomRef={bottomRef}
      />

      <MessageInput
        onSend={send}
        sending={sending}
        disabled={false}
        conversation={conversation}
        onOptimisticMessage={addMessage}
        onRealMessage={replaceMessage}
        onSendError={removeMessage}
      />
    </div>
  );
}
