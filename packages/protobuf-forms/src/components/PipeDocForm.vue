<template>
  <div class="pipe-doc-form">
    <v-card>
      <v-card-title>
        <v-icon left>mdi-file-document</v-icon>
        {{ title || 'Edit Document' }}
      </v-card-title>
      
      <v-card-text>
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
        />
        
        <v-alert
          v-else-if="error"
          type="error"
          variant="tonal"
        >
          {{ error }}
        </v-alert>
        
        <div v-else-if="schema">
          <!-- Custom PipeDoc form layout -->
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.docId"
                label="Document ID"
                :readonly="readonly"
                variant="outlined"
                density="compact"
                @input="handleChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.originalMimeType"
                label="MIME Type"
                variant="outlined"
                density="compact"
                @input="handleChange"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.title"
                label="Title"
                variant="outlined"
                density="compact"
                @input="handleChange"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="formData.body"
                label="Document Body"
                variant="outlined"
                :rows="bodyRows"
                auto-grow
                @input="handleChange"
              />
            </v-col>
          </v-row>
          
          <v-row v-if="showMetadata">
            <v-col cols="12">
              <v-expansion-panels>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon left>mdi-tag-multiple</v-icon>
                    Metadata ({{ metadataCount }} items)
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div v-for="(value, key) in formData.metadata" :key="key" class="metadata-item">
                      <v-row>
                        <v-col cols="4">
                          <v-text-field
                            :model-value="key"
                            label="Key"
                            variant="outlined"
                            density="compact"
                            @update:model-value="updateMetadataKey(key, $event)"
                          />
                        </v-col>
                        <v-col cols="7">
                          <v-text-field
                            v-model="formData.metadata[key]"
                            label="Value"
                            variant="outlined"
                            density="compact"
                            @input="handleChange"
                          />
                        </v-col>
                        <v-col cols="1">
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            color="error"
                            variant="text"
                            @click="removeMetadata(key)"
                          />
                        </v-col>
                      </v-row>
                    </div>
                    
                    <v-btn
                      prepend-icon="mdi-plus"
                      variant="outlined"
                      size="small"
                      @click="addMetadata"
                    >
                      Add Metadata
                    </v-btn>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
          
          <v-row v-if="showTimestamp">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.lastProcessed"
                label="Last Processed"
                type="datetime-local"
                variant="outlined"
                density="compact"
                @input="handleChange"
              />
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      
      <v-card-actions v-if="!readonly">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleReset"
        >
          Reset
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleSubmit"
          :disabled="!isValid"
        >
          {{ submitLabel || 'Save Document' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ProtobufSchemaLoader } from '../ProtobufSchemaLoader'
import type { JsonSchema } from '../ProtobufToJsonSchemaConverter'

interface Props {
  // The PipeDoc data to edit
  modelValue: any
  // Form title
  title?: string
  // Whether the form is readonly
  readonly?: boolean
  // Number of rows for body textarea
  bodyRows?: number
  // Whether to show metadata section
  showMetadata?: boolean
  // Whether to show timestamp field
  showTimestamp?: boolean
  // Submit button label
  submitLabel?: string
  // Validation rules
  validationRules?: {
    docId?: boolean
    title?: boolean
    body?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  bodyRows: 8,
  showMetadata: true,
  showTimestamp: true,
  validationRules: () => ({
    docId: true,
    title: true,
    body: false
  })
})

const emit = defineEmits(['update:modelValue', 'submit', 'reset', 'error'])

const loading = ref(false)
const error = ref<string | null>(null)
const schema = ref<JsonSchema | null>(null)
const formData = ref<any>({
  docId: '',
  title: '',
  body: '',
  originalMimeType: 'text/plain',
  lastProcessed: new Date().toISOString(),
  metadata: {}
})

// Initialize form data from modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    formData.value = {
      docId: newValue.docId || '',
      title: newValue.title || '',
      body: newValue.body || '',
      originalMimeType: newValue.originalMimeType || 'text/plain',
      lastProcessed: newValue.lastProcessed || new Date().toISOString(),
      metadata: newValue.metadata || {}
    }
  }
}, { immediate: true })

const metadataCount = computed(() => {
  return Object.keys(formData.value.metadata || {}).length
})

const isValid = computed(() => {
  const rules = props.validationRules
  if (rules.docId && !formData.value.docId?.trim()) return false
  if (rules.title && !formData.value.title?.trim()) return false
  if (rules.body && !formData.value.body?.trim()) return false
  return true
})

const loadSchema = async () => {
  loading.value = true
  error.value = null
  
  try {
    const loader = new ProtobufSchemaLoader()
    schema.value = await loader.getJsonSchema('PipeDoc')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load PipeDoc schema'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

const handleChange = () => {
  emit('update:modelValue', { ...formData.value })
}

const handleSubmit = () => {
  if (isValid.value) {
    emit('submit', { ...formData.value })
  }
}

const handleReset = () => {
  formData.value = {
    docId: '',
    title: '',
    body: '',
    originalMimeType: 'text/plain',
    lastProcessed: new Date().toISOString(),
    metadata: {}
  }
  emit('reset')
  handleChange()
}

const addMetadata = () => {
  const key = `key_${Date.now()}`
  formData.value.metadata[key] = ''
  handleChange()
}

const removeMetadata = (key: string) => {
  delete formData.value.metadata[key]
  handleChange()
}

const updateMetadataKey = (oldKey: string, newKey: string) => {
  if (oldKey !== newKey && newKey.trim()) {
    const value = formData.value.metadata[oldKey]
    delete formData.value.metadata[oldKey]
    formData.value.metadata[newKey] = value
    handleChange()
  }
}

onMounted(() => {
  loadSchema()
})
</script>

<style scoped>
.pipe-doc-form {
  width: 100%;
}

.metadata-item {
  margin-bottom: 8px;
}

.metadata-item:last-child {
  margin-bottom: 16px;
}
</style>
