<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card v-if="datasource">
          <v-card-title>Edit Data Source: {{ datasource.name }}</v-card-title>
          
          <v-card-text>
            <v-form v-model="valid" @submit.prevent="handleUpdateDataSource">
              <v-text-field
                v-model="form.name"
                label="Data Source Name"
                :rules="nameRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="datasource.accountId"
                label="Account ID"
                variant="outlined"
                readonly
                :disabled="loading"
              ></v-text-field>
              
              <v-chip
                :color="datasource.active ? 'success' : 'error'"
                size="large"
                class="ma-2"
              >
                {{ datasource.active ? 'Active' : 'Inactive' }}
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
              v-if="datasource.active"
              color="warning"
              @click="confirmDeactivate"
              :disabled="loading"
            >
              Deactivate Data Source
            </v-btn>
            <v-btn
              color="primary"
              @click="handleUpdateDataSource"
              :disabled="!valid || loading"
              :loading="loading"
            >
              Update Data Source
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <v-card v-else-if="loading">
          <v-card-text class="text-center">
            <v-progress-circular indeterminate></v-progress-circular>
            <p class="mt-4">Loading data source...</p>
          </v-card-text>
        </v-card>
        
        <v-card v-else>
          <v-card-text class="text-center">
            <p>Data source not found</p>
            <v-btn @click="$router.push('/')">Back to Data Sources</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Deactivation Confirmation Dialog -->
    <v-dialog v-model="deactivateDialog" max-width="500">
      <v-card>
        <v-card-title>Deactivate Data Source</v-card-title>
        <v-card-text>
          <p>Are you sure you want to deactivate data source "{{ datasource?.name }}"?</p>
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
            @click="deactivateDataSource"
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
import { getDataSource, updateDataSource as updateDataSourceService, setDataSourceStatus as setDataSourceStatusService } from '../services/connectorClient'
import type { DataSource } from '@ai-pipestream/protobuf-forms/generated'

const router = useRouter()

// Props
const props = defineProps<{
  datasourceId: string
}>()

// Reactive data
const datasource = ref<DataSource | null>(null)
const loading = ref(false)
const valid = ref(false)
const deactivateDialog = ref(false)
const deactivateReason = ref('')

// Form data
const form = reactive({
  name: ''
})

// Form validation rules
const nameRules = [
  (v: string) => !!v || 'Data source name is required',
  (v: string) => (v && v.length >= 2) || 'Data source name must be at least 2 characters',
  (v: string) => /^[a-zA-Z0-9-_]+$/.test(v) || 'Data source name can only contain letters, numbers, hyphens, and underscores'
]

// Methods
const loadDataSource = async () => {
  loading.value = true
  try {
    if (!props.datasourceId) {
      datasource.value = null
      return
    }

    datasource.value = await getDataSource(props.datasourceId)
    if (datasource.value) {
      form.name = datasource.value.name
    }
    valid.value = true
  } catch (error) {
    console.error('Failed to load data source:', error)
    datasource.value = null
  } finally {
    loading.value = false
  }
}

const handleUpdateDataSource = async () => {
  if (!valid.value || !datasource.value) return
  
  loading.value = true
  try {
    const result = await updateDataSourceService(
      datasource.value.datasourceId,
      form.name.trim()
    )

    if (result.success) {
      datasource.value = result.datasource
      form.name = result.datasource.name
      valid.value = true
      console.info('Data source updated successfully')
    } else {
      console.error('Failed to update data source:', result.message)
    }
  } catch (error) {
    console.error('Failed to update data source:', error)
  } finally {
    loading.value = false
  }
}

const confirmDeactivate = () => {
  deactivateReason.value = ''
  deactivateDialog.value = true
}

const deactivateDataSource = async () => {
  if (!datasource.value || !deactivateReason.value.trim()) return
  
  try {
    const result = await setDataSourceStatusService(
      datasource.value.datasourceId,
      false,
      deactivateReason.value
    )
    
    if (result.success) {
      // Update the datasource status
      datasource.value = { ...datasource.value, active: false }
      deactivateDialog.value = false
      deactivateReason.value = ''
    } else {
      console.error('Failed to deactivate data source:', result.message)
    }
  } catch (error) {
    console.error('Error deactivating data source:', error)
  }
}

// Lifecycle
watch(
  () => props.datasourceId,
  () => {
    loadDataSource()
  },
  { immediate: true }
)
</script>