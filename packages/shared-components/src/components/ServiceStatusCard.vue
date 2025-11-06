<template>
  <v-card elevation="2" rounded="lg">
    <!-- Header -->
    <v-card-item class="pa-4">
      <template v-slot:prepend>
        <v-avatar 
          :color="statusColor" 
          size="56"
        >
          <v-icon size="32" color="white">
            {{ statusIcon }}
          </v-icon>
        </v-avatar>
      </template>
      
      <v-card-title class="text-h5 font-weight-bold">
        {{ serviceName }}
      </v-card-title>
      
      <v-card-subtitle class="mt-1">
        <v-chip 
          :color="statusColor"
          variant="flat"
          size="small"
          class="mr-2"
        >
          {{ status.toUpperCase() }}
        </v-chip>
        <span class="text-caption">{{ endpoint }}</span>
      </v-card-subtitle>
      
      <template v-slot:append>
        <v-btn
          icon
          variant="text"
          @click="refreshStatus"
          :loading="loading"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </template>
    </v-card-item>

    <v-divider />

    <!-- Metrics Cards -->
    <v-container fluid class="pa-4">
      <v-row>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" :color="status === 'healthy' ? 'success' : 'grey'">
            <v-card-text class="text-center pa-3">
              <div class="text-h6 font-weight-bold">{{ uptime }}</div>
              <div class="text-caption">Uptime</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="info">
            <v-card-text class="text-center pa-3">
              <div class="text-h6 font-weight-bold">{{ latency }}ms</div>
              <div class="text-caption">Latency</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center pa-3">
              <div class="text-h6 font-weight-bold">{{ requestsPerSec }}</div>
              <div class="text-caption">Req/sec</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" :color="errorRate > 5 ? 'error' : 'success'">
            <v-card-text class="text-center pa-3">
              <div class="text-h6 font-weight-bold">{{ errorRate }}%</div>
              <div class="text-caption">Error Rate</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Health Checks -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-heart-pulse</v-icon>
            Health Checks
            <v-spacer />
            <v-chip size="x-small" variant="outlined" class="mr-2">
              {{ healthyChecks }}/{{ healthChecks.length }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item
              v-for="check in healthChecks"
              :key="check.name"
              :class="{ 'bg-red-lighten-5': !check.healthy, 'bg-green-lighten-5': check.healthy }"
            >
              <template v-slot:prepend>
                <v-icon 
                  :color="check.healthy ? 'success' : 'error'"
                  size="small"
                >
                  {{ check.healthy ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ check.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ check.message }}</v-list-item-subtitle>
              <template v-slot:append>
                <span class="text-caption">{{ check.duration }}ms</span>
              </template>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Recent Logs -->
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-text-box-outline</v-icon>
            Recent Logs
            <v-spacer />
            <v-chip size="x-small" variant="outlined" class="mr-2">
              {{ logs.length }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-timeline density="compact" side="end">
            <v-timeline-item
              v-for="(log, idx) in logs.slice(0, 5)"
              :key="idx"
              :dot-color="getLogColor(log.level)"
              size="x-small"
            >
              <template v-slot:opposite>
                <span class="text-caption">{{ formatTime(log.timestamp) }}</span>
              </template>
              <div>
                <v-chip 
                  size="x-small" 
                  :color="getLogColor(log.level)"
                  variant="flat"
                  class="mb-1"
                >
                  {{ log.level }}
                </v-chip>
                <div class="text-caption">{{ log.message }}</div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Configuration -->
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-cog</v-icon>
            Configuration
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item v-for="(value, key) in configuration" :key="key">
              <v-list-item-title class="text-caption font-weight-medium">
                {{ formatConfigKey(key) }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Actions -->
    <v-divider />
    <v-card-actions class="pa-4">
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
        variant="text"
        color="primary"
        @click="viewDetails"
      >
        View Details
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  serviceName: string
  endpoint: string
  status?: 'healthy' | 'degraded' | 'offline' | 'unknown'
  autoRefresh?: boolean
  refreshInterval?: number
  healthEndpoint?: string
}

const props = withDefaults(defineProps<Props>(), {
  status: 'unknown',
  autoRefresh: false,
  refreshInterval: 30000, // 30 seconds
  healthEndpoint: '/health'
})

const emit = defineEmits(['refresh', 'test', 'view-details'])

// State
const loading = ref(false)
const testing = ref(false)
const uptime = ref('0h 0m')
const latency = ref(0)
const requestsPerSec = ref(0)
const errorRate = ref(0)
const healthChecks = ref([
  { name: 'Database', healthy: true, message: 'Connected', duration: 12 },
  { name: 'Cache', healthy: true, message: 'Redis available', duration: 3 },
  { name: 'Message Queue', healthy: true, message: 'RabbitMQ connected', duration: 8 },
  { name: 'Storage', healthy: false, message: 'S3 timeout', duration: 5000 }
])
const logs = ref([
  { level: 'info', message: 'Service started successfully', timestamp: new Date() },
  { level: 'warning', message: 'High memory usage detected (85%)', timestamp: new Date(Date.now() - 60000) },
  { level: 'error', message: 'Failed to connect to external API', timestamp: new Date(Date.now() - 120000) },
  { level: 'info', message: 'Configuration reloaded', timestamp: new Date(Date.now() - 180000) },
  { level: 'debug', message: 'Health check completed', timestamp: new Date(Date.now() - 240000) }
])
const configuration = ref({
  version: '2.1.0',
  environment: 'production',
  port: '8080',
  maxConnections: '1000',
  timeout: '30s',
  retryPolicy: 'exponential'
})

let refreshTimer: ReturnType<typeof setInterval> | null = null

// Computed
const statusColor = computed(() => {
  const colors = {
    healthy: 'success',
    degraded: 'warning',
    offline: 'error',
    unknown: 'grey'
  }
  return colors[props.status] || 'grey'
})

const statusIcon = computed(() => {
  const icons = {
    healthy: 'mdi-check-circle',
    degraded: 'mdi-alert',
    offline: 'mdi-close-circle',
    unknown: 'mdi-help-circle'
  }
  return icons[props.status] || 'mdi-help-circle'
})

const healthyChecks = computed(() => {
  return healthChecks.value.filter(c => c.healthy).length
})

// Methods
const refreshStatus = async () => {
  loading.value = true
  emit('refresh')
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Update with random data for demo
  latency.value = Math.floor(Math.random() * 100)
  requestsPerSec.value = Math.floor(Math.random() * 1000)
  errorRate.value = Math.round(Math.random() * 10 * 100) / 100
  
  // Update uptime
  const uptimeMs = Math.floor(Math.random() * 86400000) // Random up to 24 hours
  const hours = Math.floor(uptimeMs / 3600000)
  const minutes = Math.floor((uptimeMs % 3600000) / 60000)
  uptime.value = `${hours}h ${minutes}m`
  
  loading.value = false
}

const testConnection = async () => {
  testing.value = true
  emit('test')
  
  // Simulate connection test
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  testing.value = false
}

const viewDetails = () => {
  emit('view-details')
}

const getLogColor = (level: string): string => {
  const colors: Record<string, string> = {
    error: 'error',
    warning: 'warning',
    info: 'info',
    debug: 'grey',
    trace: 'grey-lighten-1'
  }
  return colors[level] || 'grey'
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatConfigKey = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim()
}

// Lifecycle
onMounted(() => {
  refreshStatus()
  
  if (props.autoRefresh) {
    refreshTimer = setInterval(refreshStatus, props.refreshInterval)
  }
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.v-card-item {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.v-theme--dark .v-card-item {
  background: linear-gradient(135deg, #424242 0%, #303030 100%);
}

.v-timeline {
  max-height: 300px;
  overflow-y: auto;
}
</style>