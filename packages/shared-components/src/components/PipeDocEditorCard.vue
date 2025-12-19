<template>
  <v-card elevation="3" rounded="lg">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" :color="isModified ? 'warning' : 'primary'">
        {{ isModified ? 'mdi-file-document-edit' : 'mdi-file-document' }}
      </v-icon>
      PipeDoc Editor
      <v-spacer />
      <v-chip v-if="isModified" color="warning" variant="tonal" size="small">
        <v-icon start>mdi-circle-medium</v-icon>
        Modified
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-form ref="formRef" v-model="isValid">
        <!-- Document ID -->
        <v-text-field
          v-model="localDoc.docId"
          label="Document ID"
          placeholder="Enter unique document identifier"
          variant="outlined"
          density="compact"
          :rules="[rules.required]"
          prepend-inner-icon="mdi-identifier"
          class="mb-3"
        />

        <!-- SearchMetadata Section -->
        <v-expansion-panels v-model="expandedPanels" multiple class="mb-4">
          <v-expansion-panel value="metadata">
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-magnify</v-icon>
              Search Metadata
              <template v-slot:actions="{ expanded }">
                <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
              </template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="localDoc.searchMetadata.title"
                    label="Title"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-format-title"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="localDoc.searchMetadata.body"
                    label="Body Content"
                    variant="outlined"
                    rows="4"
                    auto-grow
                    prepend-inner-icon="mdi-text"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localDoc.searchMetadata.author"
                    label="Author"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-account"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="localDoc.searchMetadata.language"
                    label="Language"
                    :items="languageOptions"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-translate"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="localDoc.searchMetadata.sourceMimeType"
                    label="Source MIME Type"
                    :items="mimeTypes"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-file-code"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="localDoc.searchMetadata.contentLength"
                    label="Content Length"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-ruler"
                    readonly
                    :value="computedContentLength"
                  />
                </v-col>
                <v-col cols="12">
                  <v-combobox
                    v-model="keywords"
                    label="Keywords"
                    multiple
                    chips
                    closable-chips
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-tag-multiple"
                    hint="Press Enter to add keywords"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Custom Metadata Section -->
          <v-expansion-panel value="custom">
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-database</v-icon>
              Custom Metadata
              <v-chip size="x-small" class="ml-2">{{ customMetadataCount }}</v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12">
                  <div class="d-flex justify-space-between align-center mb-3">
                    <div class="text-subtitle-2">Key-Value Pairs</div>
                    <v-btn
                      color="primary"
                      size="small"
                      variant="tonal"
                      @click="addMetadataField"
                    >
                      <v-icon start>mdi-plus</v-icon>
                      Add Field
                    </v-btn>
                  </div>
                  
                  <v-list v-if="metadataFields.length > 0" density="compact">
                    <v-list-item
                      v-for="(field, index) in metadataFields"
                      :key="index"
                      class="px-0"
                    >
                      <v-row no-gutters align="center">
                        <v-col cols="5">
                          <v-text-field
                            v-model="field.key"
                            label="Key"
                            variant="outlined"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6" class="px-2">
                          <v-text-field
                            v-model="field.value"
                            label="Value"
                            variant="outlined"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="1" class="text-center">
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click="removeMetadataField(index)"
                          />
                        </v-col>
                      </v-row>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" variant="tonal" density="compact">
                    No custom metadata fields. Click "Add Field" to create one.
                  </v-alert>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Advanced Settings -->
          <v-expansion-panel value="advanced">
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-cog-outline</v-icon>
              Advanced Settings
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12">
                  <v-switch
                    v-model="includeStructuredData"
                    label="Include Structured Data (google.protobuf.Any)"
                    color="primary"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" v-if="includeStructuredData">
                  <v-alert type="warning" variant="tonal" density="compact">
                    Structured data editing requires specialized protobuf editor.
                    This feature is for display only in the gallery.
                  </v-alert>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Action Buttons -->
        <v-row class="mt-4">
          <v-col cols="12" class="d-flex justify-end gap-2">
            <v-btn
              variant="outlined"
              @click="resetDocument"
              :disabled="!isModified"
            >
              <v-icon start>mdi-undo</v-icon>
              Reset
            </v-btn>
            <v-btn
              variant="outlined"
              @click="validateDocument"
            >
              <v-icon start>mdi-check-circle-outline</v-icon>
              Validate
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="saveDocument"
              :disabled="!isValid || !isModified"
            >
              <v-icon start>mdi-content-save</v-icon>
              Save Changes
            </v-btn>
          </v-col>
        </v-row>
      </v-form>

      <!-- Validation Results -->
      <v-alert
        v-if="validationMessage"
        :type="validationStatus"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="validationMessage = ''"
      >
        {{ validationMessage }}
      </v-alert>

      <!-- JSON Preview -->
      <v-dialog v-model="showJsonPreview" max-width="800">
        <v-card>
          <v-card-title>
            PipeDoc JSON Preview
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" @click="showJsonPreview = false" />
          </v-card-title>
          <v-card-text>
            <v-textarea
              :model-value="jsonPreview"
              variant="outlined"
              readonly
              rows="20"
              class="json-preview"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showJsonPreview = false">Close</v-btn>
            <v-btn color="primary" variant="text" @click="copyJson">
              <v-icon start>mdi-content-copy</v-icon>
              Copy JSON
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-text>

    <!-- Floating Action Button for JSON Preview -->
    <v-btn
      color="secondary"
      icon="mdi-code-json"
      size="small"
      variant="elevated"
      class="json-fab"
      @click="showJsonPreview = true"
    >
      <v-tooltip activator="parent" location="left">View JSON</v-tooltip>
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { create, toJson } from '@bufbuild/protobuf'
import {
  PipeDocSchema,
  SearchMetadataSchema,
  type PipeDoc
} from '@ai-pipestream/protobuf-forms/generated'

interface Props {
  document?: PipeDoc | null
  allowCreate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  document: null,
  allowCreate: true
})

const emit = defineEmits<{
  save: [document: PipeDoc]
  update: [document: PipeDoc]
  validate: [isValid: boolean]
}>()

// Form state
const formRef = ref()
const isValid = ref(true)
const isModified = ref(false)
const expandedPanels = ref(['metadata'])
const showJsonPreview = ref(false)
const includeStructuredData = ref(false)

// Validation state
const validationMessage = ref('')
const validationStatus = ref<'success' | 'error' | 'warning' | 'info'>('info')

// Document data - using a plain object for editing, will convert to protobuf on save
const localDoc = ref({
  docId: '',
  searchMetadata: {
    title: '',
    body: '',
    sourceMimeType: 'text/plain',
    author: '',
    language: 'en',
    contentLength: 0
  }
})

// Keywords as array for v-combobox
const keywords = ref<string[]>([])

// Custom metadata fields
const metadataFields = ref<Array<{ key: string; value: string }>>([])

// Options
const languageOptions = [
  { title: 'English', value: 'en' },
  { title: 'Spanish', value: 'es' },
  { title: 'French', value: 'fr' },
  { title: 'German', value: 'de' },
  { title: 'Italian', value: 'it' },
  { title: 'Portuguese', value: 'pt' },
  { title: 'Russian', value: 'ru' },
  { title: 'Chinese', value: 'zh' },
  { title: 'Japanese', value: 'ja' },
  { title: 'Korean', value: 'ko' }
]

const mimeTypes = [
  'text/plain',
  'text/html',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'audio/mpeg'
]

// Validation rules
const rules = {
  required: (v: any) => !!v || 'Required field'
}

// Computed
const computedContentLength = computed(() => {
  return localDoc.value.searchMetadata.body?.length || 0
})

const customMetadataCount = computed(() => {
  return metadataFields.value.filter(f => f.key && f.value).length
})

const jsonPreview = computed(() => {
  try {
    const doc = createProtobufDocument()
    return JSON.stringify(toJson(PipeDocSchema, doc), null, 2)
  } catch (err) {
    return JSON.stringify(localDoc.value, null, 2)
  }
})

// Methods
const createProtobufDocument = (): PipeDoc => {
  // Build metadata object from fields
  const metadata: Record<string, string> = {}
  metadataFields.value.forEach(field => {
    if (field.key && field.value) {
      metadata[field.key] = field.value
    }
  })

  // Create the protobuf document
  return create(PipeDocSchema, {
    docId: localDoc.value.docId,
    searchMetadata: create(SearchMetadataSchema, {
      title: localDoc.value.searchMetadata.title || undefined,
      body: localDoc.value.searchMetadata.body || undefined,
      sourceMimeType: localDoc.value.searchMetadata.sourceMimeType || undefined,
      author: localDoc.value.searchMetadata.author || undefined,
      language: localDoc.value.searchMetadata.language || undefined,
      contentLength: computedContentLength.value
      // Note: keywords would need Keywords message type
    })
    // Note: PipeDoc doesn't have a direct metadata field - it uses structured_data
  }) as PipeDoc
}

const loadDocument = (doc: PipeDoc | null) => {
  if (!doc) {
    resetDocument()
    return
  }

  // Load from protobuf to local editing format
  localDoc.value.docId = doc.docId || ''
  
  if (doc.searchMetadata) {
    localDoc.value.searchMetadata = {
      title: doc.searchMetadata.title || '',
      body: doc.searchMetadata.body || '',
      sourceMimeType: doc.searchMetadata.sourceMimeType || 'text/plain',
      author: doc.searchMetadata.author || '',
      language: doc.searchMetadata.language || 'en',
      contentLength: doc.searchMetadata.contentLength || 0
    }
  }

  // Note: PipeDoc doesn't have direct metadata field
  // Custom metadata would be in structured_data as Any type
  // For now, just clear the metadata fields
  metadataFields.value = []

  isModified.value = false
}

const resetDocument = () => {
  localDoc.value = {
    docId: '',
    searchMetadata: {
      title: '',
      body: '',
      sourceMimeType: 'text/plain',
      author: '',
      language: 'en',
      contentLength: 0
    }
  }
  keywords.value = []
  metadataFields.value = []
  isModified.value = false
  validationMessage.value = ''
}

const validateDocument = async () => {
  const valid = await formRef.value?.validate()
  
  if (valid?.valid) {
    validationStatus.value = 'success'
    validationMessage.value = 'Document is valid and ready to save'
    emit('validate', true)
  } else {
    validationStatus.value = 'error'
    validationMessage.value = 'Please fix the validation errors'
    emit('validate', false)
  }
  
  return valid?.valid || false
}

const saveDocument = async () => {
  const valid = await validateDocument()
  if (!valid) return

  try {
    const doc = createProtobufDocument()
    emit('update', doc)
    emit('save', doc)
    isModified.value = false
    
    validationStatus.value = 'success'
    validationMessage.value = 'Document saved successfully'
  } catch (err) {
    validationStatus.value = 'error'
    validationMessage.value = `Error creating document: ${err}`
  }
}

const addMetadataField = () => {
  metadataFields.value.push({ key: '', value: '' })
}

const removeMetadataField = (index: number) => {
  metadataFields.value.splice(index, 1)
}

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(jsonPreview.value)
    validationStatus.value = 'info'
    validationMessage.value = 'JSON copied to clipboard'
  } catch (err) {
    validationStatus.value = 'error'
    validationMessage.value = 'Failed to copy JSON'
  }
}

// Watch for changes
watch(() => localDoc.value, () => {
  isModified.value = true
  // Throttle update emits to avoid UI lock
  clearTimeout((emit as any)._t)
  ;(emit as any)._t = setTimeout(() => emit('update', createProtobufDocument()), 100)
}, { deep: true })

watch(() => keywords.value, () => {
  isModified.value = true
})

watch(() => metadataFields.value, () => {
  isModified.value = true
}, { deep: true })

// Initialize with provided document
watch(() => props.document, (newDoc) => {
  loadDocument(newDoc)
}, { immediate: true })
</script>

<style scoped>
.json-preview :deep(textarea) {
  font-family: 'Courier New', monospace !important;
  font-size: 12px !important;
}

.json-fab {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.gap-2 {
  gap: 8px;
}
</style>