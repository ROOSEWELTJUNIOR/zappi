/**
 * FilePreviewPanel — pre-send preview panel shown above MessageInput.
 *
 * Displays the upload queue with:
 *  • Thumbnails (image / video / audio / document icon)
 *  • Caption input per file
 *  • Upload progress bar (percentage, speed, ETA)
 *  • Cancel / retry / remove controls
 *  • "Send X files" button that triggers useUpload.sendAll()
 */
import { memo, useCallback } from 'react';
import {
  X, RefreshCw, Loader2, CheckCircle2, AlertCircle,
  Send, FileText, Music, Video, Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, formatSpeed, classifyMimetype } from '@/services/storage/interfaces/StorageFile';
import type { UploadItem } from '@/services/storage/interfaces/StorageUpload';

// ─── Single file card ─────────────────────────────────────────────────────────

interface FileCardProps {
  item: UploadItem;
  onRemove:        (id: string) => void;
  onCancel:        (id: string) => void;
  onRetry:         (id: string) => Promise<void>;
  onCaptionChange: (id: string, val: string) => void;
}

function FileCard({
  item,
  onRemove,
  onCancel,
  onRetry,
  onCaptionChange,
}: FileCardProps) {
  const { id, file, status, progress, error, previewUrl, caption } = item;
  const category = classifyMimetype(file.type);
  const isImage  = category === 'image';
  const isVideo  = category === 'video';
  const isAudio  = category === 'audio';

  const handleCaptionKey = useCallback((e: React.KeyboardEvent) => {
    // Prevent Enter from propagating to parent (which would send)
    if (e.key === 'Enter') e.stopPropagation();
  }, []);

  return (
    <div className={[
      'relative flex gap-3 rounded-xl border p-3 transition-all',
      status === 'error'    ? 'border-destructive/50 bg-destructive/5'   :
      status === 'success'  ? 'border-emerald-500/30 bg-emerald-500/5'   :
      status === 'uploading'? 'border-primary/30 bg-primary/5'           :
      'border-border bg-card/60',
    ].join(' ')}>

      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center">
        {isImage && (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        )}
        {isVideo && (
          <div className="relative w-full h-full bg-black/20 flex items-center justify-center">
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <Video className="absolute w-5 h-5 text-white/80" />
          </div>
        )}
        {isAudio && (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-6 h-6 text-primary/60" />
          </div>
        )}
        {!isImage && !isVideo && !isAudio && (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground/60" />
          </div>
        )}
      </div>

      {/* File info + caption */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate leading-tight">{file.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatFileSize(file.size)}
            </p>
          </div>

          {/* Status icon */}
          <div className="shrink-0 mt-0.5">
            {status === 'uploading' && (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Caption input — only when queued */}
        {(status === 'queued' || status === 'error') && (
          <input
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(id, e.target.value)}
            onKeyDown={handleCaptionKey}
            placeholder="Adicionar legenda…"
            maxLength={1024}
            className="text-xs bg-background/60 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 w-full"
          />
        )}

        {/* Progress bar */}
        {status === 'uploading' && (
          <div className="space-y-1">
            <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-primary font-medium">
                {progress.percentage}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {progress.speedBps > 0 ? formatSpeed(progress.speedBps) : ''}
                {progress.remainingSecs > 0 ? ` · ${Math.ceil(progress.remainingSecs)}s` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {status === 'error' && error && (
          <p className="text-[10px] text-destructive">{error}</p>
        )}
      </div>

      {/* Action buttons — top right */}
      <div className="absolute top-2 right-2 flex gap-1">
        {status === 'error' && (
          <button
            onClick={() => onRetry(id)}
            className="w-6 h-6 rounded-md bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Tentar novamente"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
        {status === 'uploading' && (
          <button
            onClick={() => onCancel(id)}
            className="w-6 h-6 rounded-md bg-muted/60 hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            title="Cancelar"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {(status === 'queued' || status === 'cancelled') && (
          <button
            onClick={() => onRemove(id)}
            className="w-6 h-6 rounded-md bg-muted/60 hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            title="Remover"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface FilePreviewPanelProps {
  items:           UploadItem[];
  onRemove:        (id: string) => void;
  onCancel:        (id: string) => void;
  onRetry:         (id: string) => Promise<void>;
  onCaptionChange: (id: string, val: string) => void;
  onClear:         () => void;
  onSendAll:       () => Promise<void>;
  disabled?:       boolean;
}

export const FilePreviewPanel = memo(function FilePreviewPanel({
  items,
  onRemove,
  onCancel,
  onRetry,
  onCaptionChange,
  onClear,
  onSendAll,
  disabled,
}: FilePreviewPanelProps) {
  if (!items.length) return null;

  const uploading   = items.filter((i) => i.status === 'uploading').length;
  const sendableCount = items.filter(
    (i) => i.status === 'queued' || i.status === 'error',
  ).length;
  const canSend = sendableCount > 0 && !disabled;

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <span className="text-xs font-medium text-muted-foreground">
          {items.length} {items.length === 1 ? 'arquivo' : 'arquivos'}
          {uploading > 0 && ` · ${uploading} enviando…`}
        </span>
        <button
          onClick={onClear}
          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          title="Limpar tudo"
        >
          Limpar tudo
        </button>
      </div>

      {/* File list */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-2">
        {items.map((item) => (
          <FileCard
            key={item.id}
            item={item}
            onRemove={onRemove}
            onCancel={onCancel}
            onRetry={onRetry}
            onCaptionChange={onCaptionChange}
          />
        ))}
      </div>

      {/* Send button */}
      <div className="px-4 py-2 border-t border-border/50 flex justify-end">
        <Button
          size="sm"
          onClick={onSendAll}
          disabled={!canSend}
          className="gap-2 h-8"
        >
          <Send className="w-3.5 h-3.5" />
          Enviar {sendableCount > 1 ? `${sendableCount} arquivos` : 'arquivo'}
        </Button>
      </div>
    </div>
  );
});
