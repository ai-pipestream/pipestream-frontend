import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  base: '/modules/parser/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    host: true,
    port: 33002,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:39001',
        changeOrigin: true
      },
      '/connect': {
        target: 'http://localhost:38106',
        changeOrigin: true
      }
    }
  }
})