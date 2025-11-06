<template>
  <div class="component-gallery">
    <v-card>
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-palette</v-icon>
        Component Gallery
      </v-card-title>
      <v-card-subtitle>
        Interactive preview of all @pipeline/shared-components
      </v-card-subtitle>
    </v-card>

    <v-row class="mt-4">
      <!-- Component selector sidebar -->
      <v-col cols="12" md="3">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">Components</v-card-title>
          <v-list density="compact" nav>
            <v-list-item
              v-for="(config, name) in galleryComponents"
              :key="name"
              :active="selectedComponent === name"
              @click="selectedComponent = name"
              :prepend-icon="config.icon"
            >
              <v-list-item-title>{{ name }}</v-list-item-title>
              <v-list-item-subtitle>{{ config.description }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Component preview area -->
      <v-col cols="12" md="9">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">{{ currentConfig?.icon }}</v-icon>
            {{ selectedComponent }}
            <v-spacer />
            <v-btn-group density="compact">
              <v-btn
                :variant="viewMode === 'preview' ? 'elevated' : 'outlined'"
                size="small"
                @click="viewMode = 'preview'"
              >
                Preview
              </v-btn>
              <v-btn
                :variant="viewMode === 'props' ? 'elevated' : 'outlined'"
                size="small"
                @click="viewMode = 'props'"
              >
                Props
              </v-btn>
              <v-btn
                :variant="viewMode === 'events' ? 'elevated' : 'outlined'"
                size="small"
                @click="viewMode = 'events'"
              >
                Events
              </v-btn>
            </v-btn-group>
          </v-card-title>
          
          <v-card-text>
            <!-- Preview Mode -->
            <div v-if="viewMode === 'preview'" class="component-preview">
              <component 
                :is="currentConfig?.component" 
                v-bind="currentConfig?.sampleProps || {}"
                @click="logEvent('click', $event)"
                @update="logEvent('update', $event)"
                @change="logEvent('change', $event)"
                @submit="logEvent('submit', $event)"
              />
            </div>

            <!-- Props Mode -->
            <div v-else-if="viewMode === 'props'" class="props-view">
              <v-card variant="tonal">
                <v-card-title class="text-subtitle-1">Sample Props</v-card-title>
                <v-card-text>
                  <pre>{{ JSON.stringify(currentConfig?.sampleProps || {}, null, 2) }}</pre>
                </v-card-text>
              </v-card>
              
              <v-card variant="tonal" class="mt-3" v-if="currentConfig?.propDefinitions">
                <v-card-title class="text-subtitle-1">Prop Definitions</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="prop in currentConfig.propDefinitions" :key="prop.name">
                        <td><code>{{ prop.name }}</code></td>
                        <td><code>{{ prop.type }}</code></td>
                        <td>
                          <v-icon :color="prop.required ? 'success' : 'grey'">
                            {{ prop.required ? 'mdi-check' : 'mdi-minus' }}
                          </v-icon>
                        </td>
                        <td>{{ prop.description }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </div>

            <!-- Events Mode -->
            <div v-else-if="viewMode === 'events'" class="events-view">
              <v-card variant="tonal">
                <v-card-title class="text-subtitle-1">
                  Event Log
                  <v-spacer />
                  <v-btn 
                    size="small" 
                    variant="text" 
                    @click="eventLog = []"
                    :disabled="eventLog.length === 0"
                  >
                    Clear
                  </v-btn>
                </v-card-title>
                <v-card-text>
                  <div v-if="eventLog.length === 0" class="text-center py-4 text-grey">
                    No events captured yet. Interact with the component in Preview mode.
                  </div>
                  <v-timeline v-else density="compact" side="end">
                    <v-timeline-item
                      v-for="(event, idx) in eventLog"
                      :key="idx"
                      :dot-color="getEventColor(event.type)"
                      size="small"
                    >
                      <template v-slot:opposite>
                        <span class="text-caption">{{ formatTime(event.timestamp) }}</span>
                      </template>
                      <div>
                        <strong>{{ event.type }}</strong>
                        <pre class="text-caption">{{ JSON.stringify(event.data, null, 2) }}</pre>
                      </div>
                    </v-timeline-item>
                  </v-timeline>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Info section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card variant="tonal">
          <v-card-text>
            <v-icon class="mr-2">mdi-information</v-icon>
            <strong>Component Gallery Usage:</strong> This gallery showcases all available shared components in the @pipeline/shared-components library. 
            Select a component from the left sidebar to preview it with sample data. 
            Switch between Preview, Props, and Events modes to explore different aspects of each component.
            These components can be used across all Pipeline platform frontends.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { create } from '@bufbuild/protobuf'
import { PipeDocSchema, SearchMetadataSchema } from '@io-pipeline/grpc-stubs/core'
import { ApplyMappingResponseSchema } from '@io-pipeline/grpc-stubs/mapping'

// Import all components dynamically
import * as SharedComponents from '../index'

// Props to customize the gallery
interface Props {
  includeGallery?: boolean  // Whether to include ComponentGallery itself
  customComponents?: Record<string, any>  // Additional components to display
}

const props = withDefaults(defineProps<Props>(), {
  includeGallery: false,
  customComponents: () => ({})
})

// Helper functions (moved before usage)
const getIconForCategory = (category: string): string => {
  const icons: Record<string, string> = {
    display: 'mdi-monitor',
    forms: 'mdi-form-select',
    monitoring: 'mdi-chart-line',
    cards: 'mdi-card-outline',
    dev: 'mdi-code-tags'
  }
  return icons[category] || 'mdi-puzzle'
}

// Sample data for each component type - using REAL protobuf objects
const getSamplePropsForComponent = (componentName: string): any => {
  const sampleData: Record<string, any> = {
    PipeDocPreview: {
      // Create a real PipeDoc protobuf object
      document: create(PipeDocSchema, {
        docId: 'gallery-sample-001',
        searchMetadata: create(SearchMetadataSchema, {
          title: 'Sample Document',
          body: 'This is sample content with **markdown** support.\n\nIt includes multiple paragraphs and rich formatting.',
          sourceMimeType: 'text/markdown',
          author: 'Gallery Demo',
          language: 'en',
          contentLength: 256
        })
      })
    },
    ResponseViewer: {
      // Create a real ApplyMappingResponse protobuf object
      response: create(ApplyMappingResponseSchema, {
        document: create(PipeDocSchema, {
          docId: 'response-001',
          searchMetadata: create(SearchMetadataSchema, {
            title: 'Processed Document',
            body: 'Document successfully processed',
            sourceMimeType: 'text/html'
          })
        })
      })
    },
    RequestBuilderCard: {},
    MappingConfigCard: {
      // Create real MappingRule protobuf objects
      rules: [
        // MappingRule would have proper structure based on proto definition
        // For now, pass plain object for compatibility
        {
          candidateMappings: [
            {
              sourceField: 'title',
              targetField: 'header',
              transformationType: 'DIRECT'
            }
          ]
        }
      ]
    },
    ServiceStatusCard: {
      serviceName: 'Mapping Service',
      endpoint: 'http://localhost:37200',
      status: 'healthy',
      autoRefresh: false,
      refreshInterval: 30000
    },
    ServiceRegistration: {
      endpoint: 'http://localhost:8080',
      useStream: true
    },
    PipeDocEditorCard: {
      // Create a real PipeDoc for editing
      document: create(PipeDocSchema, {
        docId: 'editor-sample-001',
        searchMetadata: create(SearchMetadataSchema, {
          title: 'Editable Document',
          body: 'This document can be edited in the PipeDocEditorCard component.',
          sourceMimeType: 'text/plain',
          author: 'Sample Author',
          language: 'en'
        })
      }),
      allowCreate: true
    }
  }
  
  return sampleData[componentName] || {}
}

// Build gallery configuration from metadata
const galleryComponents = ref<Record<string, any>>({})

// Initialize components from metadata
Object.entries(SharedComponents.componentMetadata).forEach(([name, meta]) => {
  // Skip ComponentGallery unless explicitly included
  if (name === 'ComponentGallery' && !props.includeGallery) {
    return
  }
  
  // Get the actual component
  const componentName = meta.name
  const component = (SharedComponents as any)[componentName]
  
  if (component) {
    galleryComponents.value[meta.name] = {
      component: markRaw(component),
      icon: getIconForCategory(meta.category),
      description: meta.description,
      sampleProps: getSamplePropsForComponent(name),
      propDefinitions: Object.entries(meta.props || {}).map(([propName, propDef]: [string, any]) => ({
        name: propName,
        type: propDef.type,
        required: propDef.required,
        description: propDef.description
      }))
    }
  }
})

// Add custom components if provided
Object.entries(props.customComponents).forEach(([name, config]) => {
  galleryComponents.value[name] = config
})

// Component state
const selectedComponent = ref(Object.keys(galleryComponents.value)[0] || '')
const viewMode = ref<'preview' | 'props' | 'events'>('preview')
const eventLog = ref<Array<{ type: string; data: any; timestamp: Date }>>([])

// Computed
const currentConfig = computed(() => galleryComponents.value[selectedComponent.value])

// Methods
const logEvent = (type: string, data: any) => {
  eventLog.value.unshift({
    type,
    data,
    timestamp: new Date()
  })
  // Keep only last 20 events
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

const getEventColor = (type: string): string => {
  const colors: Record<string, string> = {
    click: 'primary',
    update: 'success',
    change: 'warning',
    submit: 'info',
    error: 'error'
  }
  return colors[type] || 'grey'
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  })
}
</script>

<style scoped>
.component-preview {
  min-height: 400px;
  padding: 16px;
  background: linear-gradient(45deg, #f5f5f5 25%, transparent 25%, transparent 75%, #f5f5f5 75%, #f5f5f5),
              linear-gradient(45deg, #f5f5f5 25%, transparent 25%, transparent 75%, #f5f5f5 75%, #f5f5f5);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  border-radius: 4px;
}

.props-view pre,
.events-view pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  background: #e3f2fd;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.875em;
}

.v-timeline {
  max-height: 400px;
  overflow-y: auto;
}
</style>