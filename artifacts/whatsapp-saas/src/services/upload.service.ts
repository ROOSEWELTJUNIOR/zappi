/**
 * upload.service.ts — upload queue manager.
 *
 * Manages the lifecycle of files from selection through upload completion.
 * Decoupled from React — the useUpload hook subscribes to state changes.
 *
 * Responsibilities:
 *  • prepareFile()    — validate, create preview URL, enqueue as 'queued'
 *  • uploadItem()     — run storage upload with progress tracking
 *  • cancelUpload()   — abort an in-progress upload
 *  • retryUpload()    — re-attempt a failed upload
 *  • removeItem()     — clean up preview URL and remove from queue
 *  • clearCompleted() — bulk-remove all 'success' items
 *  • updateCaption()  — set caption text before sending
 *  • subscribe()      — listen to queue changes (used by useUpload)
 */
import { storageService } from '@/services/storage/StorageService';
import { validateFile } from '@/services/storage/interfaces/StorageFile';
import type { UploadItem, UploadProgress } from '@/services/storage/interfaces/StorageUpload';

const MAX_RETRIES = 3;

type Listener = (items: UploadItem[]) => void;

class UploadService {
  private _queue = new Map<string, UploadItem>();
  private _listeners = new Set<Listener>();

  // ─── Subscriptions ─────────────────────────────────────────────────────

  /** Subscribe to queue changes. Returns an unsubscribe function. */
  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private _notify(): void {
    const items = this.getItems();
    this._listeners.forEach((fn) => fn(items));
  }

  // ─── Queue accessors ───────────────────────────────────────────────────

  getItems(): UploadItem[] {
    return Array.from(this._queue.values());
  }

  getItem(id: string): UploadItem | undefined {
    return this._queue.get(id);
  }

  // ─── File preparation ──────────────────────────────────────────────────

  /**
   * Validate a file and add it to the queue with status 'queued'.
   * Returns the item ID on success, or null if validation fails.
   * The caller receives the error via the toast system.
   */
  prepareFile(file: File): { id: string | null; error?: string } {
    const { valid, error } = validateFile(file);
    if (!valid) return { id: null, error };

    const id: string = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    const item: UploadItem = {
      id,
      file,
      status: 'queued',
      progress: { loaded: 0, total: file.size, percentage: 0, speedBps: 0, remainingSecs: 0 },
      previewUrl,
      caption: '',
      retries: 0,
      abortController: new AbortController(),
    };

    this._queue.set(id, item);
    this._notify();
    return { id };
  }

  /**
   * Prepare multiple files at once.
   * Returns { ids, errors } — ids for accepted files, errors for rejected ones.
   */
  prepareFiles(files: File[]): { ids: string[]; errors: string[] } {
    const ids: string[]    = [];
    const errors: string[] = [];
    for (const file of files) {
      const { id, error } = this.prepareFile(file);
      if (id) ids.push(id);
      else if (error) errors.push(`${file.name}: ${error}`);
    }
    return { ids, errors };
  }

  // ─── Upload ────────────────────────────────────────────────────────────

  /**
   * Upload a queued item to the active storage provider.
   * Mutates the item's status and progress in place, notifying subscribers.
   * Resolves with the updated UploadItem.
   */
  async uploadItem(id: string): Promise<UploadItem> {
    const item = this._queue.get(id);
    if (!item) throw new Error(`Upload item not found: ${id}`);

    // Reset abort controller for fresh start / retry
    item.abortController = new AbortController();
    item.status    = 'uploading';
    item.error     = undefined;
    item.startedAt = Date.now();
    item.progress  = { loaded: 0, total: item.file.size, percentage: 0, speedBps: 0, remainingSecs: 0 };
    this._notify();

    try {
      const result = await storageService.upload(item.file, {
        signal: item.abortController.signal,
        onProgress: (progress: UploadProgress) => {
          item.progress = progress;
          this._notify();
        },
      });

      item.status = 'success';
      item.result = result;
      item.progress = {
        loaded: item.file.size, total: item.file.size,
        percentage: 100, speedBps: 0, remainingSecs: 0,
      };
      this._notify();
      return item;
    } catch (err) {
      const isAbort = (err as Error).name === 'AbortError';
      item.status = isAbort ? 'cancelled' : 'error';
      item.error  = isAbort ? 'Cancelado.' : ((err as Error).message ?? 'Erro desconhecido.');
      this._notify();
      throw err;
    }
  }

  // ─── Control ───────────────────────────────────────────────────────────

  cancelUpload(id: string): void {
    const item = this._queue.get(id);
    if (!item) return;
    item.abortController.abort();
    // Status will be set to 'cancelled' by uploadItem's catch block.
    // If it was only 'queued' (never started), update directly.
    if (item.status === 'queued') {
      item.status = 'cancelled';
      this._notify();
    }
  }

  async retryUpload(id: string): Promise<UploadItem> {
    const item = this._queue.get(id);
    if (!item) throw new Error(`Upload item not found: ${id}`);
    if (item.retries >= MAX_RETRIES) {
      throw new Error(`Número máximo de tentativas atingido (${MAX_RETRIES}).`);
    }
    item.retries += 1;
    return this.uploadItem(id);
  }

  removeItem(id: string): void {
    const item = this._queue.get(id);
    if (!item) return;
    // Cancel if in progress
    if (item.status === 'uploading') item.abortController.abort();
    // Revoke the blob URL to free memory
    URL.revokeObjectURL(item.previewUrl);
    this._queue.delete(id);
    this._notify();
  }

  clearCompleted(): void {
    for (const [id, item] of this._queue.entries()) {
      if (item.status === 'success' || item.status === 'cancelled') {
        URL.revokeObjectURL(item.previewUrl);
        this._queue.delete(id);
      }
    }
    this._notify();
  }

  clear(): void {
    for (const item of this._queue.values()) {
      if (item.status === 'uploading') item.abortController.abort();
      URL.revokeObjectURL(item.previewUrl);
    }
    this._queue.clear();
    this._notify();
  }

  // ─── Caption ───────────────────────────────────────────────────────────

  updateCaption(id: string, caption: string): void {
    const item = this._queue.get(id);
    if (!item) return;
    item.caption = caption;
    this._notify();
  }
}

/** Application-wide singleton. */
export const uploadService = new UploadService();
