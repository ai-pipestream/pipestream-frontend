<template>
  <v-card elevation="2" rounded="lg">
    <!-- Header -->
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-cloud-upload</v-icon>
      Service Registration
      <v-spacer />
      <v-chip v-if="registeredService" color="success" variant="flat" size="small">
        <v-icon start size="small">mdi-check-circle</v-icon>
        Registered
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Registration Form -->
      <v-form ref="form" v-model="isFormValid">
        <v-row>
          <!-- Basic Information -->
          <v-col cols="12">
            <div class="text-subtitle-1 font-weight-medium mb-2">
              <v-icon size="small" class="mr-1">mdi-information</v-icon>
              Basic Information
            </div>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model="serviceInfo.serviceName"
              label="Service Name"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Service name is required']"
              placeholder="e.g., mapping-service"
              hint="Logical name for your service"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model="serviceInfo.serviceId"
              label="Service ID"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Service ID is required']"
              placeholder="e.g., mapping-service-001"
              hint="Unique instance identifier"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="serviceInfo.description"
              label="Description"
              variant="outlined"
              rows="2"
              placeholder="Describe what your service does..."
            />
          </v-col>

          <!-- Network Configuration -->
          <v-col cols="12">
            <div class="text-subtitle-1 font-weight-medium mb-2 mt-2">
              <v-icon size="small" class="mr-1">mdi-network</v-icon>
              Network Configuration
            </div>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="serviceInfo.host"
              label="Host"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Host is required']"
              placeholder="localhost or IP"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="serviceInfo.port"
              label="Primary Port"
              variant="outlined"
              density="compact"
              type="number"
              :rules="[v => !!v || 'Port is required', v => v > 0 || 'Invalid port']"
              placeholder="8080"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="serviceInfo.grpcPort"
              label="gRPC Port (optional)"
              variant="outlined"
              density="compact"
              type="number"
              placeholder="9090"
            />
          </v-col>

          <!-- Service Type and Version -->
          <v-col cols="12" md="6">
            <v-select
              v-model="serviceInfo.serviceType"
              label="Service Type"
              :items="serviceTypes"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Service type is required']"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="serviceInfo.version"
              label="Version"
              variant="outlined"
              density="compact"
              placeholder="1.0.0"
            />
          </v-col>

          <!-- Capabilities -->
          <v-col cols="12">
            <div class="text-subtitle-1 font-weight-medium mb-2 mt-2">
              <v-icon size="small" class="mr-1">mdi-feature-search</v-icon>
              Capabilities
            </div>
            <v-combobox
              v-model="serviceInfo.capabilities"
              label="Service Capabilities"
              variant="outlined"
              density="compact"
              multiple
              chips
              closable-chips
              placeholder="Press enter to add capabilities"
              hint="What can this service do? (e.g., 'mapping', 'validation', 'storage')"
            />
          </v-col>

          <!-- Tags -->
          <v-col cols="12">
            <v-combobox
              v-model="serviceInfo.tags"
              label="Tags"
              variant="outlined"
              density="compact"
              multiple
              chips
              closable-chips
              placeholder="Add tags for discovery"
            />
          </v-col>

          <!-- Health Checks -->
          <v-col cols="12">
            <div class="text-subtitle-1 font-weight-medium mb-2 mt-2">
              <v-icon size="small" class="mr-1">mdi-heart-pulse</v-icon>
              Health Checks
            </div>
          </v-col>

          <v-col cols="12">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="(check, index) in serviceInfo.healthChecks"
                :key="index"
              >
                <v-expansion-panel-title>
                  Health Check {{ index + 1 }}
                  <template v-slot:actions>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click.stop="removeHealthCheck(index)"
                    >
                      <v-icon size="small">mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="check.type"
                        label="Check Type"
                        :items="healthCheckTypes"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="check.endpoint"
                        label="Endpoint"
                        variant="outlined"
                        density="compact"
                        placeholder="/health"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="check.interval"
                        label="Interval"
                        variant="outlined"
                        density="compact"
                        placeholder="10s"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="check.timeout"
                        label="Timeout"
                        variant="outlined"
                        density="compact"
                        placeholder="5s"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="check.deregisterAfter"
                        label="Deregister After"
                        variant="outlined"
                        density="compact"
                        placeholder="30s"
                      />
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <v-btn
              variant="outlined"
              size="small"
              class="mt-2"
              @click="addHealthCheck"
            >
              <v-icon start>mdi-plus</v-icon>
              Add Health Check
            </v-btn>
          </v-col>

          <!-- Custom Metadata -->
          <v-col cols="12">
            <div class="text-subtitle-1 font-weight-medium mb-2 mt-2">
              <v-icon size="small" class="mr-1">mdi-code-json</v-icon>
              Custom Metadata
            </div>
            <v-btn
              variant="outlined"
              size="small"
              @click="addMetadataField"
            >
              <v-icon start>mdi-plus</v-icon>
              Add Metadata Field
            </v-btn>
            <v-row v-for="(field, index) in metadataFields" :key="index" class="mt-2">
              <v-col cols="5">
                <v-text-field
                  v-model="field.key"
                  label="Key"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="field.value"
                  label="Value"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="1">
                <v-btn
                  icon
                  variant="text"
                  @click="removeMetadataField(index)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-form>

      <!-- Registration Status -->
      <v-alert
        v-if="registrationStatus"
        :type="registrationStatus.success ? 'success' : 'error'"
        variant="tonal"
        class="mt-4"
      >
        <v-alert-title>
          {{ registrationStatus.success ? 'Registration Successful' : 'Registration Failed' }}
        </v-alert-title>
        {{ registrationStatus.message }}
        <div v-if="registrationStatus.warnings?.length" class="mt-2">
          <div class="text-caption">Warnings:</div>
          <ul>
            <li v-for="warning in registrationStatus.warnings" :key="warning">
              {{ warning }}
            </li>
          </ul>
        </div>
      </v-alert>

      <!-- Stream Events -->
      <v-card v-if="streamEvents.length > 0" variant="outlined" class="mt-4">
        <v-card-title class="text-subtitle-1">
          Registration Events
        </v-card-title>
        <v-card-text>
          <v-timeline density="compact" side="end">
            <v-timeline-item
              v-for="(event, idx) in streamEvents"
              :key="idx"
              :dot-color="getEventColor(event.eventType)"
              size="x-small"
            >
              <template v-slot:opposite>
                <span class="text-caption">{{ formatTime(event.timestamp) }}</span>
              </template>
              <div>
                <strong>{{ formatEventType(event.eventType) }}</strong>
                <div class="text-caption">{{ event.message }}</div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </v-card-text>

    <!-- Actions -->
    <v-divider />
    <v-card-actions class="pa-4">
      <v-btn
        variant="outlined"
        @click="resetForm"
      >
        <v-icon start>mdi-refresh</v-icon>
        Reset
      </v-btn>
      <v-btn
        variant="outlined"
        @click="testConnection"
        :loading="testing"
      >
        <v-icon start>mdi-connection</v-icon>
        Test Connection
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        variant="elevated"
        @click="registerService"
        :loading="loading"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-cloud-upload</v-icon>
        Register Service
      </v-btn>
      <v-btn
        v-if="useStream"
        color="secondary"
        variant="elevated"
        @click="registerServiceStream"
        :loading="streaming"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-broadcast</v-icon>
        Stream Registration
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { create } from '@bufbuild/protobuf'
// TimestampSchema not needed; use plain object for MessageInit<Timestamp>
// These will be uncommented when backend is ready
// import { createClient } from '@connectrpc/connect'
// import { PlatformRegistrationService } from '@ai-pipestream/protobuf-forms/generated'
import {
  RegisterRequestSchema
} from '@ai-pipestream/protobuf-forms/generated'

interface Props {
  endpoint?: string
  useStream?: boolean
}

withDefaults(defineProps<Props>(), {
  endpoint: 'http://localhost:8080',
  useStream: false
})

const emit = defineEmits(['registered', 'error'])

// Form state
const form = ref()
const isFormValid = ref(false)
const loading = ref(false)
const streaming = ref(false)
const testing = ref(false)

// Define enum replacements as constants since they're no longer in proto
const ServiceType = {
  APPLICATION: 'APPLICATION',
  MODULE: 'MODULE',
  INFRASTRUCTURE: 'INFRASTRUCTURE'
} as const

const HealthCheckType = {
  HTTP: 'HTTP',
  GRPC: 'GRPC',
  TCP: 'TCP'
} as const

const ServiceRegistrationEventType = {
  SERVICE_REGISTRATION_EVENT_TYPE_UNSPECIFIED: 'SERVICE_REGISTRATION_EVENT_TYPE_UNSPECIFIED',
  REGISTRATION_STARTED: 'REGISTRATION_STARTED',
  METADATA_COLLECTED: 'METADATA_COLLECTED',
  ICON_LOADED: 'ICON_LOADED',
  CONSUL_REGISTERED: 'CONSUL_REGISTERED',
  DATABASE_STORED: 'DATABASE_STORED',
  HEALTH_CHECKS_CONFIGURED: 'HEALTH_CHECKS_CONFIGURED',
  REGISTRATION_COMPLETED: 'REGISTRATION_COMPLETED',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',
  HEARTBEAT_RECEIVED: 'HEARTBEAT_RECEIVED',
  SERVICE_UPDATED: 'SERVICE_UPDATED'
} as const

// Service info matching the proto
const serviceInfo = reactive({
  serviceName: '',
  serviceId: '',
  host: 'localhost',
  port: 8080,
  grpcPort: 0,
  description: '',
  version: '1.0.0',
  serviceType: ServiceType.APPLICATION,
  iconSvgBase64: '',
  capabilities: [] as string[],
  tags: [] as string[],
  healthChecks: [] as any[],
  metadata: {} as Record<string, string>
})

// Metadata fields for UI
const metadataFields = ref<Array<{ key: string; value: string }>>([])

// Registration results
type RegistrationStatusDisplay = {
  success: boolean
  message: string
  registeredAt?: string
  consulServiceId?: string
  databaseId?: string
  warnings?: string[]
}
const registrationStatus = ref<RegistrationStatusDisplay | null>(null)
const registeredService = ref<any>(null)
const streamEvents = ref<any[]>([])

// Options for dropdowns
const serviceTypes = [
  { label: 'Application', value: ServiceType.APPLICATION },
  { label: 'Module', value: ServiceType.MODULE },
  { label: 'Infrastructure', value: ServiceType.INFRASTRUCTURE }
]

const healthCheckTypes = [
  { label: 'HTTP', value: HealthCheckType.HTTP },
  { label: 'gRPC', value: HealthCheckType.GRPC },
  { label: 'TCP', value: HealthCheckType.TCP }
]

// Methods
const addHealthCheck = () => {
  serviceInfo.healthChecks.push({
    type: HealthCheckType.HTTP,
    endpoint: '/health',
    interval: '10s',
    timeout: '5s',
    deregisterAfter: '30s'
  })
}

const removeHealthCheck = (index: number) => {
  serviceInfo.healthChecks.splice(index, 1)
}

const addMetadataField = () => {
  metadataFields.value.push({ key: '', value: '' })
}

const removeMetadataField = (index: number) => {
  metadataFields.value.splice(index, 1)
}

const buildMetadata = () => {
  const metadata: Record<string, string> = {}
  metadataFields.value.forEach(field => {
    if (field.key && field.value) {
      metadata[field.key] = field.value
    }
  })
  return metadata
}

const testConnection = async () => {
  testing.value = true
  
  try {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In real implementation, would test actual connection
    console.log('Testing connection to:', `http://${serviceInfo.host}:${serviceInfo.port}`)
    
    registrationStatus.value = {
      success: true,
      message: `Successfully connected to ${serviceInfo.host}:${serviceInfo.port}`
    }
  } catch (error) {
    registrationStatus.value = {
      success: false,
      message: `Failed to connect: ${error}`
    }
  } finally {
    testing.value = false
  }
}

const registerService = async () => {
  loading.value = true
  registrationStatus.value = null
  
  try {
    // Create proper protobuf message
    const serviceRegistrationRequest = create(RegisterRequestSchema, {
      serviceName: serviceInfo.serviceName,
      host: serviceInfo.host,
      port: serviceInfo.port,
      metadata: buildMetadata()
    })

    // TODO: When backend is ready, uncomment this to use real gRPC
    // const transport = createGrpcWebTransport(props.endpoint)
    // const client = createClient(ServiceRegistration, transport)
    // const response = await client.registerService(serviceInfoProto)
    // const typedResponse = response as ServiceRegistrationStatus
    // 
    // registrationStatus.value = {
    //   success: typedResponse.success,
    //   message: typedResponse.message,
    //   registeredAt: typedResponse.registeredAt?.toDate().toISOString(),
    //   consulServiceId: typedResponse.consulServiceId,
    //   databaseId: typedResponse.databaseId,
    //   warnings: typedResponse.warnings
    // }
    
    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create mock response (will be replaced when backend is ready)
    const mockResponse = {
      success: true,
      message: `Service '${serviceInfo.serviceName}' registered successfully`,
      registeredAt: new Date().toISOString(),
      consulServiceId: `consul-${serviceInfo.serviceId}`,
      databaseId: `db-${Date.now()}`,
      warnings: serviceInfo.healthChecks.length === 0 ? ['No health checks configured'] : []
    }

    // Store response for display
    registrationStatus.value = mockResponse

    registeredService.value = serviceRegistrationRequest
    emit('registered', serviceRegistrationRequest)
    
  } catch (error) {
    registrationStatus.value = {
      success: false,
      message: `Registration failed: ${error instanceof Error ? error.message : String(error)}`
    }
    emit('error', error)
  } finally {
    loading.value = false
  }
}

const registerServiceStream = async () => {
  streaming.value = true
  streamEvents.value = []
  
  try {
    // TODO: Replace with actual streaming gRPC call
    // const client = new ServiceRegistrationClient(props.endpoint)
    // const stream = client.registerServiceStream(request)
    // stream.on('data', (event) => { ... })
    
    // Simulate streaming events using protobuf enums
    const events = [
      { eventType: ServiceRegistrationEventType.REGISTRATION_STARTED, message: 'Starting service registration...' },
      { eventType: ServiceRegistrationEventType.METADATA_COLLECTED, message: 'Service metadata collected' },
      { eventType: ServiceRegistrationEventType.CONSUL_REGISTERED, message: 'Registered with Consul' },
      { eventType: ServiceRegistrationEventType.DATABASE_STORED, message: 'Stored in database' },
      { eventType: ServiceRegistrationEventType.HEALTH_CHECKS_CONFIGURED, message: 'Health checks configured' },
      { eventType: ServiceRegistrationEventType.REGISTRATION_COMPLETED, message: 'Registration completed successfully' }
    ]
    
    for (const event of events) {
      await new Promise(resolve => setTimeout(resolve, 500))
      streamEvents.value.push({
        ...event,
        serviceId: serviceInfo.serviceId,
        timestamp: new Date()
      })
    }
    
    registrationStatus.value = {
      success: true,
      message: 'Service registered via stream'
    }
    
  } catch (error) {
    streamEvents.value.push({
      eventType: ServiceRegistrationEventType.REGISTRATION_FAILED,
      message: `Failed: ${error}`,
      serviceId: serviceInfo.serviceId,
      timestamp: new Date()
    })
  } finally {
    streaming.value = false
  }
}

const resetForm = () => {
  form.value?.reset()
  registrationStatus.value = null
  registeredService.value = null
  streamEvents.value = []
  metadataFields.value = []
  serviceInfo.healthChecks = []
}

const getEventColor = (eventType: string): string => {
  const colors: Record<string, string> = {
    [ServiceRegistrationEventType.SERVICE_REGISTRATION_EVENT_TYPE_UNSPECIFIED]: 'grey',
    [ServiceRegistrationEventType.REGISTRATION_STARTED]: 'info',
    [ServiceRegistrationEventType.METADATA_COLLECTED]: 'primary',
    [ServiceRegistrationEventType.ICON_LOADED]: 'secondary',
    [ServiceRegistrationEventType.CONSUL_REGISTERED]: 'success',
    [ServiceRegistrationEventType.DATABASE_STORED]: 'success',
    [ServiceRegistrationEventType.HEALTH_CHECKS_CONFIGURED]: 'warning',
    [ServiceRegistrationEventType.REGISTRATION_COMPLETED]: 'success',
    [ServiceRegistrationEventType.REGISTRATION_FAILED]: 'error',
    [ServiceRegistrationEventType.HEARTBEAT_RECEIVED]: 'info',
    [ServiceRegistrationEventType.SERVICE_UPDATED]: 'primary'
  }
  return colors[eventType] || 'grey'
}

const formatEventType = (eventType: string): string => {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.v-timeline {
  max-height: 300px;
  overflow-y: auto;
}
</style>