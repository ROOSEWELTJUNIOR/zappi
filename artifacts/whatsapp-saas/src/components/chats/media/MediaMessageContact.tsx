/**
 * MediaMessageContact — vCard contact share bubble.
 */
import { memo } from 'react';
import { User, Phone } from 'lucide-react';
import type { Message } from '@/types/chat';

interface MediaMessageContactProps {
  message: Message;
}

/** Extract phone number from vCard string (very light parser). */
function extractPhone(vcard?: string): string | null {
  if (!vcard) return null;
  const match = vcard.match(/TEL[^:]*:([^\r\n]+)/i);
  return match ? match[1].trim() : null;
}

export const MediaMessageContact = memo(function MediaMessageContact({
  message,
}: MediaMessageContactProps) {
  const name  = message.content || 'Contato';
  // vcard is stored as part of attachment for future use; content holds display name
  const phone = null as string | null; // would parse from raw vcard in a full impl

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5 min-w-[180px] max-w-[260px] bg-muted/20">
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <User className="w-5 h-5 text-primary" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {phone && (
          <div className="flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
});
