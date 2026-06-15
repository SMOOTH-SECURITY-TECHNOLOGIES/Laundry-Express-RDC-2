import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:18000';

  return {
    server: {
      port: 3003,
      host: '0.0.0.0',
      headers: {
        'Cache-Control': 'no-store',
      },
      proxy: {
        '/api/v1': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },

    plugins: [
      react(),
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_ENABLE_FIREBASE': JSON.stringify(env.VITE_ENABLE_FIREBASE),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    build: {
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/')
            ) {
              return 'react-core';
            }

            if (id.includes('/node_modules/@google/genai/')) {
              return 'genai';
            }

            if (
              id.includes('/node_modules/p-retry/') ||
              id.includes('/node_modules/retry/')
            ) {
              return 'retry-vendor';
            }

            if (id.includes('/node_modules/firebase/')) {
              return 'firebase';
            }

            if (id.includes('/node_modules/lodash/')) {
              return 'lodash';
            }

            return 'vendor';
          },

          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },

    experimental: {
      renderBuiltUrl(filename) {
        return filename;
      },
    },

    optimizeDeps: {
      include: ['react-dom/client', 'p-retry'],
    },

    css: {
      devSourcemap: false,
    },
  };
});