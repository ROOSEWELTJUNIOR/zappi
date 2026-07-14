import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConversationItem } from './ConversationItem';
import type { Conversation, ChatFilter } from '@/types/chat';

const FILTERS: { key: ChatFilter; label: string }[] = [
  { key: 'ALL',      label: 'Todas'      },
  { key: 'UNREAD',   label: 'Não lidas'  },
  { key: 'OPEN',     label: 'Abertas'    },
  { key: 'CLOSED',   label: 'Finalizadas'},
  { key: 'FAVORITE', label: 'Favoritas'  },
];

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  filter: ChatFilter;
  search: string;
  onSelect: (c: Conversation) => void;
  onFilterChange: (f: ChatFilter) => void;
  onSearchChange: (s: string) => void;
  onRefresh: () => void;
}

export function ConversationList({
  conversations,
  loading,
  error,
  selectedId,
  filter,
  search,
  onSelect,
  onFilterChange,
  onSearchChange,
  onRefresh,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Search + refresh */}
      <div className="p-3 border-b border-border space-y-2 shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-background/60 text-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground"
            onClick={onRefresh}
            disabled={loading}
            title="Atualizar"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />
            }
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={[
                'shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors',
                filter === key
                  ? 'bg-primary text-primary-foreground border-primary font-medium'
                  : 'border-border text-muted-foreground hover:bg-accent/50',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-sm text-destructive text-center leading-relaxed">
            {error}
          </div>
        )}

        {!error && loading && conversations.length === 0 && (
          <div className="flex flex-col gap-3 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <span className="text-3xl opacity-40">💬</span>
            <p>Nenhuma conversa encontrada</p>
          </div>
        )}

        {conversations.map((c) => (
          <ConversationItem
            key={c.id}
            conversation={c}
            isSelected={c.id === selectedId}
            onSelect={() => onSelect(c)}
          />
        ))}
      </div>
    </div>
  );
}
