/** Evolution API configuration — all values come from env vars, never hardcoded. */

/**
 * In development (Vite dev/preview server) all requests are routed through
 * the local proxy at `/evolution-proxy` which forwards them server-side to
 * VITE_EVOLUTION_URL. This completely bypasses browser CORS restrictions.
 *
 * In production builds the full URL is used directly — CORS must be enabled
 * on the Evolution API server in that case.
 */
const _rawUrl = (import.meta.env.VITE_EVOLUTION_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export const evolutionConfig = {
  /** Base URL for the axios client. Proxy path in dev, real URL in prod. */
  baseUrl: import.meta.env.DEV ? '/evolution-proxy' : _rawUrl,
  /** Full Evolution API URL (useful for display in Settings). */
  publicUrl: _rawUrl,
  /** API key used in the `apikey` header. */
  apiKey: (import.meta.env.VITE_EVOLUTION_API_KEY as string | undefined) ?? '',
} as const;

export function isEvolutionConfigured(): boolean {
  return Boolean(evolutionConfig.publicUrl && evolutionConfig.apiKey);
}
