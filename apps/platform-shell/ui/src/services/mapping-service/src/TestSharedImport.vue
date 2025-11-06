<template>
  <v-container>
    <v-card>
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-package-variant</v-icon>
        Shared Component Import Test
      </v-card-title>
      <v-card-subtitle>
        Testing import from @io-pipeline/mapping-service-ui exports
      </v-card-subtitle>
      <v-card-text>
        <v-alert type="success" variant="tonal" class="mb-4">
          <strong>Success!</strong> Components imported from the export structure are working.
          This proves we can share these components across different frontends.
        </v-alert>

        <!-- Using the imported component -->
        <PipeDocPreview :document="testDocument" />

        <v-divider class="my-4" />

        <div class="text-caption">
          <strong>Import Path:</strong> 
          <code>import { PipeDocPreview } from './components'</code>
        </div>
        <div class="text-caption mt-2">
          <strong>Component Metadata:</strong>
          <pre>{{ JSON.stringify(metadata.PipeDocPreview, null, 2) }}</pre>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// Import from the export structure (simulating external import)
import { PipeDocPreview, componentMetadata } from './components'

const metadata = componentMetadata

const testDocument = ref({
  docId: 'shared-test-001',
  title: 'Shared Component Test Document',
  body: `This document is rendered using a component imported from the shared export structure.

**This proves that:**
- Components can be exported and shared
- The export structure is working correctly
- Other services can import and use these components
- We're ready to create a shared component library

Once all components are migrated, we can move them to a dedicated @io-pipeline/shared-components package.`,
  originalMimeType: 'text/markdown',
  metadata: {
    test: 'shared-import',
    status: 'working',
    timestamp: new Date().toISOString()
  }
})
</script>