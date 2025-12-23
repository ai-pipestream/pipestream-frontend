<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-4">
      <v-icon icon="mdi-cloud-check" class="mr-2" size="large" />
      <h2 class="text-h5">Platform Registration Service</h2>
      
      <v-spacer />
      
      <!-- Live gRPC Health Status Indicator -->
      <GrpcHealthStatus 
        service-name="platform-registration-service" 
        target="platform-registration-service"
        :compact="true"
      />
    </div>

    <!-- Service Registration Component -->
    <v-row>
      <v-col cols="12">
        <ServiceRegistration 
          @register="handleServiceRegistration"
          @refresh="loadRegisteredServices"
        />
      </v-col>
    </v-row>

    <!-- Registered Services List -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
            Registered Services
            <v-spacer />
            <v-btn
              icon="mdi-refresh"
              variant="text"
              @click="loadRegisteredServices"
              :loading="loadingServices"
            />
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="serviceHeaders"
              :items="registeredServices"
              :loading="loadingServices"
              density="comfortable"
            >
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'HEALTHY' ? 'success' : item.status === 'UNHEALTHY' ? 'error' : 'warning'"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  @click="unregisterService(item.id)"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ServiceRegistration, GrpcHealthStatus } from '@ai-pipestream/shared-components'

// Registered services
const registeredServices = ref<any[]>([])
const loadingServices = ref(false)

const serviceHeaders = [
  { title: 'Service Name', key: 'name' },
  { title: 'Host', key: 'host' },
  { title: 'Port', key: 'port' },
  { title: 'Type', key: 'type' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Handle service registration
async function handleServiceRegistration(serviceData: any) {
  console.log('Registering service:', serviceData)
  // For now, just add to local list until backend is fully implemented
  registeredServices.value.push({
    id: Date.now().toString(),
    ...serviceData,
    status: 'HEALTHY'
  })
}

// Load registered services
async function loadRegisteredServices() {
  loadingServices.value = true
  try {
    const { registrationService } = await import('../services/registrationService')
    const services = await registrationService.listServices()
    registeredServices.value = services
  } catch (error) {
    console.error('Failed to load services:', error)
  } finally {
    loadingServices.value = false
  }
}

// Unregister service
async function unregisterService(serviceId: string) {
  console.log('Unregistering service:', serviceId)
  try {
    const { registrationService } = await import('../services/registrationService')
    await registrationService.unregisterService(serviceId)
    await loadRegisteredServices()
  } catch (error) {
    console.error('Failed to unregister service:', error)
  }
}

// Initial data load
onMounted(async () => {
  await loadRegisteredServices()
})
</script>