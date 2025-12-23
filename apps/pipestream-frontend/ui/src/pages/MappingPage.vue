<template>
  <div class="pa-6">
    <h2 class="text-h5 mb-4">Mapping Workbench</h2>
    <MappingWorkbench @add-data="() => $router.push('/repository')" />
  </div>
</template>

<script setup lang="ts">
import { MappingWorkbench } from '@ai-pipestream/shared-components'
</script>

<style scoped>
</style>
