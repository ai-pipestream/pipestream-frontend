<template>
  <v-card elevation="2" rounded="lg">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-cog-outline</v-icon>
      Request Builder
      <v-spacer />
      <v-btn-group>
        <v-btn
          variant="outlined"
          @click="clearRequest"
          :disabled="loading"
        >
          <v-icon left>mdi-refresh</v-icon>
          Clear
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="validateRequest"
          :loading="validating"
        >
          <v-icon left>mdi-check-circle</v-icon>
          Validate
        </v-btn>
      </v-btn-group>
    </v-card-title>

    <v-card-text>
      <!-- Simplified form for now - ProtobufForm integration coming later -->
      <v-alert type="info" variant="tonal" class="mb-4">
        <strong>Note:</strong> Full form functionality will be available once protobuf-forms is integrated.
      </v-alert>
      
      <!-- Basic manual form -->
      <v-form>
        <v-text-field
          v-model="mappingRequest.document.docId"
          label="Document ID"
          variant="outlined"
          density="compact"
        />
        <v-text-field
          v-model="mappingRequest.document.title"
          label="Document Title"
          variant="outlined"
          density="compact"
        />
        <v-textarea
          v-model="mappingRequest.document.body"
          label="Document Body"
          variant="outlined"
          rows="3"
        />
      </v-form>

      <!-- Validation Results -->
      <v-row v-if="validationResult" class="mt-4">
        <v-col cols="12">
          <v-alert
            :type="validationResult?.isValid ? 'success' : 'error'"
            variant="tonal"
          >
            <v-alert-title>
              {{ validationResult?.isValid ? 'Request Valid' : 'Validation Failed' }}
            </v-alert-title>
            <div v-if="validationResult?.isValid">
              Your request is properly formatted and ready to be executed.
            </div>
            <div v-else>
              <ul>
                <li v-for="error in validationResult?.errors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Request Preview -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-code-json</v-icon>
                Request Preview
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-textarea
                  :model-value="JSON.stringify(mappingRequest, null, 2)"
                  variant="outlined"
                  readonly
                  rows="15"
                  auto-grow
                  class="request-preview"
                />
                <div class="d-flex justify-end mt-2">
                  <v-btn
                    variant="outlined"
                    size="small"
                    @click="copyRequest"
                  >
                    <v-icon left>mdi-content-copy</v-icon>
                    Copy JSON
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">
              <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
              Quick Actions
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    variant="outlined"
                    @click="addMappingRule"
                  >
                    <v-icon left>mdi-plus</v-icon>
                    Add Rule
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    variant="outlined"
                    @click="addCandidateMapping"
                  >
                    <v-icon left>mdi-map-marker-plus</v-icon>
                    Add Mapping
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    variant="outlined"
                    @click="loadTemplate"
                  >
                    <v-icon left>mdi-file-document-plus</v-icon>
                    Load Template
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    variant="outlined"
                    @click="exportRequest"
                  >
                    <v-icon left>mdi-download</v-icon>
                    Export
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Templates -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-folder-multiple</v-icon>
                Request Templates
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col
                    v-for="(template, index) in requestTemplates"
                    :key="index"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <v-card variant="outlined" class="template-card">
                      <v-card-title class="text-subtitle-1">
                        <v-icon class="mr-2">{{ template.icon }}</v-icon>
                        {{ template.name }}
                      </v-card-title>
                      <v-card-text>
                        <div class="text-body-2 mb-3">{{ template.description }}</div>
                        <div class="text-caption text-grey">
                          {{ template.rules.length }} rules, 
                          {{ template.rules.reduce((acc, rule) => acc + rule.candidateMappings.length, 0) }} mappings
                        </div>
                      </v-card-text>
                      <v-card-actions>
                        <v-btn
                          variant="text"
                          size="small"
                          @click="loadRequestTemplate(template)"
                        >
                          Load Template
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { create } from '@bufbuild/protobuf'
import {
  ApplyMappingRequestSchema,
  MappingRuleSchema
} from '@ai-pipestream/grpc-stubs/dist/mapping-service/mapping_service_pb'
import {
  PipeDocSchema,
  SearchMetadataSchema
} from '@ai-pipestream/grpc-stubs/dist/core/pipeline_core_types_pb'
// TODO: Re-enable when protobuf-forms is integrated
// import { ProtobufForm } from '@pipeline/protobuf-forms/vue'

const loading = ref(false)
const validating = ref(false)
const validationResult = ref<{ isValid: boolean; errors: string[] } | null>(null)

const emit = defineEmits(['request-created', 'submit', 'update'])

const mappingRequest = ref({
  document: {
    docId: '',
    title: '',
    body: '',
    originalMimeType: 'text/plain'
  },
  rules: [] as Array<{ candidateMappings: Array<{ sourceField: string; targetField: string; transformationType: string }> }>
})

// Request templates for quick setup
const requestTemplates = ref([
  {
    name: 'Basic Field Mapping',
    description: 'Simple direct field mappings',
    icon: 'mdi-arrow-right',
    document: {
      docId: 'template-basic',
      title: 'Basic Template Document',
      body: 'This is a template document for basic field mapping.',
      originalMimeType: 'text/plain'
    },
    rules: [
      {
        candidateMappings: [
          {
            sourceField: 'title',
            targetField: 'document_title',
            transformationType: 'DIRECT'
          },
          {
            sourceField: 'body',
            targetField: 'content',
            transformationType: 'DIRECT'
          }
        ]
      }
    ]
  },
  {
    name: 'Text Transformation',
    description: 'Various text transformation examples',
    icon: 'mdi-format-text',
    document: {
      docId: 'template-transform',
      title: 'Text Transformation Template',
      body: 'This template demonstrates various text transformations including case changes and formatting.',
      originalMimeType: 'text/html'
    },
    rules: [
      {
        candidateMappings: [
          {
            sourceField: 'title',
            targetField: 'uppercase_title',
            transformationType: 'UPPERCASE'
          },
          {
            sourceField: 'title',
            targetField: 'lowercase_title',
            transformationType: 'LOWERCASE'
          },
          {
            sourceField: 'body',
            targetField: 'clean_content',
            transformationType: 'CLEAN_HTML'
          }
        ]
      }
    ]
  },
  {
    name: 'Multi-Rule Complex',
    description: 'Complex mapping with multiple rules',
    icon: 'mdi-layers',
    document: {
      docId: 'template-complex',
      title: 'Complex Multi-Rule Template',
      body: 'This template shows how to use multiple mapping rules for complex document processing scenarios.',
      originalMimeType: 'application/pdf'
    },
    rules: [
      {
        candidateMappings: [
          {
            sourceField: 'title',
            targetField: 'primary_title',
            transformationType: 'DIRECT'
          }
        ]
      },
      {
        candidateMappings: [
          {
            sourceField: 'body',
            targetField: 'extracted_text',
            transformationType: 'EXTRACT_TEXT'
          },
          {
            sourceField: 'body',
            targetField: 'summary',
            transformationType: 'SUMMARIZE'
          }
        ]
      }
    ]
  }
])

const clearRequest = () => {
  mappingRequest.value = {
    document: {
      docId: '',
      title: '',
      body: '',
      originalMimeType: 'text/plain'
    },
    rules: []
  }
  validationResult.value = null
}

const validateRequest = async () => {
  validating.value = true
  
  try {
    const errors = []
    
    // Validate document
    if (!mappingRequest.value.document?.docId?.trim()) {
      errors.push('Document ID is required')
    }
    if (!mappingRequest.value.document?.title?.trim()) {
      errors.push('Document title is required')
    }
    if (!mappingRequest.value.document?.body?.trim()) {
      errors.push('Document body is required')
    }
    
    // Create proper protobuf with searchMetadata structure
    const requestProto = create(ApplyMappingRequestSchema, {
      document: create(PipeDocSchema, {
        docId: mappingRequest.value.document.docId,
        searchMetadata: create(SearchMetadataSchema, {
          title: mappingRequest.value.document.title,
          body: mappingRequest.value.document.body,
          sourceMimeType: mappingRequest.value.document.originalMimeType
        })
      }),
      rules: mappingRequest.value.rules.map((rule: any) => 
        create(MappingRuleSchema, {
          candidateMappings: rule.candidateMappings || []
        })
      )
    })
    
    // Store the protobuf for potential submission
    emit('request-created', requestProto)
    
    // Validate rules
    if (!Array.isArray(mappingRequest.value.rules) || mappingRequest.value.rules.length === 0) {
      errors.push('At least one mapping rule is required')
    } else {
      mappingRequest.value.rules.forEach((rule, ruleIndex) => {
        if (!Array.isArray(rule.candidateMappings) || rule.candidateMappings.length === 0) {
          errors.push(`Rule ${ruleIndex + 1} must have at least one candidate mapping`)
        } else {
          rule.candidateMappings.forEach((mapping, mappingIndex) => {
            if (!mapping.sourceField?.trim()) {
              errors.push(`Rule ${ruleIndex + 1}, Mapping ${mappingIndex + 1}: Source field is required`)
            }
            if (!mapping.targetField?.trim()) {
              errors.push(`Rule ${ruleIndex + 1}, Mapping ${mappingIndex + 1}: Target field is required`)
            }
            if (!mapping.transformationType?.trim()) {
              errors.push(`Rule ${ruleIndex + 1}, Mapping ${mappingIndex + 1}: Transformation type is required`)
            }
          })
        }
      })
    }
    
    validationResult.value = {
      isValid: errors.length === 0,
      errors
    }
    
  } catch (error) {
    validationResult.value = {
      isValid: false,
      errors: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
    }
  } finally {
    validating.value = false
  }
}

const addMappingRule = () => {
  if (!Array.isArray(mappingRequest.value.rules)) {
    mappingRequest.value.rules = []
  }
  
  mappingRequest.value.rules.push({
    candidateMappings: [
      {
        sourceField: '',
        targetField: '',
        transformationType: 'DIRECT'
      }
    ]
  })
}

const addCandidateMapping = () => {
  if (!Array.isArray(mappingRequest.value.rules) || mappingRequest.value.rules.length === 0) {
    addMappingRule()
    return
  }
  
  const lastRule = mappingRequest.value.rules[mappingRequest.value.rules.length - 1]
  if (!Array.isArray(lastRule.candidateMappings)) {
    lastRule.candidateMappings = []
  }
  
  lastRule.candidateMappings.push({
    sourceField: '',
    targetField: '',
    transformationType: 'DIRECT'
  })
}

const loadTemplate = () => {
  if (requestTemplates.value.length > 0) {
    loadRequestTemplate(requestTemplates.value[0])
  }
}

const loadRequestTemplate = (template: any) => {
  mappingRequest.value = {
    document: { ...template.document },
    rules: JSON.parse(JSON.stringify(template.rules))
  }
  validationResult.value = null
}

const copyRequest = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(mappingRequest.value, null, 2))
    // Could add a toast notification here
  } catch (err) {
    console.error('Failed to copy request:', err)
  }
}

const exportRequest = () => {
  const dataStr = JSON.stringify(mappingRequest.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mapping-request-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// These will be used when protobuf-forms is integrated
// const handleFormError = (errorMessage: string) => {
//   console.error('Form error:', errorMessage)
// }

// const handleSchemaLoaded = (schema: any) => {
//   console.log('ApplyMappingRequest schema loaded:', schema)
// }
</script>

<style scoped>
.template-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.request-preview :deep(textarea) {
  font-family: 'Courier New', monospace !important;
  font-size: 12px !important;
}
</style>
