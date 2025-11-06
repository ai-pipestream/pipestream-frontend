import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  base: '/modules/echo/',
  server: {
    host: true,
    port: 33001,
    strictPort: true,
    proxy: {
      '/connect': {
        target: 'http://localhost:38106',  // Web-proxy handles all Connect-RPC calls
        changeOrigin: true
      }
    }
  },
})
