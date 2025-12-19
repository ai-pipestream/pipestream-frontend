import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Get backend URL from environment or use default
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:38106';
  const devServerPort = parseInt(env.VITE_DEV_SERVER_PORT || '33000', 10);

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['@ai-pipestream/protobuf-forms'],
      force: true,  // Force re-optimization on server start
      esbuildOptions: {
        target: 'es2020',
      },
    },
    build: {
      target: 'es2020',
      outDir: '../public',
      emptyOutDir: true,
      sourcemap: false,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
    server: {
      port: devServerPort,
      warmup: {
        clientFiles: ['./src/main.ts'],
      },
      proxy: {
        // Proxy Connect protocol service requests (ai.pipestream.*)
        '^/ai\\.pipestream\\.': {
          target: backendUrl,
          changeOrigin: true,
        },
        // Proxy REST API endpoints
        '/connect': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/proxy': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
