<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title>Create New Data Source</v-card-title>
          
          <v-card-text>
            <v-form ref="form" v-model="valid" @submit.prevent="handleCreateDataSource">
              <v-text-field
                v-model="form.name"
                label="Data Source Name"
                :rules="nameRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="form.accountId"
                label="Account ID"
                :rules="accountIdRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <!-- Optional metadata fields could be added here as key-value pairs -->
              <p class="text-caption">Additional configuration can be added via metadata in the future.</p>
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
              @click="handleCreateDataSource"
              :disabled="!valid || loading"
              :loading="loading"
            >
              Create Data Source
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="500">
      <v-card>
        <v-card-title>Data Source Created Successfully</v-card-title>
        <v-card-text>
          <p>Your data source has been created with the following details:</p>
          <v-text-field
            v-model="createdDataSourceId"
            label="Data Source ID"
            variant="outlined"
            readonly
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyDataSourceId"
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
import { createDataSource as createDataSourceService } from '../services/connectorClient'

const router = useRouter()

// Form data
const form = ref({
  name: '',
  accountId: ''
})

const valid = ref(false)
const loading = ref(false)
const successDialog = ref(false)
const createdDataSourceId = ref('')
const createdApiKey = ref('')

// Form validation rules
const nameRules = [
  (v: string) => !!v || 'Data source name is required',
  (v: string) => (v && v.length >= 2) || 'Data source name must be at least 2 characters',
  (v: string) => /^[a-zA-Z0-9-_]+$/.test(v) || 'Data source name can only contain letters, numbers, hyphens, and underscores'
]

const accountIdRules = [
  (v: string) => !!v || 'Account ID is required',
  (v: string) => (v && v.length >= 3) || 'Account ID must be at least 3 characters'
]

// Methods
const handleCreateDataSource = async () => {
  if (!valid.value) return
  
  loading.value = true
  try {
    const result = await createDataSourceService(
      form.value.name,
      form.value.accountId
    )
    
    if (result.success) {
      createdDataSourceId.value = result.datasource_id
      createdApiKey.value = result.api_key
      successDialog.value = true
    } else {
      console.error('Failed to create data source:', result.message)
    }
  } catch (error) {
    console.error('Failed to create data source:', error)
  } finally {
    loading.value = false
  }
}

const copyDataSourceId = async () => {
  try {
    await navigator.clipboard.writeText(createdDataSourceId.value)
  } catch (error) {
    console.error('Failed to copy data source ID:', error)
  }
}

const copyApiKey = async () => {
  try {
    await navigator.clipboard.writeText(createdApiKey.value)
  } catch (error) {
    console.error('Failed to copy API key:', error)
  }
}
</script>
