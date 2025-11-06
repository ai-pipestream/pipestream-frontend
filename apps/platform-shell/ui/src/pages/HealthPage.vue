<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5 mr-4">Platform Health</h2>
      
      <!-- Connection Status Indicator -->
      <v-chip 
        :color="statusColor" 
        variant="flat" 
        size="small" 
        class="mr-2"
      >
        <v-icon start size="x-small">{{ statusIcon }}</v-icon>
        {{ statusText }}
      </v-chip>
      
      <!-- Fallback Indicator -->
      <v-chip 
        v-if="isUsingFallback" 
        color="warning" 
        variant="outlined" 
        size="small" 
        class="mr-2"
      >
        <v-icon start size="x-small">mdi-backup-restore</v-icon>
        Fallback Mode
      </v-chip>
      
      <!-- Reconnect Attempts -->
      <v-chip 
        v-if="reconnectAttempts > 0" 
        color="info" 
        variant="outlined" 
        size="small" 
        class="mr-2"
      >
        Attempts: {{ reconnectAttempts }}
      </v-chip>
      
      <v-spacer />
      
      <!-- Manual Refresh Button -->
      <v-btn
        @click="handleRefresh"
        :loading="refreshing"
        variant="outlined"
        size="small"
      >
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" density="compact" closable>
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <div v-if="updateList.length === 0 && !error" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" class="mb-4" />
      <div class="text-body-2">Loading health status...</div>
    </div>

    <!-- Service Health Cards -->
    <v-row v-else>
      <v-col v-for="u in updateList" :key="u.serviceName" cols="12" md="6" lg="4">
        <v-card variant="tonal" class="mb-4" :color="getCardColor(u)">
          <v-card-title class="d-flex align-center">
            <v-icon :icon="iconFor(u.serviceName)" class="mr-2" /> 
            {{ u.displayName || u.serviceName }}
            <v-spacer />
            <v-chip 
              :color="getStatusColor(u.status)" 
              variant="flat" 
              size="small"
            >
              {{ getStatusText(u.status) }}
            </v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div class="text-body-2 mb-2">
              <v-icon size="small" class="mr-1">mdi-target</v-icon>
              Target: {{ u.target }}
            </div>
            <div class="text-caption text-medium-emphasis">
              <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
              Updated: {{ formatTimestamp(u.observedAt) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useShellHealth } from '../composables/useShellHealth'
import { HealthCheckResponse_ServingStatus as ServingStatus } from '@io-pipeline/grpc-stubs/health'
import type { ServiceHealthUpdate } from '@io-pipeline/grpc-stubs/shell'

const { updates, error, isConnected, isUsingFallback, reconnectAttempts, refresh } = useShellHealth()
const refreshing = ref(false)

const updateList = computed(() => Array.from(updates.value.values()))

const statusColor = computed(() => {
  if (isConnected.value) return 'success'
  if (isUsingFallback.value) return 'warning'
  return 'error'
})

const statusIcon = computed(() => {
  if (isConnected.value) return 'mdi-wifi'
  if (isUsingFallback.value) return 'mdi-wifi-alert'
  return 'mdi-wifi-off'
})

const statusText = computed(() => {
  if (isConnected.value) return 'Live Stream'
  if (isUsingFallback.value) return 'Snapshot'
  return 'Disconnected'
})

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await refresh()
  } finally {
    refreshing.value = false
  }
}

function iconFor(name: string): string {
  if (name.includes('registration')) return 'mdi-account-cog'
  if (name.includes('repository')) return 'mdi-database'
  if (name.includes('search') || name.includes('opensearch')) return 'mdi-magnify'
  if (name.includes('mapping')) return 'mdi-code-braces'
  if (name.includes('shell') || name.includes('platform')) return 'mdi-monitor-dashboard'
  return 'mdi-cog'
}

function getStatusColor(status: ServingStatus): string {
  switch (status) {
    case ServingStatus.SERVING:
      return 'success'
    case ServingStatus.NOT_SERVING:
      return 'error'
    default:
      return 'warning'
  }
}

function getStatusText(status: ServingStatus): string {
  switch (status) {
    case ServingStatus.SERVING:
      return 'Healthy'
    case ServingStatus.NOT_SERVING:
      return 'Unhealthy'
    default:
      return 'Unknown'
  }
}

function getCardColor(update: ServiceHealthUpdate): string {
  switch (update.status) {
    case ServingStatus.SERVING:
      return 'success-lighten-5'
    case ServingStatus.NOT_SERVING:
      return 'error-lighten-5'
    default:
      return 'warning-lighten-5'
  }
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp) return 'Unknown'
  
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    if (diffMs < 1000) return 'just now'
    if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`
    
    return date.toLocaleString()
  } catch (e) {
    return timestamp
  }
}
</script>

<style scoped>
</style>
