import { useState } from 'react';
import { X, Edit3, Tag, StickyNote, Globe, Calendar, Smartphone, User2, Bug, Loader2, Copy, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Conversation } from '@/types/chat';
import { debugContactInfo, isPlausiblePhoneNumber, type ContactDebugReport } from '@/services/chat.service';

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

  const [debugReport, setDebugReport]   = useState<ContactDebugReport | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError]     = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);

  const isLid = !isPlausiblePhoneNumber(conversation.id);

  const runDebug = async () => {
    setDebugLoading(true);
    setDebugError(null);
    setDebugReport(null);
    try {
      const report = await debugContactInfo(instanceName, conversation.id, contact.phone);
      setDebugReport(report);
    } catch (e) {
      setDebugError(e instanceof Error ? e.message : String(e));
    } finally {
      setDebugLoading(false);
    }
  };

  const copyJson = () => {
    if (!debugReport) return;
    navigator.clipboard.writeText(JSON.stringify(debugReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="px-4 py-3 space-y-2 border-b border-border">
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

      {/* Debug API section */}
      <div className="px-4 py-3 space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Bug className="h-3.5 w-3.5" />
            <span>Debug API</span>
            {isLid && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">LID</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {debugReport && (
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={copyJson}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={runDebug}
              disabled={debugLoading}
            >
              {debugLoading
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Bug className="h-3 w-3" />
              }
              {debugLoading ? 'Consultando...' : 'Consultar API'}
            </Button>
          </div>
        </div>

        {isLid && !debugReport && !debugLoading && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            JID detectado como LID ({conversation.id}). Clique em "Consultar API" para ver os dados brutos e descobrir onde o número real está.
          </p>
        )}

        {debugError && (
          <p className="text-[11px] text-destructive">{debugError}</p>
        )}

        {debugReport && (
          <div className="space-y-2">
            <DebugSection label="remoteJid / phone" value={{ remoteJid: debugReport.remoteJid, phone: debugReport.phone, isLid }} />
            <DebugSection label="findChats → este chat" value={debugReport.rawChat} />
            <DebugSection label="findMessages (3 msgs)" value={debugReport.rawMessages} />
            <DebugSection label="findContacts → match" value={debugReport.findContacts} />
            <DebugSection label={`whatsappNumbers [LID: ${debugReport.remoteJid.split('@')[0]}]`} value={debugReport.whatsappNumbersLid} />
            <DebugSection label={`whatsappNumbers [phone: ${debugReport.phone}]`} value={debugReport.whatsappNumbersPhone} />
          </div>
        )}
      </div>
    </div>
  );
}

function DebugSection({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  const isError = (value as { status?: string })?.status === 'error';

  return (
    <div className="border border-border rounded-md overflow-hidden text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full flex items-center justify-between px-2 py-1.5 text-left font-mono font-medium hover:bg-muted/50 transition-colors',
          isError ? 'text-destructive' : 'text-muted-foreground',
        ].join(' ')}
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <pre className="px-2 py-2 bg-muted/30 text-[10px] overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-64 overflow-y-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
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
