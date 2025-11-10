<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center">
            <span class="text-h6">Connectors</span>
            <v-spacer></v-spacer>
            <v-switch
              v-model="includeInactive"
              color="primary"
              inset
              hide-details
              label="Show inactive"
              :disabled="loading"
            ></v-switch>
            <v-text-field
              v-model="search"
              label="Search connectors..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              single-line
              class="mr-2"
              :disabled="loading"
              clearable
              @keyup.enter="reloadConnectors"
              @click:clear="onSearchCleared"
            ></v-text-field>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="$router.push('/admin-connector/create')"
            >
              Create Connector
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="connectors"
              :loading="loading"
              :items-length="totalCount"
              class="elevation-1"
            >
              
              <template v-slot:item.active="{ item }">
                <v-chip
                  :color="item.active ? 'success' : 'error'"
                  size="small"
                >
                  {{ item.active ? 'Active' : 'Inactive' }}
                </v-chip>
              </template>
              
              <template v-slot:item.created="{ item }">
                {{ formatDate(item.created) }}
              </template>
              
              <template v-slot:item.updated="{ item }">
                {{ formatDate(item.updated) }}
              </template>
              
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  @click="viewConnector(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  @click="editConnector(item)"
                ></v-btn>
                <v-btn
                  v-if="item.active"
                  icon="mdi-key"
                  size="small"
                  color="warning"
                  @click="rotateApiKey(item)"
                ></v-btn>
                <v-btn
                  v-if="item.active"
                  icon="mdi-pause"
                  size="small"
                  color="warning"
                  @click="confirmDeactivate(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  color="error"
                  @click="confirmDelete(item)"
                ></v-btn>
              </template>
            </v-data-table>
            <div
              v-if="nextPageToken"
              class="d-flex justify-center mt-4"
            >
              <v-btn
                variant="text"
                color="primary"
                :disabled="loading"
                @click="loadMore"
              >
                Load More
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Deactivation Confirmation Dialog -->
    <v-dialog v-model="deactivateDialog" max-width="500">
      <v-card>
        <v-card-title>Deactivate Connector</v-card-title>
        <v-card-text>
          <p>Are you sure you want to deactivate connector "{{ selectedConnector?.connectorName }}"?</p>
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>Delete Connector</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete connector "{{ selectedConnector?.connectorName }}"?</p>
          <p class="text-caption text-warning">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            @click="deleteConnector"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- API Key Rotation Dialog -->
    <v-dialog v-model="rotateDialog" max-width="500">
      <v-card>
        <v-card-title>Rotate API Key</v-card-title>
        <v-card-text>
          <p>Are you sure you want to rotate the API key for connector "{{ selectedConnector?.connectorName }}"?</p>
          <p class="text-caption text-warning">The old API key will stop working immediately.</p>
          <v-text-field
            v-model="newApiKey"
            label="New API Key"
            variant="outlined"
            readonly
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyApiKey"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="rotateDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getConnector, 
  setConnectorStatus as setConnectorStatusService, 
  deleteConnector as deleteConnectorService,
  rotateApiKey as rotateApiKeyService,
  listConnectors as listConnectorsService 
} from '../services/connectorClient'
import type { ConnectorRegistration } from '@ai-pipestream/grpc-stubs/dist/module/connectors/connector_intake_service_pb'

const router = useRouter()

// Reactive data
const connectors = ref<ConnectorRegistration[]>([])
const loading = ref(false)
const search = ref('')
const includeInactive = ref(false)
const deactivateDialog = ref(false)
const deleteDialog = ref(false)
const rotateDialog = ref(false)
const selectedConnector = ref<ConnectorRegistration | null>(null)
const deactivateReason = ref('')
const newApiKey = ref('')
const nextPageToken = ref('')
const totalCount = ref(0)

// Table headers
const headers = [
  { title: 'Connector ID', key: 'connectorId', sortable: true },
  { title: 'Name', key: 'connectorName', sortable: true },
  { title: 'Type', key: 'connectorType', sortable: true },
  { title: 'Account ID', key: 'accountId', sortable: true },
  { title: 'Status', key: 'active', sortable: true },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Updated', key: 'updated', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Methods
const loadConnectors = async (options: { append?: boolean; pageToken?: string } = {}) => {
  loading.value = true
  try {
    const response = await listConnectorsService({
      accountId: search.value.trim() || undefined,
      includeInactive: includeInactive.value,
      pageToken: options.pageToken
    })

    if (options.append) {
      connectors.value = [...connectors.value, ...(response.connectors ?? [])]
    } else {
      connectors.value = response.connectors ?? []
    }

    nextPageToken.value = response.nextPageToken || ''
    totalCount.value = response.totalCount || connectors.value.length
  } catch (error) {
    console.error('Failed to load connectors:', error)
    if (!options.append) {
      connectors.value = []
      nextPageToken.value = ''
      totalCount.value = 0
    }
  } finally {
    loading.value = false
  }
}

const reloadConnectors = () => {
  nextPageToken.value = ''
  loadConnectors()
}

const onSearchCleared = () => {
  if (!search.value) {
    reloadConnectors()
  }
}

const loadMore = () => {
  if (!nextPageToken.value) return
  loadConnectors({ append: true, pageToken: nextPageToken.value })
}

const viewConnector = (connector: ConnectorRegistration) => {
  // Navigate to connector details view
  console.log('View connector:', connector)
}

const editConnector = (connector: ConnectorRegistration) => {
  router.push({ name: 'connectors-edit', params: { connectorId: connector.connectorId } })
}

const confirmDeactivate = (connector: ConnectorRegistration) => {
  selectedConnector.value = connector
  deactivateReason.value = ''
  deactivateDialog.value = true
}

const deactivateConnector = async () => {
  if (!selectedConnector.value || !deactivateReason.value.trim()) return
  
  try {
    const result = await setConnectorStatusService(
      selectedConnector.value.connectorId,
      false,
      deactivateReason.value
    )
    
    if (result.success) {
      // Update the connector in the list
      const index = connectors.value.findIndex(c => c.connectorId === selectedConnector.value!.connectorId)
      if (index !== -1) {
        connectors.value[index] = { ...connectors.value[index], active: false }
      }
      
      deactivateDialog.value = false
      selectedConnector.value = null
      deactivateReason.value = ''
    } else {
      console.error('Failed to deactivate connector:', result.message)
    }
  } catch (error) {
    console.error('Error deactivating connector:', error)
  }
}

const confirmDelete = (connector: ConnectorRegistration) => {
  selectedConnector.value = connector
  deleteDialog.value = true
}

const deleteConnector = async () => {
  if (!selectedConnector.value) return
  
  try {
    const result = await deleteConnectorService(selectedConnector.value.connectorId, false)
    
    if (result.success) {
      // Remove the connector from the list
      connectors.value = connectors.value.filter(c => c.connectorId !== selectedConnector.value!.connectorId)
      totalCount.value = Math.max(0, totalCount.value - 1)
      
      deleteDialog.value = false
      selectedConnector.value = null
    } else {
      console.error('Failed to delete connector:', result.message)
    }
  } catch (error) {
    console.error('Error deleting connector:', error)
  }
}

const rotateApiKey = async (connector: ConnectorRegistration) => {
  try {
    const result = await rotateApiKeyService(connector.connectorId, true)
    
    if (result.success) {
      newApiKey.value = result.newApiKey
      selectedConnector.value = connector
      rotateDialog.value = true
    } else {
      console.error('Failed to rotate API key:', result.message)
    }
  } catch (error) {
    console.error('Error rotating API key:', error)
  }
}

const copyApiKey = async () => {
  try {
    await navigator.clipboard.writeText(newApiKey.value)
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy API key:', error)
  }
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A'
  const seconds = Number(timestamp.seconds || 0)
  const nanos = Number(timestamp.nanos || 0)
  const date = new Date(seconds * 1000 + nanos / 1000000)
  return date.toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadConnectors()
})

watch(includeInactive, () => {
  reloadConnectors()
})
</script>
