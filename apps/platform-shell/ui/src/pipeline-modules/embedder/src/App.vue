<template>
  <v-container fluid>
    <v-card>
      <v-card-title>Embedder Module</v-card-title>
      <v-card-subtitle>Text embedding generation service</v-card-subtitle>
      <v-divider />
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          Embedder module configuration UI - Coming soon
        </v-alert>

        <v-text-area
          label="Test Text"
          placeholder="Enter text to generate embeddings..."
          variant="outlined"
          rows="4"
        />

        <v-btn color="primary" class="mt-2">
          Generate Embeddings
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
// Embedder module component
</script>
