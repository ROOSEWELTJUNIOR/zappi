import { useState } from 'react';
import { X, Edit3, Tag, StickyNote, Globe, Calendar, Smartphone, User2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Conversation } from '@/types/chat';

interface ContactPanelProps {
  conversation: Conversation;
  onClose?: () => void;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 13 && clean.startsWith('55')) {
    return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  return `+${clean}`;
}

export function ContactPanel({ conversation, onClose }: ContactPanelProps) {
  const { contact, instanceName } = conversation;
  const initials = contact.name.slice(0, 2).toUpperCase();

  const [tags, setTags]     = useState<string[]>(contact.tags ?? []);
  const [notes, setNotes]   = useState(contact.notes ?? '');
  const [editingNotes, setEditingNotes] = useState(false);
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="font-semibold text-sm">Informações do Contato</span>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-2 py-5 px-4 border-b border-border shrink-0">
        <div className="relative">
          <Avatar className="h-16 w-16">
            {contact.profilePicUrl && (
              <AvatarImage src={contact.profilePicUrl} alt={contact.name} />
            )}
            <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {contact.isOnline && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-2 border-card bg-emerald-500 rounded-full" />
          )}
        </div>
        <div className="text-center">
          <h3 className="font-semibold">{contact.name}</h3>
          {contact.pushName && contact.pushName !== contact.name && (
            <p className="text-xs text-muted-foreground">{contact.pushName}</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs h-7" disabled>
          <Edit3 className="h-3 w-3" />
          Editar contato
        </Button>
      </div>

      {/* Info rows */}
      <div className="px-4 py-3 space-y-3 border-b border-border text-sm">
        <InfoRow icon={<Smartphone className="h-4 w-4" />} label="Telefone">
          <span className="font-mono">{formatPhone(contact.phone)}</span>
        </InfoRow>

        {contact.pushName && (
          <InfoRow icon={<User2 className="h-4 w-4" />} label="Push Name">
            {contact.pushName}
          </InfoRow>
        )}

        <InfoRow icon={<Globe className="h-4 w-4" />} label="Origem">
          {contact.origin || 'WhatsApp'}
        </InfoRow>

        <InfoRow icon={<Smartphone className="h-4 w-4" />} label="Instância">
          <span className="font-mono text-xs">{instanceName}</span>
        </InfoRow>

        <InfoRow icon={<Calendar className="h-4 w-4" />} label="Última atividade">
          {formatDate(conversation.lastMessage?.timestamp ?? conversation.updatedAt)}
        </InfoRow>

        <InfoRow icon={<Calendar className="h-4 w-4" />} label="Primeira conversa">
          {formatDate(contact.firstContactAt)}
        </InfoRow>
      </div>

      {/* Tags */}
      <div className="px-4 py-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Tag className="h-3.5 w-3.5" />
          <span>Tags</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer text-xs gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => removeTag(tag)}
            >
              {tag}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            }}
            placeholder="+ Adicionar tag"
            className="text-xs bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/50 min-w-[90px]"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="px-4 py-3 space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <StickyNote className="h-3.5 w-3.5" />
            <span>Observações</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setEditingNotes((v) => !v)}
          >
            {editingNotes ? 'Salvar' : 'Editar'}
          </Button>
        </div>
        {editingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicionar observações sobre este contato..."
            rows={4}
            className="w-full text-sm bg-muted/40 border border-border rounded-lg p-2 outline-none resize-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50"
          />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed min-h-[60px]">
            {notes || <span className="italic opacity-50">Sem observações</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{children}</p>
      </div>
    </div>
  );
}
