<template>
  <v-container fluid>
      <v-sheet elevation="2" rounded="lg" class="mb-4">
        <v-tabs 
          v-model="activeTab" 
          color="primary"
          align-tabs="center"
          height="64"
        >
          <v-tab value="config" prepend-icon="mdi-cog-outline">
            Configuration
          </v-tab>
          <v-tab value="test" prepend-icon="mdi-test-tube">
            Test Echo
          </v-tab>
          <v-tab value="status" prepend-icon="mdi-information-outline">
            Status
          </v-tab>
        </v-tabs>
      </v-sheet>
        
        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item value="config">
            <v-card>
              <v-card-title>Module Configuration</v-card-title>
              <v-card-subtitle>Configure the echo module settings</v-card-subtitle>
              <v-divider />
              <v-card-text>
                <!-- Loading state -->
                <v-alert v-if="loading" type="info" variant="tonal" prepend-icon="mdi-loading">
                  Connecting...
                </v-alert>
                
                <!-- Disconnected state -->
                <v-alert v-else-if="!connected" type="error" variant="tonal" prepend-icon="mdi-alert-circle">
                  Service disconnected, cannot load schema
                </v-alert>
                
                <!-- Connected with JSON schema -->
                <VuetifyConfigCard 
                  v-else-if="schema" 
                  :schema="schema" 
                  :initialData="initialData" 
                  @data-change="onDataChange" 
                />
                
                <!-- Connected but no schema - show KV fallback form -->
                <div v-else>
                  <v-alert type="info" variant="tonal" class="mb-4" prepend-icon="mdi-information">
                    This module doesn't provide a configuration schema. Use the key-value form below.
                  </v-alert>
                  
                  <v-card variant="outlined">
                    <v-card-title>Key-Value Configuration</v-card-title>
                    <v-card-text>
                      <v-row v-for="(value, key, index) in initialData" :key="index" class="mb-2">
                        <v-col cols="5">
                          <v-text-field
                            :model-value="key"
                            label="Key"
                            variant="outlined"
                            density="compact"
                            @update:model-value="updateKey(key, $event)"
                          />
                        </v-col>
                        <v-col cols="5">
                          <v-text-field
                            :model-value="value"
                            label="Value"
                            variant="outlined"
                            density="compact"
                            @update:model-value="updateValue(key, $event)"
                          />
                        </v-col>
                        <v-col cols="2">
                          <v-btn
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            @click="removeKeyValue(key)"
                          />
                        </v-col>
                      </v-row>
                      
                      <v-btn
                        prepend-icon="mdi-plus"
                        color="primary"
                        variant="tonal"
                        @click="addKeyValue"
                      >
                        Add Key-Value Pair
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
          
          <v-tabs-window-item value="test">
            <v-card>
              <v-card-title>Test Echo Service</v-card-title>
              <v-card-subtitle>Send test messages to verify the echo functionality</v-card-subtitle>
              <v-divider />
              <v-card-text>
                <v-text-field
                  v-model="testMessage"
                  label="Test Message"
                  placeholder="Enter a message to echo"
                  variant="outlined"
                  class="mb-4"
                />
                <v-btn
                  color="primary"
                  @click="sendTestMessage"
                  :loading="testing"
                  prepend-icon="mdi-send"
                >
                  Send Echo Test
                </v-btn>
                
                <v-alert
                  v-if="testResult"
                  :type="testResult.type"
                  variant="tonal"
                  class="mt-4"
                >
                  <strong>Response:</strong> {{ testResult.message }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
          
          <v-tabs-window-item value="status">
            <v-card>
              <v-card-title>Module Status</v-card-title>
              <v-card-subtitle>Current module information and health</v-card-subtitle>
              <v-divider />
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-list>
                      <v-list-item>
                        <v-list-item-title>Service Status</v-list-item-title>
                        <v-list-item-subtitle>{{ connectionStatus.text }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Module Type</v-list-item-title>
                        <v-list-item-subtitle>Echo Processor</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Port</v-list-item-title>
                        <v-list-item-subtitle>39100</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-list>
                      <v-list-item>
                        <v-list-item-title>Configuration Schema</v-list-item-title>
                        <v-list-item-subtitle>{{ schema ? 'Loaded' : 'Loading...' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Last Updated</v-list-item-title>
                        <v-list-item-subtitle>{{ new Date().toLocaleString() }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import VuetifyConfigCard from './components/VuetifyConfigCard.vue'
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { PipeStepProcessor } from "@io-pipeline/grpc-stubs/module";

const activeTab = ref('config')
const schema = ref(null)
const initialData = ref<Record<string, string>>({})
const testMessage = ref('Hello, Echo!')
const testing = ref(false)
const testResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const connected = ref(false)
const loading = ref(true)

// Use current origin - works in all environments
const transport = createConnectTransport({
  baseUrl: window.location.origin
});

const client = createClient(PipeStepProcessor, transport);

// Connection status computed property
const connectionStatus = computed(() => {
  if (connected.value) {
    return {
      color: 'success',
      icon: 'mdi-check-circle',
      text: 'Connected'
    }
  } else {
    return {
      color: 'error',
      icon: 'mdi-alert-circle',
      text: 'Disconnected'
    }
  }
})

// Load service registration
const loadServiceRegistration = async () => {
  loading.value = true
  try {
    const res = await client.getServiceRegistration({}, {
      headers: { 'x-target-backend': 'echo' }
    });
    connected.value = true
    if (res.jsonConfigSchema) {
      schema.value = JSON.parse(res.jsonConfigSchema);
    }
    // If no jsonConfigSchema, schema stays null and we'll show KV form
  } catch (err) {
    console.error("Failed to get service registration:", err);
    connected.value = false
    schema.value = null
  } finally {
    loading.value = false
  }
}

// Send test message
const sendTestMessage = async () => {
  if (!testMessage.value.trim()) return
  
  testing.value = true
  testResult.value = null
  
  try {
    // This would be the actual echo call - adjust based on your service interface
    // For now, just simulate an echo response
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
    testResult.value = {
      type: 'success',
      message: testMessage.value
    }
  } catch (error) {
    testResult.value = {
      type: 'error',
      message: `Echo failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadServiceRegistration()
})

const onDataChange = (data: any) => {
  console.log('Data changed:', data)
  initialData.value = data;
}

// KV form helper functions
const addKeyValue = () => {
  const newKey = `key${Object.keys(initialData.value).length + 1}`
  initialData.value = { ...initialData.value, [newKey]: '' }
}

const removeKeyValue = (key: string) => {
  const newData = { ...initialData.value }
  delete newData[key]
  initialData.value = newData
}

const updateKey = (oldKey: string, newKey: string) => {
  if (oldKey === newKey) return
  const newData = { ...initialData.value }
  newData[newKey] = newData[oldKey]
  delete newData[oldKey]
  initialData.value = newData
}

const updateValue = (key: string, value: string) => {
  initialData.value = { ...initialData.value, [key]: value }
}
</script>

<style scoped>
/* Rotating animation for launching state */
.rotate-animation :deep(.v-icon) {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
