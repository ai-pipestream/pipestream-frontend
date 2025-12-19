import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      staticImport: true,
      skipDiagnostics: false,
      tsconfigPath: './tsconfig.json'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PipelineSharedNav',
      fileName: 'pipeline-shared-nav',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'vue',
        'vuetify',
        '@ai-pipestream/protobuf-forms',
        /^vuetify/,
        /^@mdi/
      ],
      output: {
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify'
        },
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
