<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-vector-polyline</v-icon>
            Create Design Graph
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="form.clusterId"
              label="Cluster ID"
              variant="outlined"
              density="compact"
              :disabled="creating"
              required
            ></v-text-field>
            <v-text-field
              v-model="form.graphName"
              label="Graph Name"
              variant="outlined"
              density="compact"
              :disabled="creating"
              required
            ></v-text-field>
            <v-text-field
              v-model="form.userId"
              label="User ID"
              variant="outlined"
              density="compact"
              :disabled="creating"
              required
            ></v-text-field>
            <v-textarea
              v-model="form.description"
              label="Description"
              variant="outlined"
              density="compact"
              rows="3"
              :disabled="creating"
            ></v-textarea>
            <v-alert
              v-if="createMessage"
              :type="createSuccess ? 'success' : 'error'"
              variant="tonal"
              class="mb-3"
            >
              {{ createMessage }}
            </v-alert>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              :loading="creating"
              :disabled="!canCreate"
              @click="submitCreate"
            >
              Create
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span class="text-h6">Design Graphs</span>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              :loading="loading"
              @click="loadGraphs"
            ></v-btn>
          </v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
              {{ error }}
            </v-alert>
            <v-data-table
              :headers="headers"
              :items="graphs"
              :loading="loading"
              item-key="graphId"
              class="elevation-1"
              density="comfortable"
            >
              <template v-slot:item.isValid="{ item }">
                <v-chip :color="item.isValid ? 'success' : 'warning'" size="small">
                  {{ item.isValid ? 'Valid' : 'Needs Review' }}
                </v-chip>
              </template>
              <template v-slot:item.readyForDeployment="{ item }">
                <v-chip :color="item.readyForDeployment ? 'success' : 'info'" size="small">
                  {{ item.readyForDeployment ? 'Ready' : 'Draft' }}
                </v-chip>
              </template>
              <template v-slot:item.modifiedAt="{ item }">
                {{ formatTimestamp(item.modifiedAt) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { createDesignGraph, listDesignGraphs } from '../services/designClient'
import type { DesignGraphSummary } from '@ai-pipestream/protobuf-forms/generated'

const graphs = ref<DesignGraphSummary[]>([])
const loading = ref(false)
const error = ref('')
const creating = ref(false)
const createMessage = ref('')
const createSuccess = ref(false)

const form = ref({
  clusterId: '',
  graphName: '',
  description: '',
  userId: 'local-dev'
})

const headers = [
  { title: 'Graph ID', key: 'graphId', sortable: false },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Cluster', key: 'clusterId', sortable: false },
  { title: 'Nodes', key: 'nodeCount', sortable: false },
  { title: 'Edges', key: 'edgeCount', sortable: false },
  { title: 'Valid', key: 'isValid', sortable: false },
  { title: 'Ready', key: 'readyForDeployment', sortable: false },
  { title: 'Updated', key: 'modifiedAt', sortable: false }
]

const canCreate = computed(() =>
  form.value.clusterId.trim() && form.value.graphName.trim() && form.value.userId.trim()
)

const loadGraphs = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await listDesignGraphs()
    graphs.value = response.graphs || []
  } catch (err: any) {
    console.error('[PipelineDesigner] Failed to load graphs', err)
    error.value = err?.message || 'Failed to load design graphs'
  } finally {
    loading.value = false
  }
}

const submitCreate = async () => {
  if (!canCreate.value) return
  creating.value = true
  createMessage.value = ''
  try {
    const response = await createDesignGraph({
      clusterId: form.value.clusterId.trim(),
      graphName: form.value.graphName.trim(),
      description: form.value.description.trim(),
      userId: form.value.userId.trim()
    })

    createSuccess.value = response.success
    createMessage.value = response.message || (response.success ? 'Created' : 'Failed to create')

    if (response.success) {
      await loadGraphs()
      form.value.graphName = ''
      form.value.description = ''
    }
  } catch (err: any) {
    console.error('[PipelineDesigner] Failed to create graph', err)
    createSuccess.value = false
    createMessage.value = err?.message || 'Failed to create graph'
  } finally {
    creating.value = false
  }
}

const formatTimestamp = (value?: number) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

onMounted(loadGraphs)
</script>

<style scoped>
</style>
