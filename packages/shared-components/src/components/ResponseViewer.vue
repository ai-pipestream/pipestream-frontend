<template>
  <div class="response-viewer">
    <v-card v-if="response" elevation="0">
      <!-- Header with status -->
      <v-card-item class="pa-4">
        <template v-slot:prepend>
          <v-avatar 
            :color="response.success ? 'success' : 'error'" 
            size="56"
          >
            <v-icon size="32" color="white">
              {{ response.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
          </v-avatar>
        </template>
        
        <v-card-title class="text-h5 font-weight-bold">
          Mapping Response
        </v-card-title>
        
        <v-card-subtitle class="mt-1">
          <span class="text-medium-emphasis">Processed {{ new Date().toLocaleTimeString() }}</span>
        </v-card-subtitle>
        
        <template v-slot:append>
          <v-chip 
            :color="response.success ? 'success' : 'error'"
            variant="flat"
            size="large"
            class="font-weight-bold"
          >
            {{ response.success ? 'SUCCESS' : 'FAILED' }}
          </v-chip>
        </template>
      </v-card-item>

      <v-divider />

      <!-- Statistics Cards -->
      <v-container v-if="response.statistics" fluid class="pa-4">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="primary">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">
                  {{ response.statistics.processingTimeMs || 0 }}ms
                </div>
                <div class="text-caption">Processing Time</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="success">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">
                  {{ response.statistics.mappingsSuccessful || 0 }}
                </div>
                <div class="text-caption">Successful Mappings</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="info">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">
                  {{ response.statistics.mappingsTotal || 0 }}
                </div>
                <div class="text-caption">Total Mappings</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="warning">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">
                  {{ successRate }}%
                </div>
                <div class="text-caption">Success Rate</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Main Content Tabs -->
      <v-btn-group class="mb-4" variant="outlined">
        <v-btn 
          :variant="activeTab === 'document' ? 'flat' : 'outlined'"
          @click="activeTab = 'document'"
        >
          <v-icon start>mdi-file-document</v-icon>
          Output Document
        </v-btn>
        <v-btn 
          :variant="activeTab === 'mappings' ? 'flat' : 'outlined'"
          @click="activeTab = 'mappings'"
        >
          <v-icon start>mdi-swap-horizontal</v-icon>
          <span class="mr-2">Mappings Applied</span>
          <v-badge 
            v-if="response.appliedMappings?.length" 
            :content="response.appliedMappings.length"
            color="primary"
            inline
          />
        </v-btn>
        <v-btn 
          :variant="activeTab === 'raw' ? 'flat' : 'outlined'"
          @click="activeTab = 'raw'"
        >
          <v-icon start>mdi-code-json</v-icon>
          Raw Response
        </v-btn>
      </v-btn-group>

      <v-divider />

      <v-window v-model="activeTab">
        <!-- Output Document Tab -->
        <v-window-item value="document">
          <v-container fluid>
            <v-row v-if="outputDoc">
              <v-col cols="12">
                <v-card variant="outlined">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon class="mr-2">mdi-file-check</v-icon>
                    {{ outputDoc.title || 'Untitled Document' }}
                  </v-card-title>
                  <v-card-subtitle class="bg-grey-lighten-4 pb-3">
                    ID: {{ outputDoc.docId || 'No ID' }}
                  </v-card-subtitle>
                  <v-card-text>
                    <div class="text-body-1 mb-4" style="line-height: 1.6;">
                      {{ outputDoc.body || 'No content' }}
                    </div>
                    
                    <!-- Metadata chips -->
                    <div v-if="outputDoc.metadata && Object.keys(outputDoc.metadata).length">
                      <v-divider class="mb-3" />
                      <div class="text-subtitle-2 mb-2">Metadata</div>
                      <v-chip-group>
                        <v-chip
                          v-for="(value, key) in outputDoc.metadata"
                          :key="key"
                          variant="outlined"
                          size="small"
                        >
                          <v-icon start size="x-small">mdi-tag</v-icon>
                          {{ key }}: {{ value }}
                        </v-chip>
                      </v-chip-group>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col cols="12" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-file-remove</v-icon>
                <div class="text-h6 mt-4 text-grey">No output document</div>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        <!-- Mappings Tab -->
        <v-window-item value="mappings">
          <v-container fluid>
            <v-row v-if="response.appliedMappings?.length">
              <v-col cols="12">
                <!-- Mappings Data Table -->
                <v-data-table
                  :headers="mappingHeaders"
                  :items="mappingsTableData"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  <template v-slot:item.status="{ item }">
                    <v-icon 
                      :color="(item as any).success ? 'success' : 'error'"
                      size="small"
                    >
                      {{ (item as any).success ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </v-icon>
                  </template>
                  <template v-slot:item.transformation="{ item }">
                    <v-chip size="small" variant="outlined">
                      {{ (item as any).transformationType || 'DIRECT' }}
                    </v-chip>
                  </template>
                  <template v-slot:item.arrow="{}">
                    <v-icon>mdi-arrow-right</v-icon>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col cols="12" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-swap-horizontal-bold</v-icon>
                <div class="text-h6 mt-4 text-grey">No mappings applied</div>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        <!-- Raw Response Tab -->
        <v-window-item value="raw">
          <v-container fluid>
            <v-row>
              <v-col cols="12">
                <v-sheet class="pa-4 bg-grey-darken-4 rounded">
                  <v-btn
                    icon="mdi-content-copy"
                    size="small"
                    variant="text"
                    color="white"
                    class="float-right"
                    @click="copyToClipboard"
                  />
                  <pre class="text-white" style="font-size: 12px; overflow-x: auto;">{{ formattedJson }}</pre>
                </v-sheet>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="text-center py-12">
      <v-icon size="64" color="grey-lighten-2">mdi-message-reply-text-outline</v-icon>
      <v-card-title class="text-h5 mt-4">No Response Data</v-card-title>
      <v-card-subtitle>Execute a mapping request to see the response</v-card-subtitle>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ApplyMappingResponse } from '@ai-pipestream/protobuf-forms/generated'

interface Props {
  response: ApplyMappingResponse | any  // Accept protobuf or plain object
}

const props = defineProps<Props>()
const activeTab = ref('document')

// Computed properties
const outputDoc = computed(() => {
  return props.response?.outputDoc || props.response?.processedDocument || null
})

const successRate = computed(() => {
  if (!props.response?.statistics) return 0
  const { mappingsTotal, mappingsSuccessful } = props.response.statistics
  if (!mappingsTotal) return 0
  return Math.round((mappingsSuccessful / mappingsTotal) * 100)
})

const formattedJson = computed(() => {
  return JSON.stringify(props.response, null, 2)
})

const mappingHeaders = [
  { title: '', key: 'status', width: '50px', sortable: false },
  { title: 'Source Field', key: 'sourceField', width: '30%' },
  { title: '', key: 'arrow', width: '50px', sortable: false },
  { title: 'Target Field', key: 'targetField', width: '30%' },
  { title: 'Transformation', key: 'transformation', width: '20%' },
]

const mappingsTableData = computed(() => {
  if (!props.response?.appliedMappings) return []
  return props.response.appliedMappings.map((mapping: any, index: number) => ({
    id: index,
    success: mapping.success !== false,
    sourceField: mapping.sourceField || 'N/A',
    targetField: mapping.targetField || 'N/A',
    transformationType: mapping.transformationType || 'DIRECT'
  }))
})

// Methods
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    // Could add a snackbar notification here
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.v-card-item {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

/* Dark mode support */
.v-theme--dark .v-card-item {
  background: linear-gradient(135deg, #424242 0%, #303030 100%);
}

.v-chip {
  font-weight: 600;
}

.v-data-table {
  border-radius: 8px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
}

.v-window {
  min-height: 400px;
}
</style>