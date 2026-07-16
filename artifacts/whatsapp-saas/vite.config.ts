import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  // Load .env from the monorepo root so VITE_* vars defined there are available.
  envDir: path.resolve(import.meta.dirname, '../..'),
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      // Proxy all Evolution API calls through the dev server to avoid CORS.
      // The browser calls /evolution-proxy/... → Vite forwards to the real API
      // server-side, where there are no browser CORS restrictions.
      '/evolution-proxy': {
        target: process.env.VITE_EVOLUTION_URL ?? 'http://localhost',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/evolution-proxy/, ''),
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/evolution-proxy': {
        target: process.env.VITE_EVOLUTION_URL ?? 'http://localhost',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/evolution-proxy/, ''),
      },
    },
  },
});
