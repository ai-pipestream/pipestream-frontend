<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center">
            <span class="text-h6">Data Sources</span>
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
              label="Search data sources..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              single-line
              class="mr-2"
              :disabled="loading"
              clearable
              @keyup.enter="reloadDataSources"
              @click:clear="onSearchCleared"
            ></v-text-field>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="$router.push('/admin-connector/create')"
            >
              Create Data Source
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="datasources"
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
              
              <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>
              
              <template v-slot:item.updatedAt="{ item }">
                {{ formatDate(item.updatedAt) }}
              </template>
              
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  @click="viewDataSource(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  @click="editDataSource(item)"
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
        <v-card-title>Deactivate Data Source</v-card-title>
        <v-card-text>
          <p>Are you sure you want to deactivate data source "{{ selectedDataSource?.name }}"?</p>
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>Delete Data Source</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete data source "{{ selectedDataSource?.name }}"?</p>
          <p class="text-caption text-warning">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            @click="deleteDataSource"
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
          <p>Are you sure you want to rotate the API key for data source "{{ selectedDataSource?.name }}"?</p>
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
  getDataSource, 
  setDataSourceStatus as setDataSourceStatusService, 
  deleteDataSource as deleteDataSourceService,
  rotateApiKey as rotateApiKeyService,
  listDataSources as listDataSourcesService 
} from '../services/connectorClient'
import type { DataSource } from '@ai-pipestream/protobuf-forms/generated'

const router = useRouter()

// Reactive data
const datasources = ref<DataSource[]>([])
const loading = ref(false)
const search = ref('')
const includeInactive = ref(false)
const deactivateDialog = ref(false)
const deleteDialog = ref(false)
const rotateDialog = ref(false)
const selectedDataSource = ref<DataSource | null>(null)
const deactivateReason = ref('')
const newApiKey = ref('')
const nextPageToken = ref('')
const totalCount = ref(0)

// Table headers
const headers = [
  { title: 'Data Source ID', key: 'datasourceId', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Account ID', key: 'accountId', sortable: true },
  { title: 'Status', key: 'active', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Methods
const loadDataSources = async (options: { append?: boolean; pageToken?: string } = {}) => {
  loading.value = true
  try {
    const response = await listDataSourcesService({
      accountId: search.value.trim() || undefined,
      includeInactive: includeInactive.value,
      pageToken: options.pageToken
    })

    if (options.append) {
      datasources.value = [...datasources.value, ...(response.datasources ?? [])]
    } else {
      datasources.value = response.datasources ?? []
    }

    nextPageToken.value = response.nextPageToken || ''
    totalCount.value = response.totalCount || datasources.value.length
  } catch (error) {
    console.error('Failed to load data sources:', error)
    if (!options.append) {
      datasources.value = []
      nextPageToken.value = ''
      totalCount.value = 0
    }
  } finally {
    loading.value = false
  }
}

const reloadDataSources = () => {
  nextPageToken.value = ''
  loadDataSources()
}

const onSearchCleared = () => {
  if (!search.value) {
    reloadDataSources()
  }
}

const loadMore = () => {
  if (!nextPageToken.value) return
  loadDataSources({ append: true, pageToken: nextPageToken.value })
}

const viewDataSource = (datasource: DataSource) => {
  // Navigate to datasource details view
  console.log('View data source:', datasource)
}

const editDataSource = (datasource: DataSource) => {
  router.push({ name: 'connectors-edit', params: { datasourceId: datasource.datasourceId } })
}

const confirmDeactivate = (datasource: DataSource) => {
  selectedDataSource.value = datasource
  deactivateReason.value = ''
  deactivateDialog.value = true
}

const deactivateDataSource = async () => {
  if (!selectedDataSource.value || !deactivateReason.value.trim()) return
  
  try {
    const result = await setDataSourceStatusService(
      selectedDataSource.value.datasourceId,
      false,
      deactivateReason.value
    )
    
    if (result.success) {
      // Update the datasource in the list
      const index = datasources.value.findIndex(d => d.datasourceId === selectedDataSource.value!.datasourceId)
      if (index !== -1) {
        datasources.value[index] = { ...datasources.value[index], active: false }
      }
      
      deactivateDialog.value = false
      selectedDataSource.value = null
      deactivateReason.value = ''
    } else {
      console.error('Failed to deactivate data source:', result.message)
    }
  } catch (error) {
    console.error('Error deactivating data source:', error)
  }
}

const confirmDelete = (datasource: DataSource) => {
  selectedDataSource.value = datasource
  deleteDialog.value = true
}

const deleteDataSource = async () => {
  if (!selectedDataSource.value) return
  
  try {
    const result = await deleteDataSourceService(selectedDataSource.value.datasourceId, false)
    
    if (result.success) {
      // Remove the datasource from the list
      datasources.value = datasources.value.filter(d => d.datasourceId !== selectedDataSource.value!.datasourceId)
      totalCount.value = Math.max(0, totalCount.value - 1)
      
      deleteDialog.value = false
      selectedDataSource.value = null
    } else {
      console.error('Failed to delete data source:', result.message)
    }
  } catch (error) {
    console.error('Error deleting data source:', error)
  }
}

const rotateApiKey = async (datasource: DataSource) => {
  try {
    const result = await rotateApiKeyService(datasource.datasourceId, true)
    
    if (result.success) {
      newApiKey.value = result.newApiKey
      selectedDataSource.value = datasource
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
  loadDataSources()
})

watch(includeInactive, () => {
  reloadDataSources()
})
</script>