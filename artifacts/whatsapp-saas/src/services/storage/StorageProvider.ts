/**
 * StorageProvider — abstract interface for storage backends.
 *
 * Every storage implementation (AmazonS3Provider, Base64Provider, …) must
 * implement this interface. No component or hook ever imports a concrete
 * provider class directly — they always go through StorageService.
 */
import type { StorageResult } from './interfaces/StorageResult';
import type { UploadOptions } from './interfaces/StorageUpload';

export interface StorageProvider {
  /** Unique provider identifier (used for logging / diagnostics). */
  readonly name: string;

  /**
   * Upload a file to the storage backend.
   * Resolves with a StorageResult containing the public URL.
   * May throw if the provider is not configured or the upload fails.
   */
  upload(file: File, options?: UploadOptions): Promise<StorageResult>;

  /**
   * Delete a previously uploaded file by its storage key.
   * Implementations should be lenient — deleting a non-existent key should
   * not throw.
   */
  delete(key: string): Promise<void>;

  /**
   * Returns true when the provider has all required credentials / config.
   * StorageService uses this to pick between providers at runtime.
   */
  isConfigured(): boolean;
}
