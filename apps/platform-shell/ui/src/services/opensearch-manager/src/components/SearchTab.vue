<template>
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

      <div v-if="results.length === 0 && !loading && !hasSearched" class="text-center pa-6">
        <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-magnify</v-icon>
        <div class="text-h6 mb-2">Search Indices</div>
        <div class="text-body-2 text-grey">Enter a query to search OpenSearch indices. (Mocked results for now)</div>
      </div>

      <div v-else-if="results.length === 0 && !loading && hasSearched" class="text-center pa-6">
        <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-file-search-outline</v-icon>
        <div class="text-h6 mb-2">No Results Found</div>
        <div class="text-body-2 text-grey">Try a different query.</div>
      </div>

      <v-list v-else lines="two" density="comfortable">
        <v-list-item
          v-for="(r, i) in results"
          :key="i"
          :title="r.title"
          :subtitle="r.snippet"
        >
          <template #prepend>
            <v-avatar color="primary" size="28"><v-icon>mdi-file-search</v-icon></v-avatar>
          </template>
          <template #append>
            <div class="text-caption text-grey">Score: {{ r.score }}</div>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const query = ref('')
const loading = ref(false)
const error = ref('')
const results = ref([])
const hasSearched = ref(false)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runSearch() {
  if (!query.value?.trim()) {
    error.value = 'Please enter a search term'
    return
  }
  error.value = ''
  loading.value = true
  results.value = []
  hasSearched.value = true
  await sleep(400)
  // Mocked results for demo
  const q = query.value.trim()
  results.value = [
    { title: `Matched document for "${q}"`, snippet: 'This is a mocked search result snippet...', score: 1.0 },
    { title: `Another result for "${q}"`, snippet: 'Additional context from OpenSearch...', score: 0.86 }
  ]
  loading.value = false
}
</script>

<style scoped>
</style>

