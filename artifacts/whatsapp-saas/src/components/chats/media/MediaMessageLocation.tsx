/**
 * MediaMessageLocation — location message with static map preview.
 * Opens Google Maps on click.
 */
import { memo, useCallback } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import type { Message } from '@/types/chat';

interface MediaMessageLocationProps {
  message: Message;
}

export const MediaMessageLocation = memo(function MediaMessageLocation({
  message,
}: MediaMessageLocationProps) {
  const { attachment, content } = message;
  const lat = attachment?.latitude;
  const lng = attachment?.longitude;
  const name = content || 'Localização';

  const mapsUrl = lat != null && lng != null
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;

  // Static map thumbnail via OpenStreetMap tile (no API key needed)
  const staticMapUrl = lat != null && lng != null
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=300x140&markers=${lat},${lng},red`
    : null;

  const handleClick = useCallback(() => {
    if (mapsUrl) window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }, [mapsUrl]);

  return (
    <div
      className={[
        'rounded-xl overflow-hidden min-w-[220px] max-w-[260px]',
        mapsUrl ? 'cursor-pointer' : '',
        'border border-border/50',
      ].join(' ')}
      onClick={handleClick}
      title={mapsUrl ? 'Abrir no Google Maps' : undefined}
    >
      {/* Map thumbnail */}
      <div className="relative w-full h-28 bg-muted/30">
        {staticMapUrl ? (
          <img
            src={staticMapUrl}
            alt="Mapa"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        {/* Pin overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MapPin className="w-7 h-7 text-red-500 drop-shadow-md" />
        </div>
      </div>

      {/* Name + actions */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card/80">
        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span className="text-xs font-medium flex-1 truncate">{name}</span>
        {mapsUrl && <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />}
      </div>
    </div>
  );
});
