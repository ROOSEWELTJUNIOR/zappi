/**
 * StorageService — singleton facade for the active storage provider.
 *
 * Provider selection (automatic at runtime):
 *   1. AmazonS3Provider  — when all VITE_AWS_* env vars are present.
 *   2. Base64Provider    — fallback for development / unconfigured environments.
 *
 * No component or hook imports a provider class directly.
 * They always call `storageService.upload(...)`.
 *
 * Swapping storage backends in the future:
 *   1. Create a new class implementing StorageProvider.
 *   2. Register it in the `_resolve()` method below.
 *   3. Done — the rest of the app needs zero changes.
 */
import type { StorageProvider } from './StorageProvider';
import type { StorageResult } from './interfaces/StorageResult';
import type { UploadOptions } from './interfaces/StorageUpload';
import { AmazonS3Provider } from './providers/AmazonS3Provider';
import { Base64Provider    } from './providers/Base64Provider';

class StorageService {
  private _provider: StorageProvider | null = null;

  /** Lazy-init: pick the best available provider at first use. */
  private _resolve(): StorageProvider {
    if (this._provider) return this._provider;

    const s3 = new AmazonS3Provider();
    if (s3.isConfigured()) {
      this._provider = s3;
      return this._provider;
    }

    this._provider = new Base64Provider();
    return this._provider;
  }

  /** Name of the currently active provider. */
  get providerName(): string {
    return this._resolve().name;
  }

  /** True when the active provider can upload files to a durable backend. */
  get isRemote(): boolean {
    return this._resolve().name === 'amazons3';
  }

  /**
   * Upload a file using the active provider.
   * Returns a StorageResult with a `url` that can be passed to the Evolution API.
   */
  upload(file: File, options?: UploadOptions): Promise<StorageResult> {
    return this._resolve().upload(file, options);
  }

  /**
   * Delete a previously uploaded file by key.
   * No-op if the active provider doesn't support deletion (e.g. Base64Provider).
   */
  delete(key: string): Promise<void> {
    return this._resolve().delete(key);
  }

  /**
   * Force a specific provider (useful in tests or admin settings).
   * Pass `null` to revert to automatic selection.
   */
  setProvider(provider: StorageProvider | null): void {
    this._provider = provider;
  }
}

/** Application-wide singleton. Import this, never instantiate manually. */
export const storageService = new StorageService();
