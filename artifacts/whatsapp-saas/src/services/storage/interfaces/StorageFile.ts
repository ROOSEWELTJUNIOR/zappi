/**
 * StorageFile — file validation, classification, and formatting utilities.
 * This is the single place that knows which MIME types are allowed.
 */

export const ALLOWED_MIMETYPES = [
  // ─── Images ──────────────────────────────────────────────────────────────
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
  // ─── Videos ──────────────────────────────────────────────────────────────
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
  'video/x-msvideo', 'video/3gpp',
  // ─── Audio ───────────────────────────────────────────────────────────────
  'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav',
  'audio/webm', 'audio/aac', 'audio/flac', 'audio/mp4',
  // ─── Documents ───────────────────────────────────────────────────────────
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'application/x-rar-compressed', 'application/vnd.rar',
  'text/plain', 'text/csv',
  'application/json',
  'application/vnd.android.package-archive', // .apk
] as const;

export type AllowedMimetype = (typeof ALLOWED_MIMETYPES)[number];

/** Broad category used by the UI to pick the right message component. */
export type MediaCategory = 'image' | 'video' | 'audio' | 'document';

/** 100 MB in bytes. */
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/** Map a MIME type to a MediaCategory. */
export function classifyMimetype(mimetype: string): MediaCategory {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}

/** Validate a File before it enters the upload queue. */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Arquivo muito grande (${formatFileSize(file.size)}). Máximo permitido: 100 MB.`,
    };
  }
  const allowed = ALLOWED_MIMETYPES as readonly string[];
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não suportado: ${file.type || 'desconhecido'}.`,
    };
  }
  return { valid: true };
}

/** Format bytes into a human-readable string. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format seconds into mm:ss. */
export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format bytes/s into a readable speed string. */
export function formatSpeed(bps: number): string {
  if (bps < 1024) return `${Math.round(bps)} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

/** Return the extension from a file name (lowercase). */
export function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

/** Human-readable label from MIME type. */
export function mimetypeLabel(mimetype: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/vnd.rar': 'RAR',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'application/json': 'JSON',
    'application/vnd.android.package-archive': 'APK',
  };
  return map[mimetype] ?? mimetype.split('/').pop()?.toUpperCase() ?? 'Arquivo';
}
