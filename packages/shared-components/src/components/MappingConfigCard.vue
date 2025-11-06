<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-map</v-icon>
      Mapping Service Configuration
    </v-card-title>
    
    <v-card-text>
      <v-btn 
        @click="testConnection" 
        :loading="loading"
        color="primary"
      >
        Test Service Connection
      </v-btn>
      
      <v-alert 
        v-if="result" 
        :type="result.success ? 'success' : 'error'"
        class="mt-4"
      >
        {{ result.message }}
      </v-alert>
      
      <v-alert 
        v-if="error" 
        type="error"
        class="mt-4"
      >
        {{ error }}
      </v-alert>
      
      <v-divider class="my-4" />
      
      <div class="text-body-2 text-grey">
        <p>This is a basic configuration panel for the mapping service.</p>
        <p>Use the main demo tabs for full mapping functionality.</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const result = ref<{ success: boolean; message: string } | null>(null)
const error = ref<string | null>(null)

const testConnection = async () => {
  loading.value = true
  result.value = null
  error.value = null
  
  try {
    // Test the service health endpoint
    const response = await fetch('/q/health')
    
    if (response.ok) {
      result.value = {
        success: true,
        message: 'Mapping service is running and healthy'
      }
    } else {
      result.value = {
        success: false,
        message: `Service returned status: ${response.status}`
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Connection failed'
  } finally {
    loading.value = false
  }
}
</script>
