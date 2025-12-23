import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/platform-registration/',
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      // Let pnpm handle the resolution to the built packages
    }
  },
  server: {
    port: 33009,
    host: true,
    strictPort: true,
    allowedHosts: ['krick-1', 'localhost'],
    proxy: {
      '/connect': {
        target: 'http://localhost:38106',  // Web-proxy handles all Connect-RPC calls
        changeOrigin: true,
        // This proxies all gRPC-web/Connect-RPC calls to the web-proxy
      }
    }
  },
});