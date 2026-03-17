<template>
  <div>
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-magnify</v-icon>
        Search
        <v-spacer />
        <v-text-field
          v-model="query"
          density="comfortable"
          placeholder="Search..."
          clearable
          @keyup.enter="runSearch"
          style="max-width: 420px"
        />
        <v-btn color="primary" class="ml-2" @click="runSearch" :loading="loading">Search</v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" density="comfortable" class="mb-3" closable>{{ error }}</v-alert>
        
        <!-- Empty state when no search has been performed -->
        <div v-if="results.length === 0 && !loading && !hasSearched" class="text-center pa-6">
          <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-magnify</v-icon>
          <div class="text-h6 mb-2">Search Documents</div>
          <div class="text-body-2 text-grey">Enter a search term above to find documents in the repository</div>
        </div>
        
        <!-- No results after search -->
        <div v-else-if="results.length === 0 && !loading && hasSearched" class="text-center pa-6">
          <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-file-search-outline</v-icon>
          <div class="text-h6 mb-2">No Results Found</div>
          <div class="text-body-2 text-grey">No documents match your search criteria</div>
        </div>
        <v-list v-else lines="two" density="comfortable">
          <v-list-item
            v-for="(r, i) in results"
            :key="i"
            :title="r.title || r.path || r.id || 'Result'"
            :subtitle="r.snippet || r.description || r.path"
          >
            <template #prepend>
              <v-avatar color="primary" size="28"><v-icon>mdi-file-search</v-icon></v-avatar>
            </template>
            <template #append>
              <div class="text-caption text-grey">Score: {{ r.score ?? '-' }}</div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
  
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { shellClient } from '../services/connect'

interface Props {
  connectorId?: string
}

const props = withDefaults(defineProps<Props>(), {
  connectorId: '',
})

const query = ref('')
const loading = ref(false)
const error = ref('')
const results = ref<Array<any>>([])
const hasSearched = ref(false)

async function runSearch() {
  if (!query.value?.trim()) {
    error.value = 'Please enter a search term'
    return
  }
  
  error.value = ''
  loading.value = true
  results.value = []
  hasSearched.value = true
  
  try {
    const resp = await shellClient.searchDocuments({
      query: query.value,
      pageSize: 50,
      connectorId: props.connectorId
    })
    
    results.value = (resp.results || []).map((it: any) => ({
      id: it.docId,
      title: it.filename || it.docId,
      path: it.path,
      score: it.score,
      mimeType: it.mimeType,
      accountId: it.accountId
    }))
  } catch (e: any) {
    error.value = `Search failed: ${e?.message || String(e)}`
    console.warn('[SearchPanel] Search error:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
</style>
