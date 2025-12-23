<template>
  <v-row>
    <v-col cols="12" md="4">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Index Stats</v-card-title>
        <v-card-text>
          <div class="stat"><span class="label">Total Documents</span><span class="value">{{ stats.documents.toLocaleString() }}</span></div>
          <div class="stat"><span class="label">Total Indices</span><span class="value">{{ stats.indices }}</span></div>
          <div class="stat"><span class="label">Vector Fields</span><span class="value">{{ stats.vectorFields }}</span></div>
          <div class="stat"><span class="label">Storage Size</span><span class="value">{{ stats.size }}</span></div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="8">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Recent Indices (mock)</v-card-title>
        <v-card-text>
          <v-list density="comfortable">
            <v-list-item v-for="idx in indices" :key="idx.name" :title="idx.name" :subtitle="`${idx.count} docs • ${idx.size}`">
              <template #prepend>
                <v-avatar color="secondary" size="28"><v-icon>mdi-database-outline</v-icon></v-avatar>
              </template>
              <template #append>
                <v-chip size="small" color="grey">{{ idx.status }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { reactive } from 'vue'
const stats = reactive({ documents: 128734, indices: 12, vectorFields: 7, size: '2.4 GB' })
const indices = reactive([
  { name: 'pipedoc-main', count: 56789, size: '860 MB', status: 'green' },
  { name: 'pipedoc-chunks', count: 32340, size: '620 MB', status: 'yellow' },
  { name: 'embedder-vectors', count: 39876, size: '920 MB', status: 'green' }
])
</script>

<style scoped>
.stat { display: flex; justify-content: space-between; margin: 8px 0; }
.label { color: #666; }
.value { font-weight: 600; }
</style>

