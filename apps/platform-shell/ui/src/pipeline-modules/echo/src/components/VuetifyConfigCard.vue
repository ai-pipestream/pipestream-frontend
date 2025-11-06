<template>
  <div class="vuetify-config-card">
    <h3>Vuetify Configuration Card (Alpha)</h3>

    <!-- Schema-based rendering with JSONForms -->
    <div class="jsonforms-container" v-if="schema">
      <JsonForms
        :data="data"
        :schema="schema"
        :uischema="uischema"
        :renderers="renderers"
        @change="handleChange"
      />
    </div>

    <!-- Fallback key/value editor when no schema -->
    <div v-else class="kv-editor">
      <v-row class="kv-header">
        <v-col cols="8">
          <p class="no-schema-message">No schema provided - using key/value editor</p>
        </v-col>
        <v-col cols="4" class="text-right">
          <v-btn @click="addRow" color="primary" size="small">+ Add Entry</v-btn>
        </v-col>
      </v-row>

      <v-row v-for="(entry, index) in kvEntries" :key="index" class="kv-row">
        <v-col cols="5">
          <v-text-field
            v-model="entry.key"
            @input="updateKvData"
            label="Key"
            dense
            outlined
          ></v-text-field>
        </v-col>
        <v-col cols="5">
          <v-text-field
            v-model="entry.value"
            @input="updateKvData"
            label="Value"
            dense
            outlined
          ></v-text-field>
        </v-col>
        <v-col cols="2" class="text-right">
          <v-btn @click="removeRow(index)" icon small>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <div v-if="kvEntries.length === 0" class="empty-state">
        No configuration entries. Click "Add Entry" to start.
      </div>
    </div>

    <div class="config-output">
      <h4>Current Configuration:</h4>
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, markRaw } from 'vue'
import { JsonForms } from '@jsonforms/vue'
import { extendedVuetifyRenderers } from '@jsonforms/vue-vuetify'

interface KeyValueEntry {
  key: string
  value: string
}

const props = defineProps<{
  schema?: any
  initialData?: any
}>()

const emit = defineEmits<{
  'data-change': [data: any]
}>()

const data = ref(props.initialData || {})
const renderers = Object.freeze(markRaw([
  ...extendedVuetifyRenderers,
]))
const kvEntries = ref<KeyValueEntry[]>([])

const uischema = computed(() => {
  if (!props.schema || !props.schema.properties) {
    return undefined
  }
  const elements = Object.keys(props.schema.properties).map(key => ({
    type: 'Control',
    scope: `#/properties/${key}`
  }))
  return {
    type: 'VerticalLayout',
    elements
  }
})

const initializeKvEntries = () => {
  if (!props.schema && props.initialData && Object.keys(props.initialData).length > 0) {
    kvEntries.value = Object.entries(props.initialData).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  } else if (!props.schema && kvEntries.value.length === 0) {
    kvEntries.value = [{ key: '', value: '' }]
  }
}

watch(() => props.schema, (newSchema) => {
  if (newSchema) {
    data.value = { ...(props.initialData || {}) }
  } else {
    data.value = props.initialData || {}
    initializeKvEntries()
  }
}, { immediate: true })

watch(() => props.initialData, (newData) => {
  if (!props.schema && newData) {
    kvEntries.value = Object.entries(newData).map(([key, value]) => ({
      key,
      value: String(value)
    }))
    data.value = newData
  }
})

onMounted(() => {
  if (!props.schema) {
    initializeKvEntries()
  }
})

const handleChange = (event: any) => {
  data.value = event.data
  emit('data-change', event.data)
}

const addRow = () => {
  kvEntries.value.push({ key: '', value: '' })
}

const removeRow = (index: number) => {
  kvEntries.value.splice(index, 1)
  updateKvData()
}

const updateKvData = () => {
  const kvData: Record<string, string> = {}
  kvEntries.value.forEach(entry => {
    if (entry.key.trim()) {
      kvData[entry.key] = entry.value
    }
  })
  data.value = kvData
  emit('data-change', kvData)
}
</script>

<style scoped>
@import '@jsonforms/vue-vuetify/lib/jsonforms-vue-vuetify.css';

.vuetify-config-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.config-output {
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.no-schema-message {
  color: #666;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
