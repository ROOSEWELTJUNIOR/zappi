/**
 * MediaMessageDocument — document message bubble with:
 *  • File type icon (color-coded by extension)
 *  • File name + size
 *  • Download button
 *  • Click to open in new tab (when URL is available)
 */
import { memo, useCallback } from 'react';
import {
  FileText, FileSpreadsheet, FileType, FileArchive,
  FileCode, File as FileIcon, Download, ExternalLink,
} from 'lucide-react';
import { formatFileSize, mimetypeLabel } from '@/services/storage/interfaces/StorageFile';
import type { Attachment } from '@/types/chat';

// ─── Icon + color mapping by MIME type ───────────────────────────────────────

function getDocStyle(mimetype?: string): {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
} {
  const m = mimetype ?? '';

  if (m.includes('pdf'))
    return {
      icon: <FileText className="w-5 h-5" />,
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/15',
    };

  if (m.includes('word') || m.includes('document'))
    return {
      icon: <FileType className="w-5 h-5" />,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/15',
    };

  if (m.includes('excel') || m.includes('spreadsheet') || m.includes('csv'))
    return {
      icon: <FileSpreadsheet className="w-5 h-5" />,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/15',
    };

  if (m.includes('powerpoint') || m.includes('presentation'))
    return {
      icon: <FileType className="w-5 h-5" />,
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-500/15',
    };

  if (m.includes('zip') || m.includes('rar') || m.includes('archive'))
    return {
      icon: <FileArchive className="w-5 h-5" />,
      colorClass: 'text-yellow-400',
      bgClass: 'bg-yellow-500/15',
    };

  if (m.includes('json') || m.includes('text') || m.includes('plain'))
    return {
      icon: <FileCode className="w-5 h-5" />,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/15',
    };

  return {
    icon: <FileIcon className="w-5 h-5" />,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MediaMessageDocumentProps {
  attachment: Attachment;
  content: string;
  fromMe: boolean;
}

export const MediaMessageDocument = memo(function MediaMessageDocument({
  attachment,
  content,
  fromMe,
}: MediaMessageDocumentProps) {
  const { icon, colorClass, bgClass } = getDocStyle(attachment.mimetype);
  const fileName = attachment.fileName ?? content ?? 'Documento';
  const label    = mimetypeLabel(attachment.mimetype ?? '');
  const src      = attachment.url;

  const handleOpen = useCallback(() => {
    if (src) window.open(src, '_blank', 'noopener,noreferrer');
  }, [src]);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!src) return;
      const a = document.createElement('a');
      a.href = src;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    },
    [src, fileName],
  );

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl px-3 py-2.5 min-w-[200px] max-w-[280px]',
        'border transition-colors',
        src ? 'cursor-pointer hover:bg-muted/30' : '',
        fromMe ? 'border-primary/20 bg-primary/10' : 'border-border bg-muted/20',
      ].join(' ')}
      onClick={handleOpen}
      title={src ? `Abrir ${fileName}` : undefined}
    >
      {/* Icon */}
      <div className={`shrink-0 w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center`}>
        <span className={colorClass}>{icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{fileName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] font-semibold uppercase ${colorClass}`}>{label}</span>
          {attachment.fileSize != null && (
            <>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">
                {formatFileSize(attachment.fileSize)}
              </span>
            </>
          )}
          {attachment.pageCount != null && attachment.pageCount > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">
                {attachment.pageCount} pág.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {src && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDownload}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Baixar"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpen}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Abrir em nova aba"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
});
