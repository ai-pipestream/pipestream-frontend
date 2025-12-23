<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Pipeline Platform</h1>
        <p>Select a service from the navigation menu to get started.</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            Available Services
            <v-spacer />
            <v-chip 
              :color="statusColor" 
              variant="flat" 
              size="small" 
              class="mr-2"
            >
              <v-icon start size="x-small">{{ statusIcon }}</v-icon>
              {{ statusText }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <div v-if="serviceRegistry.availableServices.size === 0" class="text-center pa-4">
              <v-progress-circular indeterminate color="primary" class="mb-2" />
              <div class="text-body-2">Loading services...</div>
            </div>
            <div v-else class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="service in Array.from(serviceRegistry.availableServices)"
                :key="service"
                :color="getServiceColor(service)"
                :prepend-icon="getServiceIcon(service)"
                variant="flat"
              >
                {{ service }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useServiceRegistryStore } from '../stores/serviceRegistry';
import { useShellHealth } from '../composables/useShellHealth';
import { HealthCheckResponse_ServingStatus as ServingStatus } from '@ai-pipestream/protobuf-forms/generated';

const serviceRegistry = useServiceRegistryStore();
const { updates, isConnected, isUsingFallback } = useShellHealth();

const statusColor = computed(() => {
  if (isConnected.value) return 'success';
  if (isUsingFallback.value) return 'warning';
  return 'error';
});

const statusIcon = computed(() => {
  if (isConnected.value) return 'mdi-wifi';
  if (isUsingFallback.value) return 'mdi-wifi-alert';
  return 'mdi-wifi-off';
});

const statusText = computed(() => {
  if (isConnected.value) return 'Live';
  if (isUsingFallback.value) return 'Snapshot';
  return 'Offline';
});

function getServiceColor(serviceName: string): string {
  const update = updates.value.get(serviceName);
  if (!update) return 'warning'; // Unknown status
  
  switch (update.status) {
    case ServingStatus.SERVING:
      return 'success';
    case ServingStatus.NOT_SERVING:
      return 'error';
    default:
      return 'warning';
  }
}

function getServiceIcon(serviceName: string): string {
  const update = updates.value.get(serviceName);
  if (!update) return 'mdi-help-circle'; // Unknown status
  
  switch (update.status) {
    case ServingStatus.SERVING:
      return 'mdi-check-circle';
    case ServingStatus.NOT_SERVING:
      return 'mdi-close-circle';
    default:
      return 'mdi-help-circle';
  }
}
</script>
