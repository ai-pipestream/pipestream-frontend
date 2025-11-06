<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title>Create New Connector</v-card-title>
          
          <v-card-text>
            <v-form ref="form" v-model="valid" @submit.prevent="createConnector">
              <v-text-field
                v-model="form.connectorName"
                label="Connector Name"
                :rules="nameRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <v-select
                v-model="form.connectorType"
                label="Connector Type"
                :items="connectorTypes"
                :rules="typeRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-select>
              
              <v-text-field
                v-model="form.accountId"
                label="Account ID"
                :rules="accountIdRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="form.s3Bucket"
                label="S3 Bucket"
                variant="outlined"
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="form.s3BasePath"
                label="S3 Base Path"
                variant="outlined"
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model.number="form.maxFileSize"
                label="Max File Size (bytes)"
                type="number"
                variant="outlined"
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model.number="form.rateLimitPerMinute"
                label="Rate Limit (per minute)"
                type="number"
                variant="outlined"
                :disabled="loading"
              ></v-text-field>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              @click="$router.push('/')"
              :disabled="loading"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              @click="createConnector"
              :disabled="!valid || loading"
              :loading="loading"
            >
              Create Connector
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="500">
      <v-card>
        <v-card-title>Connector Created Successfully</v-card-title>
        <v-card-text>
          <p>Your connector has been created with the following details:</p>
          <v-text-field
            v-model="createdConnectorId"
            label="Connector ID"
            variant="outlined"
            readonly
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyConnectorId"
          ></v-text-field>
          <v-text-field
            v-model="createdApiKey"
            label="API Key"
            variant="outlined"
            readonly
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyApiKey"
          ></v-text-field>
          <p class="text-caption text-warning">⚠️ Save this API key now - it will not be shown again!</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="successDialog = false; $router.push('/')"
          >
            Done
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerConnector as registerConnectorService } from '../services/connectorClient'

const router = useRouter()

// Form data
const form = ref({
  connectorName: '',
  connectorType: '',
  accountId: '',
  s3Bucket: '',
  s3BasePath: '',
  maxFileSize: 0,
  rateLimitPerMinute: 0
})

const valid = ref(false)
const loading = ref(false)
const successDialog = ref(false)
const createdConnectorId = ref('')
const createdApiKey = ref('')

// Connector types
const connectorTypes = [
  { title: 'Filesystem', value: 'filesystem' },
  { title: 'Confluence', value: 'confluence' },
  { title: 'Database', value: 'database' },
  { title: 'API', value: 'api' },
  { title: 'SharePoint', value: 'sharepoint' },
  { title: 'Google Drive', value: 'google-drive' },
  { title: 'Dropbox', value: 'dropbox' }
]

// Form validation rules
const nameRules = [
  (v: string) => !!v || 'Connector name is required',
  (v: string) => (v && v.length >= 2) || 'Connector name must be at least 2 characters',
  (v: string) => /^[a-zA-Z0-9-_]+$/.test(v) || 'Connector name can only contain letters, numbers, hyphens, and underscores'
]

const typeRules = [
  (v: string) => !!v || 'Connector type is required'
]

const accountIdRules = [
  (v: string) => !!v || 'Account ID is required',
  (v: string) => (v && v.length >= 3) || 'Account ID must be at least 3 characters'
]

// Methods
const createConnector = async () => {
  if (!valid.value) return
  
  loading.value = true
  try {
    const result = await registerConnectorService(
      form.value.connectorName,
      form.value.connectorType,
      form.value.accountId,
      form.value.s3Bucket || undefined,
      form.value.s3BasePath || undefined,
      form.value.maxFileSize || undefined,
      form.value.rateLimitPerMinute || undefined
    )
    
    if (result.success) {
      createdConnectorId.value = result.connectorId
      createdApiKey.value = result.apiKey
      successDialog.value = true
    } else {
      console.error('Failed to create connector:', result.message)
    }
  } catch (error) {
    console.error('Failed to create connector:', error)
    // Handle error (show snackbar, etc.)
  } finally {
    loading.value = false
  }
}

const copyConnectorId = async () => {
  try {
    await navigator.clipboard.writeText(createdConnectorId.value)
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy connector ID:', error)
  }
}

const copyApiKey = async () => {
  try {
    await navigator.clipboard.writeText(createdApiKey.value)
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy API key:', error)
  }
}
</script>
