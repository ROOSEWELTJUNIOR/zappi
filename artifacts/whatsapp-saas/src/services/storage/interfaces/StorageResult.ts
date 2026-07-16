/**
 * StorageResult — returned by every StorageProvider.upload() call.
 * Components never inspect the provider field — they only use `url`.
 */

export type StorageProviderName = 'amazons3' | 'base64';

export interface StorageResult {
  /** Public URL to access the stored file. */
  url: string;
  /** Storage key / object path within the bucket or storage system. */
  key: string;
  /** Which provider stored the file. */
  provider: StorageProviderName;
  /** File size in bytes. */
  size: number;
  /** MIME type of the stored file. */
  mimetype: string;
  /** Original file name. */
  fileName: string;
  /** Bucket / container name (S3 only). */
  bucket?: string;
}
