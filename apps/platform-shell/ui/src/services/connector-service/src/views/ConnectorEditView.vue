<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card v-if="connector">
          <v-card-title>Edit Connector: {{ connector.connectorName }}</v-card-title>
          
          <v-card-text>
            <v-form v-model="valid" @submit.prevent="updateConnector">
              <v-text-field
                v-model="form.connectorName"
                label="Connector Name"
                :rules="nameRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="connector.connectorType"
                label="Connector Type"
                variant="outlined"
                readonly
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="connector.accountId"
                label="Account ID"
                variant="outlined"
                readonly
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
              
              <v-chip
                :color="connector.active ? 'success' : 'error'"
                size="large"
                class="ma-2"
              >
                {{ connector.active ? 'Active' : 'Inactive' }}
              </v-chip>
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
              v-if="connector.active"
              color="warning"
              @click="confirmDeactivate"
              :disabled="loading"
            >
              Deactivate Connector
            </v-btn>
            <v-btn
              color="primary"
              @click="updateConnector"
              :disabled="!valid || loading"
              :loading="loading"
            >
              Update Connector
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <v-card v-else-if="loading">
          <v-card-text class="text-center">
            <v-progress-circular indeterminate></v-progress-circular>
            <p class="mt-4">Loading connector...</p>
          </v-card-text>
        </v-card>
        
        <v-card v-else>
          <v-card-text class="text-center">
            <p>Connector not found</p>
            <v-btn @click="$router.push('/')">Back to Connectors</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Deactivation Confirmation Dialog -->
    <v-dialog v-model="deactivateDialog" max-width="500">
      <v-card>
        <v-card-title>Deactivate Connector</v-card-title>
        <v-card-text>
          <p>Are you sure you want to deactivate connector "{{ connector?.connectorName }}"?</p>
          <v-text-field
            v-model="deactivateReason"
            label="Reason for deactivation"
            variant="outlined"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deactivateDialog = false">Cancel</v-btn>
          <v-btn
            color="warning"
            @click="deactivateConnector"
            :disabled="!deactivateReason.trim()"
          >
            Deactivate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getConnector, updateConnector as updateConnectorService, setConnectorStatus as setConnectorStatusService } from '../services/connectorClient'
import type { ConnectorRegistration } from '@io-pipeline/grpc-stubs/connector'

const router = useRouter()

// Props
const props = defineProps<{
  connectorId: string
}>()

// Reactive data
const connector = ref<ConnectorRegistration | null>(null)
const loading = ref(false)
const valid = ref(false)
const deactivateDialog = ref(false)
const deactivateReason = ref('')

// Form data
const form = reactive({
  connectorName: '',
  s3Bucket: '',
  s3BasePath: '',
  maxFileSize: 0,
  rateLimitPerMinute: 0
})

// Form validation rules
const nameRules = [
  (v: string) => !!v || 'Connector name is required',
  (v: string) => (v && v.length >= 2) || 'Connector name must be at least 2 characters',
  (v: string) => /^[a-zA-Z0-9-_]+$/.test(v) || 'Connector name can only contain letters, numbers, hyphens, and underscores'
]

// Methods
const loadConnector = async () => {
  loading.value = true
  try {
    if (!props.connectorId) {
      connector.value = null
      return
    }

    connector.value = await getConnector(props.connectorId)
    if (connector.value) {
      form.connectorName = connector.value.connectorName
      form.s3Bucket = connector.value.s3Bucket || ''
      form.s3BasePath = connector.value.s3BasePath || ''
      form.maxFileSize = Number(connector.value.maxFileSize || 0n)
      form.rateLimitPerMinute = Number(connector.value.rateLimitPerMinute || 0n)
    }
    valid.value = true
  } catch (error) {
    console.error('Failed to load connector:', error)
    connector.value = null
  } finally {
    loading.value = false
  }
}

const updateConnector = async () => {
  if (!valid.value || !connector.value) return
  
  loading.value = true
  try {
    const result = await updateConnectorService(
      connector.value.connectorId,
      form.connectorName.trim(),
      form.s3Bucket || undefined,
      form.s3BasePath || undefined,
      form.maxFileSize || undefined,
      form.rateLimitPerMinute || undefined
    )

    if (result.success) {
      connector.value = result.connector
      form.connectorName = result.connector.connectorName
      form.s3Bucket = result.connector.s3Bucket || ''
      form.s3BasePath = result.connector.s3BasePath || ''
      form.maxFileSize = Number(result.connector.maxFileSize || 0n)
      form.rateLimitPerMinute = Number(result.connector.rateLimitPerMinute || 0n)
      valid.value = true
      console.info('Connector updated successfully')
    } else {
      console.error('Failed to update connector:', result.message)
    }
  } catch (error) {
    console.error('Failed to update connector:', error)
  } finally {
    loading.value = false
  }
}

const confirmDeactivate = () => {
  deactivateReason.value = ''
  deactivateDialog.value = true
}

const deactivateConnector = async () => {
  if (!connector.value || !deactivateReason.value.trim()) return
  
  try {
    const result = await setConnectorStatusService(
      connector.value.connectorId,
      false,
      deactivateReason.value
    )
    
    if (result.success) {
      // Update the connector status
      connector.value = { ...connector.value, active: false }
      deactivateDialog.value = false
      deactivateReason.value = ''
    } else {
      console.error('Failed to deactivate connector:', result.message)
    }
  } catch (error) {
    console.error('Error deactivating connector:', error)
  }
}

// Lifecycle
watch(
  () => props.connectorId,
  () => {
    loadConnector()
  },
  { immediate: true }
)
</script>
