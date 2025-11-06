<template>
  <div class="pa-6">
    <h2 class="text-h5 mb-4 d-flex align-center">
      <v-icon class="mr-2">mdi-puzzle</v-icon>
      Modules
    </h2>
    <ModuleConfigPanel :initial-module="route.params.name as string | undefined" />
  </div>
</template>

<script setup lang="ts">
import { ModuleConfigPanel } from '@io-pipeline/shared-components'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
</style>
