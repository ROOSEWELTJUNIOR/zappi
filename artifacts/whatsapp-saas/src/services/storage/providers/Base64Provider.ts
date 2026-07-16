/**
 * Base64Provider — fallback storage provider.
 *
 * Converts the file to a base64 data URI using the browser's FileReader API.
 * The base64 string is then passed directly to the Evolution API `sendMedia`
 * call — no external storage service required.
 *
 * Use this when VITE_AWS_* env vars are not configured.
 *
 * Trade-offs:
 *  ✅  Zero configuration, always available.
 *  ⚠️  Large files produce very large payloads (not ideal above ~10 MB).
 *  ⚠️  Files are not persisted beyond the Evolution API delivery.
 *
 * Switch to AmazonS3Provider in production by setting the VITE_AWS_* vars.
 */
import type { StorageProvider } from '../StorageProvider';
import type { StorageResult } from '../interfaces/StorageResult';
import type { UploadOptions } from '../interfaces/StorageUpload';

export class Base64Provider implements StorageProvider {
  readonly name = 'base64';

  isConfigured(): boolean {
    return true; // always available as fallback
  }

  async upload(file: File, options: UploadOptions = {}): Promise<StorageResult> {
    const base64DataUri = await this._readAsDataURL(file, options);

    return {
      url: base64DataUri,
      key: `base64:${file.name}`,
      provider: 'base64',
      size: file.size,
      mimetype: file.type,
      fileName: file.name,
    };
  }

  async delete(_key: string): Promise<void> {
    // No-op: base64 provider doesn't persist files anywhere.
  }

  private _readAsDataURL(file: File, options: UploadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      // Respect cancellation
      if (options.signal?.aborted) {
        reject(Object.assign(new Error('Upload cancelado.'), { name: 'AbortError' }));
        return;
      }

      const reader = new FileReader();
      const startedAt = Date.now();
      const total = file.size;

      options.signal?.addEventListener('abort', () => {
        reader.abort();
        reject(Object.assign(new Error('Upload cancelado.'), { name: 'AbortError' }));
      });

      reader.onprogress = (e) => {
        if (e.lengthComputable && options.onProgress) {
          const loaded  = e.loaded;
          const elapsed = Math.max((Date.now() - startedAt) / 1000, 0.001);
          const speedBps = loaded / elapsed;
          options.onProgress({
            loaded,
            total,
            percentage: Math.min(99, Math.round((loaded / total) * 100)),
            speedBps,
            remainingSecs: speedBps > 0 ? (total - loaded) / speedBps : 0,
          });
        }
      };

      reader.onload = () => {
        options.onProgress?.({
          loaded: total, total,
          percentage: 100, speedBps: 0, remainingSecs: 0,
        });
        resolve(reader.result as string);
      };

      reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }
}
