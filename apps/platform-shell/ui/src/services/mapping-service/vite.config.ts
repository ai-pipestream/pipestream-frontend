import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  base: '/mapping-service/',
  resolve: {
    alias: {
      // Remove alias - let pnpm handle the resolution to the built package
    }
  },
  server: {
    host: true,
    port: 33007,
    strictPort: true,
    proxy: {
      '/connect': {
        target: 'http://localhost:38106',  // Web-proxy handles all Connect-RPC calls
        changeOrigin: true
      }
    }
  },
});