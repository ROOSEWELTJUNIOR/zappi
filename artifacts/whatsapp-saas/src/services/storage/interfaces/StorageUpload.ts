/**
 * StorageUpload — types for the upload queue and progress tracking.
 */
import type { StorageResult } from './StorageResult';

export type UploadStatus = 'queued' | 'uploading' | 'success' | 'error' | 'cancelled';

export interface UploadProgress {
  /** Bytes transferred so far. */
  loaded: number;
  /** Total file size in bytes. */
  total: number;
  /** 0–100 */
  percentage: number;
  /** Transfer speed in bytes/second. */
  speedBps: number;
  /** Estimated seconds remaining. */
  remainingSecs: number;
}

export interface UploadOptions {
  /** Optional sub-folder inside the storage bucket. */
  folder?: string;
  /** Progress callback — called periodically during the upload. */
  onProgress?: (progress: UploadProgress) => void;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Extra metadata to attach to the stored object (S3 object metadata). */
  metadata?: Record<string, string>;
}

export interface UploadItem {
  /** Client-generated unique ID for this upload. */
  id: string;
  /** The original File object. */
  file: File;
  /** Current lifecycle state. */
  status: UploadStatus;
  /** Live progress — populated while status is 'uploading'. */
  progress: UploadProgress;
  /** Populated once status becomes 'success'. */
  result?: StorageResult;
  /** Human-readable error message when status is 'error'. */
  error?: string;
  /** URL.createObjectURL result for local preview. MUST be revoked on cleanup. */
  previewUrl: string;
  /** Optional caption / description entered by the user before sending. */
  caption: string;
  /** Number of retry attempts made so far. */
  retries: number;
  /** AbortController used to cancel an in-progress upload. */
  abortController: AbortController;
  /** epoch ms when upload started — used to compute speed. */
  startedAt?: number;
}
