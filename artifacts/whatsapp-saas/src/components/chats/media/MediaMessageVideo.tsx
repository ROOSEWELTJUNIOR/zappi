/**
 * MediaMessageVideo — video message bubble with:
 *  • Thumbnail auto-generated via canvas (on load)
 *  • Duration overlay
 *  • Click to open MediaViewer (HTML5 player, fullscreen, PiP)
 */
import { useState, useRef, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { Play, Video as VideoIcon } from 'lucide-react';
import { formatDuration, formatFileSize } from '@/services/storage/interfaces/StorageFile';
import type { Attachment } from '@/types/chat';

const MediaViewer = lazy(() =>
  import('../MediaViewer').then((m) => ({ default: m.MediaViewer })),
);

interface MediaMessageVideoProps {
  attachment: Attachment;
}

export const MediaMessageVideo = memo(function MediaMessageVideo({
  attachment,
}: MediaMessageVideoProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [duration, setDuration]   = useState<number>(attachment.durationSecs ?? 0);
  const [error, setError]         = useState(false);
  const [viewerOpen, setViewer]   = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const src = attachment.url;

  // Auto-generate thumbnail by loading the video metadata
  useEffect(() => {
    if (!src || thumbnail || error) return;
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      if (video.duration && !attachment.durationSecs) setDuration(video.duration);

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumbnail(canvas.toDataURL('image/jpeg', 0.7));
      }
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.currentTime = 0.5;

    return () => video.removeEventListener('loadeddata', handleLoaded);
  }, [src, thumbnail, error, attachment.durationSecs]);

  const handleClick = useCallback(() => {
    if (src) setViewer(true);
  }, [src]);

  if (!src) {
    return (
      <div className="w-48 h-32 bg-muted/30 rounded-xl flex items-center justify-center">
        <VideoIcon className="w-8 h-8 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden video + canvas for thumbnail generation */}
      <video
        ref={videoRef}
        src={src}
        className="hidden"
        muted
        preload="metadata"
        onError={() => setError(true)}
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Thumbnail / preview */}
      <div
        className="relative w-56 h-32 rounded-xl overflow-hidden cursor-pointer group bg-black/60"
        onClick={handleClick}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt="Vídeo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <VideoIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-colors">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            {formatDuration(duration)}
          </div>
        )}

        {/* File size badge */}
        {attachment.fileSize && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            {formatFileSize(attachment.fileSize)}
          </div>
        )}
      </div>

      {attachment.caption && (
        <p className="text-sm mt-1 leading-relaxed">{attachment.caption}</p>
      )}

      {viewerOpen && (
        <Suspense fallback={null}>
          <MediaViewer
            type="video"
            src={src}
            caption={attachment.caption}
            onClose={() => setViewer(false)}
          />
        </Suspense>
      )}
    </>
  );
});
