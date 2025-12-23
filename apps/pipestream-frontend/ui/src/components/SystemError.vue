<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6">
          <v-card-title class="text-h4 text-center mb-4">
            <v-icon size="64" color="warning" class="mb-2">mdi-alert-circle-outline</v-icon>
            <div>System Initialization</div>
          </v-card-title>

          <v-card-text>
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <div class="text-h6 mb-2">Platform Shell is running</div>
              <div>The frontend proxy is healthy, but some backend services are not yet available.</div>
            </v-alert>

            <v-list lines="three">
              <v-list-item
                v-for="(service, key) in status"
                :key="key"
                :prepend-icon="getStatusIcon(service.status)"
                :class="getStatusClass(service.status)"
              >
                <v-list-item-title>{{ formatServiceName(key) }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ service.message }}
                  <div v-if="service.url" class="text-caption mt-1">
                    <code>{{ service.url }}</code>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-divider class="my-4"></v-divider>

            <div class="text-body-2 text-medium-emphasis">
              <p><strong>What this means:</strong></p>
              <ul class="ml-4">
                <li>The Platform Shell web proxy is running correctly</li>
                <li>Backend services (like platform-registration) are not reachable</li>
                <li>This is normal in development or when services are starting up</li>
              </ul>

              <p class="mt-4"><strong>Next steps:</strong></p>
              <ul class="ml-4">
                <li>Ensure platform-registration-service is running</li>
                <li>Check that services are registered with the correct host/port</li>
                <li>Use docker-compose to start all required services together</li>
              </ul>
            </div>

            <v-btn
              block
              color="primary"
              class="mt-6"
              @click="checkStatus"
              :loading="checking"
            >
              <v-icon left>mdi-refresh</v-icon>
              Retry Connection
            </v-btn>

            <div class="text-center text-caption text-medium-emphasis mt-4">
              Last checked: {{ formattedTimestamp }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface ServiceStatus {
  status: string;
  message: string;
  url?: string;
}

interface SystemStatus {
  [key: string]: ServiceStatus;
  timestamp: string;
}

const status = ref<SystemStatus>({
  proxy: { status: 'unknown', message: 'Checking...' },
  registration: { status: 'unknown', message: 'Checking...' },
  timestamp: new Date().toISOString()
});

const checking = ref(false);

const formattedTimestamp = computed(() => {
  return new Date(status.value.timestamp).toLocaleString();
});

function formatServiceName(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
}

function getStatusIcon(statusValue: string): string {
  switch (statusValue) {
    case 'healthy': return 'mdi-check-circle';
    case 'unavailable': return 'mdi-close-circle';
    case 'unknown': return 'mdi-help-circle';
    default: return 'mdi-alert-circle';
  }
}

function getStatusClass(statusValue: string): string {
  switch (statusValue) {
    case 'healthy': return 'text-success';
    case 'unavailable': return 'text-error';
    case 'unknown': return 'text-warning';
    default: return '';
  }
}

async function checkStatus() {
  checking.value = true;
  try {
    const response = await fetch('/api/system-status');
    const data = await response.json();
    status.value = data;

    // If all healthy, reload the page to show the app
    const allHealthy = Object.entries(data)
      .filter(([key]) => key !== 'timestamp')
      .every(([, service]: [string, any]) => service.status === 'healthy');

    if (allHealthy) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('Failed to check system status:', error);
  } finally {
    checking.value = false;
  }
}

onMounted(() => {
  checkStatus();
});
</script>
