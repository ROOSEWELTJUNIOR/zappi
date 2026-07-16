/**
 * AmazonS3Provider — direct browser-to-S3 upload via AWS Signature V4.
 *
 * ✅  Zero external npm packages — uses the browser's native Web Crypto API
 *     (SubtleCrypto) for HMAC-SHA256 signing and XMLHttpRequest for upload
 *     progress events.
 *
 * ─── Required environment variables (add to .env) ───────────────────────────
 *  VITE_AWS_REGION              e.g.  us-east-1
 *  VITE_AWS_ACCESS_KEY_ID       IAM user access key
 *  VITE_AWS_SECRET_ACCESS_KEY   IAM user secret key
 *  VITE_AWS_S3_BUCKET           S3 bucket name
 *
 * ─── S3 Bucket requirements ─────────────────────────────────────────────────
 *  1. Enable CORS on the bucket — allow PUT from your app's origin:
 *     https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html
 *
 *  2. Either enable public read (ACL = public-read) or configure a bucket
 *     policy so the Evolution API can fetch the uploaded files.
 *
 * ─── IAM minimum permissions ─────────────────────────────────────────────────
 *  {
 *    "Effect": "Allow",
 *    "Action": ["s3:PutObject", "s3:DeleteObject"],
 *    "Resource": "arn:aws:s3:::YOUR_BUCKET/media/*"
 *  }
 *
 * ─── Production recommendation ───────────────────────────────────────────────
 *  For zero-trust environments, use a backend endpoint to generate pre-signed
 *  PUT URLs instead of embedding credentials in the frontend bundle.
 *  Swap this provider for a PresignedS3Provider without touching any other file.
 */
import type { StorageProvider } from '../StorageProvider';
import type { StorageResult } from '../interfaces/StorageResult';
import type { UploadOptions } from '../interfaces/StorageUpload';

// ─── Read env vars at module load time ───────────────────────────────────────
const S3_CONFIG = {
  region:    (import.meta.env.VITE_AWS_REGION            as string | undefined) ?? '',
  accessKey: (import.meta.env.VITE_AWS_ACCESS_KEY_ID     as string | undefined) ?? '',
  secretKey: (import.meta.env.VITE_AWS_SECRET_ACCESS_KEY as string | undefined) ?? '',
  bucket:    (import.meta.env.VITE_AWS_S3_BUCKET         as string | undefined) ?? '',
};

// ─── AWS Signature V4 helpers — Web Crypto API only ──────────────────────────

const _enc = new TextEncoder();

async function _sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', _enc.encode(message));
  return _bufHex(new Uint8Array(buf));
}

async function _hmac(
  key: ArrayBuffer | Uint8Array | string,
  message: string,
): Promise<ArrayBuffer> {
  const keyData = typeof key === 'string' ? _enc.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, _enc.encode(message));
}

function _bufHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** YYYYMMDDTHHmmssZ */
function _amzDatetime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** YYYYMMDD */
function _datestamp(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Build the signed Authorization header and required x-amz-* headers
 * for a PUT request to S3.
 */
async function _buildHeaders(
  objectKey: string,
  contentType: string,
  now: Date,
): Promise<Record<string, string>> {
  const { region, accessKey, secretKey, bucket } = S3_CONFIG;

  const amzDatetime  = _amzDatetime(now);
  const dateStamp    = _datestamp(now);
  const service      = 's3';
  const host         = `${bucket}.s3.${region}.amazonaws.com`;
  const credScope    = `${dateStamp}/${region}/${service}/aws4_request`;

  // Canonical headers — must be sorted alphabetically by key (lowercase).
  const headerEntries: [string, string][] = [
    ['content-type',           contentType],
    ['host',                   host],
    ['x-amz-content-sha256',  'UNSIGNED-PAYLOAD'],
    ['x-amz-date',             amzDatetime],
  ].sort(([a], [b]) => a.localeCompare(b));

  const canonicalHeaders  = headerEntries.map(([k, v]) => `${k}:${v}`).join('\n') + '\n';
  const signedHeadersList = headerEntries.map(([k]) => k).join(';');

  // URI-encode each path segment of the key, preserving slashes.
  const canonicalUri =
    '/' +
    objectKey
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',                   // empty query string
    canonicalHeaders,
    signedHeadersList,
    'UNSIGNED-PAYLOAD',   // skip body hash for browser uploads
  ].join('\n');

  // String to sign
  const canonicalHash = await _sha256Hex(canonicalRequest);
  const stringToSign  = [
    'AWS4-HMAC-SHA256',
    amzDatetime,
    credScope,
    canonicalHash,
  ].join('\n');

  // Signing key derivation chain: kSecret → kDate → kRegion → kService → kSigning
  const kDate    = await _hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion  = await _hmac(kDate,    region);
  const kService = await _hmac(kRegion,  service);
  const kSigning = await _hmac(kService, 'aws4_request');

  const sigBuf    = await _hmac(kSigning, stringToSign);
  const signature = _bufHex(new Uint8Array(sigBuf));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credScope}, ` +
    `SignedHeaders=${signedHeadersList}, ` +
    `Signature=${signature}`;

  return {
    Authorization:          authorization,
    'Content-Type':         contentType,
    'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    'x-amz-date':           amzDatetime,
  };
}

// ─── XHR upload with progress ─────────────────────────────────────────────────

function _xhrUpload(
  url: string,
  file: File,
  headers: Record<string, string>,
  options: UploadOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startedAt = Date.now();

    // Wire up AbortSignal → xhr.abort()
    options.signal?.addEventListener('abort', () => {
      xhr.abort();
      reject(
        Object.assign(new Error('Upload cancelado pelo usuário.'), { name: 'AbortError' }),
      );
    });

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        const elapsed  = Math.max((Date.now() - startedAt) / 1000, 0.001);
        const speedBps = e.loaded / elapsed;
        options.onProgress({
          loaded: e.loaded,
          total:  e.total,
          percentage: Math.min(99, Math.round((e.loaded / e.total) * 100)),
          speedBps,
          remainingSecs: speedBps > 0 ? (e.total - e.loaded) / speedBps : 0,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.({
          loaded: file.size, total: file.size,
          percentage: 100, speedBps: 0, remainingSecs: 0,
        });
        resolve();
      } else {
        reject(new Error(`Falha no upload para S3: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede durante o upload para S3.'));
    xhr.onabort = () => reject(
      Object.assign(new Error('Upload cancelado.'), { name: 'AbortError' }),
    );

    xhr.open('PUT', url, true);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.send(file);
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class AmazonS3Provider implements StorageProvider {
  readonly name = 'amazons3';

  isConfigured(): boolean {
    return Boolean(
      S3_CONFIG.region    &&
      S3_CONFIG.accessKey &&
      S3_CONFIG.secretKey &&
      S3_CONFIG.bucket,
    );
  }

  async upload(file: File, options: UploadOptions = {}): Promise<StorageResult> {
    const { region, accessKey, bucket } = S3_CONFIG;

    if (!this.isConfigured()) {
      throw new Error(
        'Amazon S3 não configurado. Defina as variáveis de ambiente: ' +
        'VITE_AWS_REGION, VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY, VITE_AWS_S3_BUCKET.',
      );
    }

    // Build a unique, collision-resistant storage key.
    const uuid   = crypto.randomUUID();
    const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const now    = new Date();
    const yyyy   = now.getFullYear();
    const mm     = String(now.getMonth() + 1).padStart(2, '0');
    const dd     = String(now.getDate()).padStart(2, '0');
    const folder = options.folder ?? 'media';
    const key    = `${folder}/${yyyy}/${mm}/${dd}/${uuid}.${ext}`;

    const endpointUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    const headers     = await _buildHeaders(key, file.type, now);

    await _xhrUpload(endpointUrl, file, headers, options);

    return {
      url:      endpointUrl,
      key,
      provider: 'amazons3',
      size:     file.size,
      mimetype: file.type,
      fileName: file.name,
      bucket,
    };
  }

  async delete(key: string): Promise<void> {
    if (!this.isConfigured()) return;

    const { region, bucket } = S3_CONFIG;
    const endpointUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    const now = new Date();

    const headers = await _buildHeaders(key, 'application/octet-stream', now);
    // Reuse headers but override method via fetch DELETE
    await fetch(endpointUrl, {
      method: 'DELETE',
      headers: {
        Authorization:          headers['Authorization'],
        'x-amz-content-sha256': headers['x-amz-content-sha256'],
        'x-amz-date':           headers['x-amz-date'],
      },
    });
  }
}
