import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig(({ mode }) => ({
  plugins: [vue(), vuetify({ autoImport: true })],
  // Serve under /opensearch-manager/ in both dev and prod (proxied by Traefik)
  base: '/opensearch-manager/',
  // Use pnpm workspace linking; no absolute path aliases
  server: {
    host: true,
    port: 33010,
    proxy: {
      '/connect': { target: 'http://localhost:38106', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}))