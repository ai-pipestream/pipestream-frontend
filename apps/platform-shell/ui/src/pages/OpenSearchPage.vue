<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-2">
      <v-icon class="mr-2">mdi-magnify</v-icon>
      <h2 class="text-h5">OpenSearch Manager</h2>
    </div>

    <v-tabs v-model="tab" density="comfortable">
      <v-tab value="search">Search</v-tab>
      <v-tab value="stats">Stats</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab" class="mt-4">
      <v-tabs-window-item value="search">
        <SearchPanel target="repository-service" />
      </v-tabs-window-item>
      <v-tabs-window-item value="stats">
        <v-row>
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">Index Stats</v-card-title>
              <v-card-text>
                <div class="stat"><span class="label">Total Documents</span><span class="value">128,734</span></div>
                <div class="stat"><span class="label">Total Indices</span><span class="value">12</span></div>
                <div class="stat"><span class="label">Vector Fields</span><span class="value">7</span></div>
                <div class="stat"><span class="label">Storage Size</span><span class="value">2.4 GB</span></div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="8">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">Recent Indices</v-card-title>
              <v-card-text>
                <v-list density="comfortable">
                  <v-list-item title="pipedoc-main" subtitle="56,789 docs • 860 MB">
                    <template #prepend>
                      <v-avatar color="secondary" size="28"><v-icon>mdi-database-outline</v-icon></v-avatar>
                    </template>
                    <template #append>
                      <v-chip size="small" color="success">green</v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item title="pipedoc-chunks" subtitle="32,340 docs • 620 MB">
                    <template #prepend>
                      <v-avatar color="secondary" size="28"><v-icon>mdi-database-outline</v-icon></v-avatar>
                    </template>
                    <template #append>
                      <v-chip size="small" color="warning">yellow</v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item title="embedder-vectors" subtitle="39,876 docs • 920 MB">
                    <template #prepend>
                      <v-avatar color="secondary" size="28"><v-icon>mdi-database-outline</v-icon></v-avatar>
                    </template>
                    <template #append>
                      <v-chip size="small" color="success">green</v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
  
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SearchPanel } from '@io-pipeline/shared-components'
const tab = ref('search')
</script>

<style scoped>
.stat { display: flex; justify-content: space-between; margin: 8px 0; }
.label { color: #666; }
.value { font-weight: 600; }
</style>
