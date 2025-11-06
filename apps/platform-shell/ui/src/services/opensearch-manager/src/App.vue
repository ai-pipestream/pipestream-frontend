<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable" dark>
      <v-app-bar-title>OpenSearch Manager</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <v-tabs v-model="tab" align-tabs="start">
          <v-tab value="search">Search</v-tab>
          <v-tab value="stats">Stats</v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab" class="mt-4">
          <v-tabs-window-item value="search">
            <SearchTab />
          </v-tabs-window-item>
          <v-tabs-window-item value="stats">
            <StatsTab />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import SearchTab from './components/SearchTab.vue'
import StatsTab from './components/StatsTab.vue'

const tab = ref('search')
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
</style>
