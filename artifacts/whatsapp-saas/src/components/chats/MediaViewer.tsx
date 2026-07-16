/**
 * MediaViewer — fullscreen overlay for images, videos, and audio.
 *
 * Image:  zoom (wheel + buttons), pan, fullscreen, download, open in new tab.
 * Video:  HTML5 player, fullscreen, Picture-in-Picture, download.
 * Audio:  WhatsApp-style player (re-uses MediaMessageAudio).
 *
 * Opens as a portal over the entire viewport.
 * Closes on ESC, backdrop click, or close button.
 */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';
import { createPortal } from 'react-dom';
import {
  X, Download, ZoomIn, ZoomOut, Maximize2,
  ExternalLink, Minimize2, PictureInPicture2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaViewerProps {
  type: 'image' | 'video' | 'audio';
  src: string;
  caption?: string;
  fileName?: string;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function triggerDownload(url: string, fileName: string): void {
  const a = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  a.target   = '_blank';
  a.rel      = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Image viewer ─────────────────────────────────────────────────────────────

interface ImageViewerProps {
  src: string;
  caption?: string;
  fileName: string;
}

function ImageViewer({ src, caption, fileName }: ImageViewerProps) {
  const [scale, setScale]     = useState(1);
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = useCallback((delta: number) => {
    setScale((s) => clamp(s + delta, 0.3, 5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 0.15 : -0.15);
  }, [zoom]);

  // Drag to pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [scale]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }, [dragging]);

  const stopDrag = useCallback(() => setDragging(false), []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1.5 px-4 py-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => zoom(0.25)}
          title="Aproximar"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={resetZoom}
          title={`${Math.round(scale * 100)}% — clique para resetar`}
        >
          <span className="text-[10px] font-mono">{Math.round(scale * 100)}%</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => zoom(-0.25)}
          title="Afastar"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => window.open(src, '_blank', 'noopener,noreferrer')}
          title="Abrir em nova aba"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => triggerDownload(src, fileName)}
          title="Baixar"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}
        >
          {isFullscreen
            ? <Minimize2 className="h-4 w-4" />
            : <Maximize2 className="h-4 w-4" />
          }
        </Button>
      </div>

      {/* Image area */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center select-none"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={src}
          alt={caption ?? 'Imagem'}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-100 will-change-transform"
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          }}
        />
      </div>

      {/* Caption */}
      {caption && (
        <div className="text-center text-white/70 text-sm px-8 py-3 shrink-0">
          {caption}
        </div>
      )}
    </div>
  );
}

// ─── Video viewer ─────────────────────────────────────────────────────────────

interface VideoViewerProps {
  src: string;
  caption?: string;
  fileName: string;
}

function VideoViewer({ src, caption, fileName }: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    } else {
      await video.requestPictureInPicture().catch(() => {});
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1.5 px-4 py-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={handlePiP}
          title="Picture in Picture"
        >
          <PictureInPicture2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={handleFullscreen}
          title="Tela cheia"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => triggerDownload(src, fileName)}
          title="Baixar"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          className="max-h-full max-w-full rounded-lg shadow-2xl"
          style={{ maxHeight: 'calc(100vh - 160px)' }}
        />
      </div>

      {caption && (
        <div className="text-center text-white/70 text-sm px-8 py-3 shrink-0">
          {caption}
        </div>
      )}
    </div>
  );
}

// ─── Main MediaViewer ─────────────────────────────────────────────────────────

export const MediaViewer = memo(function MediaViewer({
  type,
  src,
  caption,
  fileName,
  onClose,
}: MediaViewerProps) {
  const derivedFileName = fileName ?? `media.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3'}`;

  // ESC key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de mídia"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        title="Fechar (ESC)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {type === 'image' && (
          <ImageViewer src={src} caption={caption} fileName={derivedFileName} />
        )}
        {type === 'video' && (
          <VideoViewer src={src} caption={caption} fileName={derivedFileName} />
        )}
        {type === 'audio' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-card rounded-2xl p-6 min-w-[300px]">
              {caption && (
                <p className="text-sm text-muted-foreground text-center mb-4">{caption}</p>
              )}
              {/* Reuse a simple HTML5 audio element for the viewer */}
              <audio src={src} controls autoPlay className="w-full" />
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerDownload(src, derivedFileName)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
});
