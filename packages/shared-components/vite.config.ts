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
      name: 'PipelineSharedComponents',
      fileName: 'pipeline-shared-components',
      formats: ['es']
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled into the library
      external: [
        'vue',
        'vuetify',
        '@bufbuild/protobuf',
        '@connectrpc/connect',
        '@connectrpc/connect-web',
        '@io-pipeline/grpc-stubs',
        /^@io-pipeline\/grpc-stubs\//,
        /^vuetify/,
        /^@mdi/
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify'
        },
        // Preserve the original file structure in dist
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@io-pipeline/grpc-stubs': 'https://git.rokkon.com/api/packages/io-pipeline/npm/@io-pipeline/grpc-stubs'
    }
  }
})