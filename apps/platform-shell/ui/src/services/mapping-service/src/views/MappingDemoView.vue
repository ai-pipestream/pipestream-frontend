<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-4">
      <v-icon icon="mdi-code-braces" class="mr-2" size="large" />
      <h2 class="text-h5">Mapping Service Demo</h2>
    </div>

    <!-- Service Demo Section -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-test-tube" class="mr-2" />
            Test Mapping Service
          </v-card-title>
          <v-card-text>
            <v-btn 
              @click="callMappingService" 
              color="primary" 
              class="mb-4"
              :loading="loading"
            >
              <v-icon start>mdi-play</v-icon>
              Call Mapping Service
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Sample Document Preview -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-file-document" class="mr-2" />
            Sample Document
          </v-card-title>
          <v-card-text>
            <PipeDocPreview :document="sampleDocument" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Service Response -->
    <v-row v-if="response" class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-code-json" class="mr-2" />
            Service Response
          </v-card-title>
          <v-card-text>
            <pre class="text-body-2">{{ response }}</pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error Display -->
    <v-alert v-if="error" type="error" class="mt-4" closable>
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createClient } from '@connectrpc/connect'
import { create } from '@bufbuild/protobuf'
import { 
  MappingService, 
  ApplyMappingRequestSchema, 
  ApplyMappingResponseSchema,
} from '@ai-pipestream/grpc-stubs/dist/mapping-service/mapping_service_pb'
import { PipeDocPreview } from '@ai-pipestream/shared-components'

const loading = ref(false)
const response = ref<any>(null)
const error = ref<string | null>(null)

// Sample document for testing the PipeDocPreview component
const sampleDocument = ref({
  docId: 'test-doc-123',
  title: 'Sample Pipeline Document',
  body: 'This is a **sample document** for testing the PipeDocPreview component.\n\nIt contains multiple paragraphs to demonstrate the formatting capabilities.\n\n*Italic text* and **bold text** are supported, as well as links like https://example.com',
  originalMimeType: 'text/plain',
  lastProcessed: new Date().toISOString(),
  metadata: {
    author: 'Test User',
    department: 'Engineering',
    tags: 'test, sample, demo',
    version: '1.0.0',
    processedBy: 'mapping-service'
  }
})

// Use the binary transport from proto-stubs - now using web-proxy
const transport = createConnectTransport()
const client = createClient(MappingService, transport)

async function callMappingService() {
  loading.value = true
  error.value = null
  response.value = null
  
  try {
    const request = create(ApplyMappingRequestSchema, {
      rules: [],
    })

    const res = await client.applyMapping(request)
    
    // Convert the plain object response to a proper protobuf message
    const properResponse = create(ApplyMappingResponseSchema, res)
    
  } catch (err) {
    console.error('Error:', err)
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>