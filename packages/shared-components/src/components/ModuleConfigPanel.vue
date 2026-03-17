<template>
  <div class="pa-4">
    <v-row class="mb-4" align="center" no-gutters>
      <v-col cols="12" md="6" class="pr-md-2">
        <v-select
          v-model="selectedModule"
          :items="moduleItems"
          item-title="title"
          item-value="value"
          label="Select Module"
          density="comfortable"
          variant="outlined"
          :loading="loadingModules"
          :disabled="loadingModules"
          prepend-inner-icon="mdi-puzzle"
        />
      </v-col>
      <v-col cols="12" md="6" class="pl-md-2 d-flex">
        <v-spacer />
        <v-btn
          color="primary"
          :loading="loadingSchema"
          :disabled="!selectedModule"
          @click="loadSchema()"
          prepend-icon="mdi-cog"
        >
          Load Config
        </v-btn>
      </v-col>
    </v-row>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <UniversalConfigCard
      v-if="schema"
      :schema="schema"
      :initial-data="config"
      @data-change="onDataChange"
    />

    <v-empty-state
      v-else
      icon="mdi-information-outline"
      headline="No module selected"
      text="Pick a module to view its configuration form"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { shellClient } from '../services/connect'
import { UniversalConfigCard } from '..'

type ModuleItem = { title: string; value: string }

const props = defineProps<{ initialModule?: string }>()

const loadingModules = ref(false)
const loadingSchema = ref(false)
const error = ref('')

const modules = ref<string[]>([])
const selectedModule = ref('')
const moduleItems = computed<ModuleItem[]>(() => modules.value.map((m: string) => ({ title: m, value: m })))

const schema = ref<any | null>(null)
const config = ref<any>({})

onMounted(async () => {
  await loadModules()
})

async function loadModules() {
  loadingModules.value = true
  error.value = ''
  try {
    const resp = await shellClient.listUiModules({})
    const list = resp.moduleNames || []
    modules.value = list
    if (props.initialModule && list.includes(props.initialModule)) {
      selectedModule.value = props.initialModule
      await loadSchema()
    } else if (list.length > 0 && !selectedModule.value) {
      selectedModule.value = list[0]
      await loadSchema()
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loadingModules.value = false
  }
}

async function loadSchema() {
  if (!selectedModule.value) return
  loadingSchema.value = true
  error.value = ''
  try {
    const resp = await shellClient.getUiModuleConfigSchema({
      moduleName: selectedModule.value
    })
    if (!resp || !resp.jsonConfigSchema) {
      throw new Error('Module did not provide a configuration schema')
    }
    schema.value = JSON.parse(resp.jsonConfigSchema as string)
    config.value = {}
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    schema.value = null
  } finally {
    loadingSchema.value = false
  }
}

function onDataChange(data: any) {
  config.value = data
}

// Auto-reload schema when module changes
watch(selectedModule, async (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    await loadSchema()
  }
})
</script>

<style scoped>
</style>
