/**
 * MediaMessageSticker — sticker bubble (no border, transparent background).
 */
import { useState, memo } from 'react';
import { Smile } from 'lucide-react';
import type { Attachment } from '@/types/chat';

interface MediaMessageStickerProps {
  attachment: Attachment;
}

export const MediaMessageSticker = memo(function MediaMessageSticker({
  attachment,
}: MediaMessageStickerProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  const src = attachment.url;

  if (!src || error) {
    return (
      <div className="w-20 h-20 flex items-center justify-center">
        <Smile className="w-8 h-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="relative w-28 h-28">
      {!loaded && (
        <div className="w-28 h-28 rounded-xl bg-muted/20 animate-pulse" />
      )}
      <img
        src={src}
        alt="Sticker"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={[
          'w-28 h-28 object-contain',
          loaded ? 'opacity-100' : 'opacity-0 absolute inset-0',
        ].join(' ')}
      />
    </div>
  );
});
