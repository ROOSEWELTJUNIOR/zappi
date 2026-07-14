/**
 * Chats page — professional 3-column conversation interface.
 * Layout: ConversationList | ChatWindow | ContactPanel
 *
 * Desktop (lg): all 3 columns.
 * Tablet (md):  list + chat, no panel.
 * Mobile:       list OR chat (back button to return to list).
 */
import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';

import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/components/chats/ConversationList';
import { ChatWindow } from '@/components/chats/ChatWindow';
import { ContactPanel } from '@/components/chats/ContactPanel';
import { useChats } from '@/hooks/useChats';

import type { Conversation } from '@/types/chat';

export default function Chats() {
  const {
    conversations,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    refresh,
    toggleFavorite: _toggleFavorite,
    closeConversation: _close,
  } = useChats();

  const [selected, setSelected] = useState<Conversation | null>(null);
  const [showPanel, setShowPanel]   = useState(false);
  // Mobile: true = show chat, false = show list
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
    setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('list');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-theme(spacing.8))]">
      {/* Page header */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div>
          <Breadcrumb className="mb-1" />
          <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas conversas do WhatsApp em tempo real.
          </p>
        </div>
        <Button className="gap-2" disabled title="Em breve">
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Conversa</span>
        </Button>
      </div>

      {/* 3-column container */}
      <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm min-h-0">

        {/* ── Column 1: Conversation list ────────────────────────────────── */}
        <div
          className={[
            // Desktop: always visible
            'lg:flex flex-col border-r border-border bg-card/60 shrink-0',
            // Tablet: always visible
            'md:flex',
            // Mobile: only when on list view
            mobileView === 'list' ? 'flex w-full' : 'hidden',
            // Fixed width on desktop/tablet
            'md:w-[300px] lg:w-[320px]',
          ].join(' ')}
        >
          <ConversationList
            conversations={conversations}
            loading={loading}
            error={error}
            selectedId={selected?.id ?? null}
            filter={filter}
            search={search}
            onSelect={handleSelect}
            onFilterChange={setFilter}
            onSearchChange={setSearch}
            onRefresh={refresh}
          />
        </div>

        {/* ── Column 2: Chat window ───────────────────────────────────────── */}
        <div
          className={[
            'flex flex-col flex-1 min-w-0',
            // Mobile: only when a chat is open
            mobileView === 'chat' ? 'flex' : 'hidden md:flex',
          ].join(' ')}
        >
          <ChatWindow
            conversation={selected}
            showInfoPanel={showPanel}
            onBack={handleBack}
            onInfoToggle={() => setShowPanel((v) => !v)}
          />
        </div>

        {/* ── Column 3: Contact panel ─────────────────────────────────────── */}
        {selected && showPanel && (
          <div className="hidden lg:flex flex-col w-[280px] border-l border-border bg-card/60 shrink-0">
            <ContactPanel
              conversation={selected}
              onClose={() => setShowPanel(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
