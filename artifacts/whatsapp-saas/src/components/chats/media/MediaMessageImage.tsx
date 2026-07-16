/**
 * MediaMessageImage — renders an image message bubble with:
 *  • Lazy loading + blur placeholder
 *  • Click to open MediaViewer (zoom, fullscreen, download)
 *  • Caption below the image
 */
import { useState, memo, useCallback, lazy, Suspense } from 'react';
import { Image as ImageIcon, ZoomIn } from 'lucide-react';
import type { Attachment } from '@/types/chat';

const MediaViewer = lazy(() =>
  import('../MediaViewer').then((m) => ({ default: m.MediaViewer })),
);

interface MediaMessageImageProps {
  attachment: Attachment;
  fromMe: boolean;
}

export const MediaMessageImage = memo(function MediaMessageImage({
  attachment,
  fromMe,
}: MediaMessageImageProps) {
  const [loaded, setLoaded]       = useState(false);
  const [error, setError]         = useState(false);
  const [viewerOpen, setViewer]   = useState(false);

  const src = attachment.url ?? attachment.base64;

  const handleClick = useCallback(() => {
    if (src && !error) setViewer(true);
  }, [src, error]);

  if (!src) {
    return (
      <div className="w-48 h-36 bg-muted/30 rounded-xl flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden max-w-[280px] cursor-zoom-in group relative">
        {/* Blur placeholder */}
        {!loaded && !error && (
          <div className="w-48 h-36 bg-muted/40 animate-pulse rounded-xl flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground/30 animate-pulse" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="w-48 h-28 bg-muted/30 rounded-xl flex flex-col items-center justify-center gap-1">
            <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground">Imagem indisponível</span>
          </div>
        )}

        {/* Image */}
        {!error && (
          <img
            src={src}
            alt={attachment.caption ?? 'Imagem'}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            onClick={handleClick}
            className={[
              'max-w-[280px] max-h-[320px] w-full object-cover rounded-xl transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0 absolute inset-0',
            ].join(' ')}
          />
        )}

        {/* Hover overlay */}
        {loaded && !error && (
          <div
            onClick={handleClick}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none"
          >
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Caption */}
      {attachment.caption && (
        <p className={`text-sm mt-1 leading-relaxed ${fromMe ? '' : ''}`}>
          {attachment.caption}
        </p>
      )}

      {/* Media Viewer */}
      {viewerOpen && src && (
        <Suspense fallback={null}>
          <MediaViewer
            type="image"
            src={src}
            caption={attachment.caption}
            onClose={() => setViewer(false)}
          />
        </Suspense>
      )}
    </>
  );
});
