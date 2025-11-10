/**
 * @ai-pipestream/shared-components
 *
 * Shared Vue 3 + Vuetify 3 components for the Pipeline platform.
 * These components are designed to work with @ai-pipestream/grpc-stubs types
 * and can be used across all frontend applications.
 */

// Display Components
export { default as PipeDocPreview } from './components/PipeDocPreview.vue'
export { default as ResponseViewer } from './components/ResponseViewer.vue'

// Form/Input Components
export { default as RequestBuilderCard } from './components/RequestBuilderCard.vue'
export { default as MappingConfigCard } from './components/MappingConfigCard.vue'
export { default as PipeDocEditorCard } from './components/PipeDocEditorCard.vue'

// Status/Monitoring Components
export { default as ServiceStatusCard } from './components/ServiceStatusCard.vue'
export { default as ServiceRegistration } from './components/ServiceRegistration.vue'
export { default as GrpcHealthStatus } from './components/GrpcHealthStatus.vue';

// Development/Testing Components
export { default as ComponentGallery } from './components/ComponentGallery.vue'
export { default as MappingWorkbench } from './components/MappingWorkbench.vue'
export { default as SearchPanel } from './components/SearchPanel.vue'

// Shared Page Components (for consistent experience across services)
export { default as SharedHealthPage } from './components/SharedHealthPage.vue'
export { default as SharedLinksPage } from './components/SharedLinksPage.vue'
export { default as UniversalConfigCard } from './components/UniversalConfigCard.vue'
export { default as ModuleConfigPanel } from './components/ModuleConfigPanel.vue'

// Shared Composables
export { useShellHealth } from './composables/useShellHealth'

// Component Categories
export const componentCategories = {
  display: ['PipeDocPreview', 'ResponseViewer'],
  forms: ['RequestBuilderCard', 'MappingConfigCard', 'PipeDocEditorCard'],
  config: ['UniversalConfigCard', 'ModuleConfigPanel'],
  monitoring: ['ServiceStatusCard', 'ServiceRegistration', 'GrpcHealthStatus'],
  cards: [],
  dev: ['ComponentGallery']
}

// Component Metadata for documentation/discovery
export const componentMetadata = {
  PipeDocPreview: {
    name: 'PipeDocPreview',
    description: 'Display and preview PipeDoc documents with formatting support',
    category: 'display',
    props: {
      document: {
        type: 'PipeDoc | any',
        required: true,
        description: 'The PipeDoc object to display'
      }
    },
    events: [],
    slots: []
  },
  ComponentGallery: {
    name: 'ComponentGallery',
    description: 'Interactive gallery for previewing and testing components',
    category: 'dev',
    props: {},
    events: [],
    slots: []
  },
  MappingWorkbench: {
    name: 'MappingWorkbench',
    description: 'End-to-end mapping UI (repo select, map, preview, save)',
    category: 'forms',
    props: {},
    events: ['run-start', 'run-complete', 'saved', 'error', 'add-data'],
    slots: []
  },
  RequestBuilderCard: {
    name: 'RequestBuilderCard',
    description: 'Build and configure mapping service requests',
    category: 'forms',
    props: {
      initialRequest: {
        type: 'ApplyMappingRequest | any',
        required: false,
        description: 'Initial request configuration'
      }
    },
    events: ['submit', 'update'],
    slots: []
  },
  ResponseViewer: {
    name: 'ResponseViewer',
    description: 'Display mapping service responses with detailed analysis',
    category: 'display',
    props: {
      response: {
        type: 'ApplyMappingResponse | any',
        required: true,
        description: 'The response object to display'
      }
    },
    events: [],
    slots: []
  },
  MappingConfigCard: {
    name: 'MappingConfigCard',
    description: 'Configure mapping rules and transformations',
    category: 'forms',
    props: {
      rules: {
        type: 'MappingRule[] | any[]',
        required: false,
        description: 'Array of mapping rules to configure'
      }
    },
    events: ['update:rules', 'save'],
    slots: []
  },
  ServiceStatusCard: {
    name: 'ServiceStatusCard',
    description: 'Monitor service health, metrics, and status in real-time',
    category: 'monitoring',
    props: {
      serviceName: {
        type: 'string',
        required: true,
        description: 'Name of the service to monitor'
      },
      endpoint: {
        type: 'string',
        required: true,
        description: 'Service endpoint URL'
      },
      status: {
        type: 'string',
        required: false,
        description: 'Current service status (healthy/degraded/offline/unknown)'
      },
      autoRefresh: {
        type: 'boolean',
        required: false,
        description: 'Enable automatic status refresh'
      },
      refreshInterval: {
        type: 'number',
        required: false,
        description: 'Refresh interval in milliseconds'
      }
    },
    events: ['refresh', 'test', 'view-details'],
    slots: []
  },
  ServiceRegistration: {
    name: 'ServiceRegistration',
    description: 'Register services with Consul and database with health checks',
    category: 'monitoring',
    props: {
      endpoint: {
        type: 'string',
        required: false,
        description: 'gRPC endpoint for service registration'
      },
      useStream: {
        type: 'boolean',
        required: false,
        description: 'Enable streaming registration with real-time events'
      }
    },
    events: ['registered', 'error'],
    slots: []
  },
  PipeDocEditorCard: {
    name: 'PipeDocEditorCard',
    description: 'Edit PipeDoc protobuf objects with full validation',
    category: 'forms',
    props: {
      document: {
        type: 'PipeDoc | null',
        required: false,
        description: 'The PipeDoc to edit'
      },
      allowCreate: {
        type: 'boolean',
        required: false,
        description: 'Allow creating new documents'
      }
    },
    events: ['save', 'update', 'validate'],
    slots: []
  },
  GrpcHealthStatus: {
      name: 'GrpcHealthStatus',
      description: 'Displays the live gRPC health status of a service',
      category: 'monitoring',
      props: {
        serviceName: {
          type: 'string',
          required: true,
          description: 'The gRPC service name to check'
        }
      },
      events: ['statusChanged', 'error'],
      slots: []
    }
}

// Version info
export const version = '1.0.0'
