<template>
  <div class="pipe-doc-preview">
    <v-card v-if="document" elevation="0">
      <!-- Header with document info -->
      <v-card-item class="pa-4">
        <template v-slot:prepend>
          <v-avatar color="primary" size="56">
            <v-icon size="32" color="white">mdi-file-document</v-icon>
          </v-avatar>
        </template>
        
        <v-card-title class="text-h5 font-weight-bold">
          {{ documentTitle }}
        </v-card-title>
        
        <v-card-subtitle class="mt-1">
          <v-chip size="small" variant="tonal" class="mr-2">
            <template #prepend>
              <v-icon size="small">mdi-identifier</v-icon>
            </template>
            ID: {{ document.docId || 'No ID' }}
          </v-chip>
          <v-chip v-if="document.originalMimeType" size="small" variant="tonal" class="mr-2">
            <template #prepend>
              <v-icon size="small">mdi-file-outline</v-icon>
            </template>
            {{ document.originalMimeType }}
          </v-chip>
          <v-chip v-if="document.lastProcessed" size="small" variant="tonal" color="info">
            <template #prepend>
              <v-icon size="small">mdi-clock-outline</v-icon>
            </template>
            {{ formatDate(document.lastProcessed) }}
          </v-chip>
        </v-card-subtitle>
      </v-card-item>

      <v-divider />

      <!-- Document Statistics Cards -->
      <v-container v-if="showStats" fluid class="pa-4">
        <v-row>
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="primary">
              <v-card-text class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ wordCount }}</div>
                <div class="text-caption">Words</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="secondary">
              <v-card-text class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ characterCount }}</div>
                <div class="text-caption">Characters</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="info">
              <v-card-text class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ paragraphCount }}</div>
                <div class="text-caption">Paragraphs</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="success">
              <v-card-text class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ metadataCount }}</div>
                <div class="text-caption">Metadata Fields</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Content Tabs -->
      <v-btn-group class="mb-4" variant="outlined">
        <v-btn 
          :variant="activeTab === 'formatted' ? 'flat' : 'outlined'"
          @click="activeTab = 'formatted'"
        >
          <template #prepend>
            <v-icon>mdi-format-text</v-icon>
          </template>
          Formatted View
        </v-btn>
        <v-btn 
          :variant="activeTab === 'attachments' ? 'flat' : 'outlined'"
          @click="activeTab = 'attachments'"
        >
          <template #prepend>
            <v-icon>mdi-paperclip</v-icon>
          </template>
          {{ `Attachments${blobCount > 0 ? ` (${blobCount})` : ''}` }}
        </v-btn>
        <v-btn 
          :variant="activeTab === 'metadata' ? 'flat' : 'outlined'"
          @click="activeTab = 'metadata'"
        >
          <template #prepend>
            <v-icon>mdi-tag-multiple</v-icon>
          </template>
          {{ `Metadata${metadataCount > 0 ? ` (${metadataCount})` : ''}` }}
        </v-btn>
        <v-btn 
          :variant="activeTab === 'raw' ? 'flat' : 'outlined'"
          @click="activeTab = 'raw'"
        >
          <template #prepend>
            <v-icon>mdi-code-json</v-icon>
          </template>
          Raw JSON
        </v-btn>
      </v-btn-group>

      <v-divider />

      <v-window v-model="activeTab">
        <!-- Formatted Content Tab -->
        <v-window-item value="formatted">
          <v-container fluid>
            <v-row>
              <v-col cols="12">
                <v-card variant="flat">
                  <v-card-text>
                    <!-- Document Body -->
                    <div v-if="documentBody" class="document-content">
                      <div v-html="formatBody(documentBody)" class="text-body-1" />
                    </div>
                    <div v-else class="text-center py-8">
                      <v-icon size="64" color="grey-lighten-2">mdi-text-box-remove-outline</v-icon>
                      <div class="text-h6 mt-4 text-grey">No content available</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        <!-- Attachments Tab -->
        <v-window-item value="attachments">
          <v-container fluid>
            <v-row v-if="hasBlobs">
              <v-col cols="12">
                <v-list class="bg-transparent">
                  <v-list-item
                    v-for="(blob, index) in document.blobs"
                    :key="index"
                    class="mb-3"
                  >
                    <v-card variant="outlined" class="w-100">
                      <v-expansion-panels variant="accordion">
                        <v-expansion-panel>
                          <v-expansion-panel-title>
                            <div class="d-flex align-center w-100">
                              <v-avatar 
                                :color="getFileColor(blob.mimeType)"
                                size="40"
                                class="mr-3"
                              >
                                <v-icon 
                                  :icon="getFileIcon(blob.mimeType || blob.filename)" 
                                  color="white"
                                  size="small"
                                />
                              </v-avatar>
                              <div class="flex-grow-1">
                                <div class="font-weight-medium">
                                  {{ blob.filename || `attachment-${index + 1}` }}
                                </div>
                                <div class="text-caption text-medium-emphasis">
                                  {{ formatFileSize(blob.size || blob.data?.length || 0) }} • {{ blob.mimeType || 'Unknown type' }}
                                </div>
                              </div>
                              <div class="d-flex gap-2 mr-4" @click.stop>
                                <v-tooltip text="Download" location="top">
                                  <template v-slot:activator="{ props }">
                                    <v-btn
                                      v-bind="props"
                                      icon
                                      size="small"
                                      variant="tonal"
                                      color="primary"
                                      @click.stop="downloadBlob(blob, index)"
                                    >
                                      <v-icon>mdi-download</v-icon>
                                    </v-btn>
                                  </template>
                                </v-tooltip>
                                <v-tooltip text="Preview" location="top" v-if="isPreviewable(blob.mimeType)">
                                  <template v-slot:activator="{ props }">
                                    <v-btn
                                      v-bind="props"
                                      icon
                                      size="small"
                                      variant="tonal"
                                      @click.stop="previewBlob(blob)"
                                    >
                                      <v-icon>mdi-eye</v-icon>
                                    </v-btn>
                                  </template>
                                </v-tooltip>
                              </div>
                            </div>
                          </v-expansion-panel-title>
                          <v-expansion-panel-text>
                            <v-list density="compact" class="bg-grey-lighten-5">
                              <v-list-item v-if="blob.filename">
                                <v-list-item-title class="text-caption">Filename</v-list-item-title>
                                <v-list-item-subtitle>{{ blob.filename }}</v-list-item-subtitle>
                              </v-list-item>
                              <v-list-item v-if="blob.mimeType">
                                <v-list-item-title class="text-caption">MIME Type</v-list-item-title>
                                <v-list-item-subtitle>{{ blob.mimeType }}</v-list-item-subtitle>
                              </v-list-item>
                              <v-list-item v-if="blob.size || blob.data">
                                <v-list-item-title class="text-caption">Size</v-list-item-title>
                                <v-list-item-subtitle>{{ formatFileSize(blob.size || blob.data?.length || 0) }}</v-list-item-subtitle>
                              </v-list-item>
                              <v-list-item v-if="blob.encoding">
                                <v-list-item-title class="text-caption">Encoding</v-list-item-title>
                                <v-list-item-subtitle>{{ blob.encoding }}</v-list-item-subtitle>
                              </v-list-item>
                              <v-list-item v-if="blob.checksum">
                                <v-list-item-title class="text-caption">Checksum</v-list-item-title>
                                <v-list-item-subtitle class="text-truncate">{{ blob.checksum }}</v-list-item-subtitle>
                              </v-list-item>
                              <v-list-item v-if="blob.metadata">
                                <v-list-item-title class="text-caption">Custom Metadata</v-list-item-title>
                                <v-list-item-subtitle>
                                  <v-chip-group>
                                    <v-chip
                                      v-for="(value, key) in blob.metadata"
                                      :key="key"
                                      size="x-small"
                                      variant="tonal"
                                    >
                                      {{ key }}: {{ value }}
                                    </v-chip>
                                  </v-chip-group>
                                </v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </v-card>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col cols="12" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-paperclip-off</v-icon>
                <div class="text-h6 mt-4 text-grey">No attachments</div>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        <!-- Metadata Tab -->
        <v-window-item value="metadata">
          <v-container fluid>
            <v-row v-if="hasMetadata">
              <v-col cols="12">
                <v-list lines="two" class="bg-transparent">
                  <v-list-item 
                    v-for="(value, key) in document.metadata" 
                    :key="key"
                    class="px-4"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="primary" variant="tonal">
                        <v-icon>mdi-tag</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-medium">
                      {{ formatKey(String(key)) }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-wrap">
                      {{ value }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-content-copy"
                        size="small"
                        variant="text"
                        @click="copyValue(value)"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col cols="12" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-tag-off-outline</v-icon>
                <div class="text-h6 mt-4 text-grey">No metadata available</div>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        <!-- Raw JSON Tab -->
        <v-window-item value="raw">
          <v-container fluid>
            <v-row>
              <v-col cols="12">
                <v-sheet class="pa-4 bg-grey-darken-4 rounded position-relative">
                  <v-btn
                    icon="mdi-content-copy"
                    size="small"
                    variant="text"
                    color="white"
                    class="position-absolute"
                    style="top: 8px; right: 8px; z-index: 1;"
                    @click="copyToClipboard"
                  />
                  <pre class="text-white json-content">{{ formattedJson }}</pre>
                </v-sheet>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="text-center py-12">
      <v-icon size="64" color="grey-lighten-2">mdi-file-document-outline</v-icon>
      <v-card-title class="text-h5 mt-4">No Document</v-card-title>
      <v-card-subtitle>Select or create a document to preview</v-card-subtitle>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PipeDoc } from '@ai-pipestream/grpc-stubs/dist/core/pipeline_core_types_pb'

interface Props {
  document: PipeDoc | any  // Accept protobuf or plain object
  showStats?: boolean
  // For simplified UI, we accept flattened structure
  // In production, title/body would be in document.searchMetadata
}

const props = withDefaults(defineProps<Props>(), {
  showStats: true
})

const activeTab = ref('formatted')

// Computed properties to handle both protobuf and simplified structures
const documentTitle = computed(() => {
  // Check searchMetadata first (proper protobuf structure)
  if (props.document?.searchMetadata?.title) {
    return props.document.searchMetadata.title
  }
  // Fall back to simplified structure for UI convenience
  return props.document?.title || 'Untitled Document'
})

const documentBody = computed(() => {
  // Check searchMetadata first (proper protobuf structure)
  if (props.document?.searchMetadata?.body) {
    return props.document.searchMetadata.body
  }
  // Fall back to simplified structure for UI convenience
  return props.document?.body || ''
})

const hasMetadata = computed(() => {
  // For protobuf, metadata would be in different structure
  // For now, support simplified structure
  return props.document?.metadata && Object.keys(props.document.metadata).length > 0
})

const hasBlobs = computed(() => {
  return props.document?.blobs && props.document.blobs.length > 0
})

const blobCount = computed(() => {
  return props.document?.blobs?.length || 0
})

const wordCount = computed(() => {
  if (!documentBody.value) return 0
  return documentBody.value.trim().split(/\s+/).filter((word: string) => word.length > 0).length
})

const characterCount = computed(() => {
  return documentBody.value?.length || 0
})

const paragraphCount = computed(() => {
  if (!documentBody.value) return 0
  return documentBody.value.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0).length
})

const metadataCount = computed(() => {
  return Object.keys(props.document?.metadata || {}).length
})

const formattedJson = computed(() => {
  return JSON.stringify(props.document, null, 2)
})

// Methods
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  } catch {
    return 'Invalid date'
  }
}

const formatKey = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim()
}

const formatBody = (body: string): string => {
  if (!body) return ''
  
  let formatted = body
  
  // Escape HTML first
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Convert line breaks to HTML
  formatted = formatted.replace(/\n\n/g, '</p><p>')
  formatted = formatted.replace(/\n/g, '<br>')
  formatted = `<p>${formatted}</p>`
  
  // Add basic markdown formatting
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>')
  
  // Convert URLs to links
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener" class="text-primary">$1</a>'
  )
  
  return formatted
}

const copyValue = async (value: any) => {
  try {
    await navigator.clipboard.writeText(String(value))
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Blob/Attachment Methods
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (input: string): string => {
  const mimeType = input?.toLowerCase() || ''
  const filename = input?.toLowerCase() || ''
  
  // Check by MIME type first
  if (mimeType.includes('pdf')) return 'mdi-file-pdf-box'
  if (mimeType.includes('image')) return 'mdi-file-image'
  if (mimeType.includes('video')) return 'mdi-file-video'
  if (mimeType.includes('audio')) return 'mdi-file-music'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'mdi-folder-zip'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'mdi-file-word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'mdi-file-excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'mdi-file-powerpoint'
  if (mimeType.includes('text')) return 'mdi-file-document-outline'
  if (mimeType.includes('json')) return 'mdi-code-json'
  if (mimeType.includes('xml')) return 'mdi-file-xml-box'
  if (mimeType.includes('csv')) return 'mdi-file-delimited'
  
  // Check by file extension
  if (filename.endsWith('.pdf')) return 'mdi-file-pdf-box'
  if (filename.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'mdi-file-image'
  if (filename.match(/\.(mp4|avi|mov|wmv)$/)) return 'mdi-file-video'
  if (filename.match(/\.(mp3|wav|ogg|m4a)$/)) return 'mdi-file-music'
  if (filename.match(/\.(zip|rar|7z|tar|gz)$/)) return 'mdi-folder-zip'
  if (filename.match(/\.(doc|docx)$/)) return 'mdi-file-word'
  if (filename.match(/\.(xls|xlsx)$/)) return 'mdi-file-excel'
  if (filename.match(/\.(ppt|pptx)$/)) return 'mdi-file-powerpoint'
  if (filename.match(/\.(txt|md)$/)) return 'mdi-file-document-outline'
  if (filename.endsWith('.json')) return 'mdi-code-json'
  if (filename.endsWith('.xml')) return 'mdi-file-xml-box'
  if (filename.endsWith('.csv')) return 'mdi-file-delimited'
  
  return 'mdi-file'
}

const getFileColor = (mimeType: string): string => {
  const type = mimeType?.toLowerCase() || ''
  if (type.includes('pdf')) return 'red'
  if (type.includes('image')) return 'green'
  if (type.includes('video')) return 'purple'
  if (type.includes('audio')) return 'orange'
  if (type.includes('zip') || type.includes('compressed')) return 'brown'
  if (type.includes('word')) return 'blue'
  if (type.includes('excel')) return 'green-darken-2'
  if (type.includes('powerpoint')) return 'deep-orange'
  if (type.includes('text')) return 'grey-darken-1'
  return 'grey'
}

const isPreviewable = (mimeType: string): boolean => {
  const type = mimeType?.toLowerCase() || ''
  return type.includes('text') || 
         type.includes('json') || 
         type.includes('xml') || 
         type.includes('csv') ||
         type.includes('image')
}

const downloadBlob = (blob: any, index: number) => {
  try {
    // Convert blob data to proper format
    let blobData: Blob
    
    if (blob.data instanceof Blob) {
      blobData = blob.data
    } else if (blob.data instanceof ArrayBuffer) {
      blobData = new Blob([blob.data], { type: blob.mimeType || 'application/octet-stream' })
    } else if (typeof blob.data === 'string') {
      // Handle base64 or text data
      if (blob.encoding === 'base64') {
        const byteCharacters = atob(blob.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        blobData = new Blob([byteArray], { type: blob.mimeType || 'application/octet-stream' })
      } else {
        blobData = new Blob([blob.data], { type: blob.mimeType || 'text/plain' })
      }
    } else {
      // Fallback - try to convert to string
      blobData = new Blob([JSON.stringify(blob.data)], { type: 'application/json' })
    }
    
    // Create download link
    const url = URL.createObjectURL(blobData)
    const link = document.createElement('a')
    link.href = url
    link.download = blob.filename || `attachment-${index + 1}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to download blob:', err)
  }
}

const previewBlob = (blob: any) => {
  // This could open a dialog or new tab with the blob content
  // For now, just log it
  console.log('Preview blob:', blob)
  // You could emit an event here for parent component to handle
  // emit('preview-blob', blob)
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

.v-window {
  min-height: 400px;
}

.document-content {
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.87);
}

.document-content :deep(p) {
  margin-bottom: 1em;
}

.document-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #e91e63;
}

.document-content :deep(strong) {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.95);
}

.document-content :deep(em) {
  font-style: italic;
}

.json-content {
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  max-height: 600px;
  overflow-y: auto;
}

.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item:last-child {
  border-bottom: none;
}

.gap-2 {
  gap: 8px;
}

.v-expansion-panel-title {
  padding: 12px 16px !important;
}

.v-expansion-panel-title:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.v-expansion-panel-text {
  background-color: #fafafa;
}
</style>