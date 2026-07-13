/** Evolution API configuration — all values come from env vars, never hardcoded. */
export const evolutionConfig = {
  /** Base URL of the Evolution API instance (no trailing slash). */
  baseUrl: (import.meta.env.VITE_EVOLUTION_URL as string | undefined)?.replace(/\/$/, '') ?? '',
  /** API key used in the `apikey` header. */
  apiKey: (import.meta.env.VITE_EVOLUTION_API_KEY as string | undefined) ?? '',
} as const;

export function isEvolutionConfigured(): boolean {
  return Boolean(evolutionConfig.baseUrl && evolutionConfig.apiKey);
}
