<template>
  <div>
    <v-row class="mb-4" align="center" no-gutters>
      <v-col cols="12" md="5">
        <v-autocomplete
          v-model="selectedId"
          :items="docOptions"
          item-title="label"
          item-value="id"
          label="Select Repository Document"
          clearable
          density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="Search"
          density="comfortable"
          clearable
          @click:clear="onClearSearch"
        />
      </v-col>
      <v-col cols="12" md="3" class="text-right">
        <v-btn class="mr-2" variant="text" @click="reloadDocs" icon="mdi-refresh" />
        <v-btn color="primary" variant="tonal" @click="openAddDialog">Add data</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>Input Preview</v-card-title>
          <v-card-text>
            <PipeDocPreview v-if="currentDoc" :document="currentDoc" />
            <div v-else class="text-grey">Select a document to preview…</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>Mapping Rules (JSON)</v-card-title>
          <v-card-text>
            <v-textarea v-model="mappingRulesJson" rows="12" auto-grow density="comfortable" />
            <div class="mt-2 d-flex align-center">
              <v-btn color="primary" :disabled="!currentDoc" @click="runMapping">Run Mapping</v-btn>
              <v-spacer />
              <v-btn v-if="allowSave && mappedDoc" variant="tonal" @click="saveResult">Save to Repository</v-btn>
            </div>
            <div v-if="error" class="text-error text-caption mt-2">{{ error }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>Result</v-card-title>
          <v-card-text>
            <ResponseViewer v-if="mappedDoc" :response="{ document: mappedDoc }" />
            <div v-else class="text-grey">Run a mapping to see the result…</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>

  <v-dialog v-model="addDialog" max-width="900">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-file-plus</v-icon>
        Add data to Repository
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="addDialog = false" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <PipeDocEditorCard :document="newDoc" :allow-create="true" @update="onDocUpdate" />
        <div v-if="addError" class="text-error text-caption mt-2">{{ addError }}</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="addDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="saveNewDoc">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { PipeDocService, MappingService, type PipeDoc } from '@ai-pipestream/protobuf-forms/generated'
import PipeDocPreview from './PipeDocPreview.vue'
import ResponseViewer from './ResponseViewer.vue'
import PipeDocEditorCard from './PipeDocEditorCard.vue'

interface Props {
  repositoryTarget?: string
  mappingTarget?: string
  pageSize?: number
  autoLoad?: boolean
  allowSave?: boolean
  drive?: string
  connectorId?: string
}

const props = withDefaults(defineProps<Props>(), {
  repositoryTarget: 'repository-service',
  mappingTarget: 'mapping-service',
  pageSize: 25,
  autoLoad: true,
  allowSave: true,
  drive: 'pipedocs-drive',
  connectorId: 'web-proxy',
})

const emit = defineEmits<{
  (e: 'run-start'): void
  (e: 'run-complete', result: any): void
  (e: 'saved', nodeId: string): void
  (e: 'error', message: string): void
  (e: 'add-data'): void
}>()

const transport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true
})
const repo = createClient(PipeDocService, transport)
const mapper = createClient(MappingService, transport)

const docs = ref<Array<{ id: string; label: string }>>([])
const selectedId = ref<string | null>(null)
const currentDoc = ref<PipeDoc | null>(null)
const mappedDoc = ref<PipeDoc | null>(null)
const error = ref<string>('')
const searchQuery = ref('')
const addDialog = ref(false)
const newDoc = ref<any>(null)
const workingDoc = ref<any>(null)
const addError = ref('')

const docOptions = computed(() => docs.value)

const loadDocs = async () => {
  try {
    const resp: any = await repo.listPipeDocs(
      { drive: props.drive, connectorId: props.connectorId || '', limit: props.pageSize },
      { headers: { 'x-target-backend': props.repositoryTarget } }
    )
    const items = (resp?.pipedocs ?? []) as Array<any>
    docs.value = items.map((it: any) => ({
      id: it.nodeId,
      label: it.metadata?.title || it.docId || it.nodeId,
    }))
  } catch (e: any) {
    docs.value = []
  }
}

const reloadDocs = () => loadDocs()
const onClearSearch = () => { searchQuery.value = ''; loadDocs() }

watch(searchQuery, () => {
  // Simple debounce
  clearTimeout((loadDocs as any)._t)
  ;(loadDocs as any)._t = setTimeout(loadDocs, 300)
})

watch(selectedId, async (next) => {
  mappedDoc.value = null
  error.value = ''
  if (!next) { currentDoc.value = null; return }
  try {
    const resp: any = await repo.getPipeDoc(
      { nodeId: next },
      { headers: { 'x-target-backend': props.repositoryTarget } }
    )
    currentDoc.value = resp?.pipedoc ?? null
  } catch (e: any) {
    currentDoc.value = null
    error.value = e?.message ?? String(e)
  }
})

const mappingRulesJson = ref<string>(JSON.stringify({ rules: [] }, null, 2))

const runMapping = async () => {
  if (!currentDoc.value) return
  error.value = ''
  emit('run-start')
  try {
    const parsed = JSON.parse(mappingRulesJson.value || '{}')
    const rules = Array.isArray(parsed?.rules) ? parsed.rules : []
    const req: any = { document: currentDoc.value, rules }
    const resp: any = await mapper.applyMapping(
      req,
      { headers: { 'x-target-backend': props.mappingTarget } }
    )
    mappedDoc.value = resp?.document ?? null
    emit('run-complete', resp)
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    emit('error', error.value)
  }
}

const saveResult = async () => {
  if (!mappedDoc.value) return
  try {
    const resp: any = await repo.savePipeDoc(
      { pipedoc: mappedDoc.value, drive: props.drive, connectorId: props.connectorId },
      { headers: { 'x-target-backend': props.repositoryTarget } }
    )
    emit('saved', resp?.nodeId ?? '')
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    emit('error', error.value)
  }
}

onMounted(() => { if (props.autoLoad) loadDocs() })

const openAddDialog = () => {
  addError.value = ''
  newDoc.value = {
    docId: `doc-${Date.now()}`,
    searchMetadata: {
      title: 'New Document',
      body: 'Sample body',
      sourceMimeType: 'text/plain'
    }
  }
  // Defer open to next tick to avoid focus trap bounce
  requestAnimationFrame(() => { addDialog.value = true })
}

const onDocUpdate = (updated: any) => { workingDoc.value = updated }

const saveNewDoc = async () => {
  addError.value = ''
  try {
    const docToSave = workingDoc.value || newDoc.value
    const resp: any = await repo.savePipeDoc(
      { pipedoc: docToSave, drive: props.drive, connectorId: props.connectorId },
      { headers: { 'x-target-backend': props.repositoryTarget } }
    )
    addDialog.value = false
    await loadDocs()
    const id = resp?.nodeId
    if (id) selectedId.value = id
  } catch (e: any) {
    addError.value = e?.message ?? String(e)
  }
}
</script>

<style scoped>
.text-right { text-align: right; }
</style>
