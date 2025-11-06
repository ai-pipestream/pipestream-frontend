<template>
  <div class="protobuf-form-disabled">
    <v-alert type="warning" variant="tonal">
      ProtobufForm temporarily disabled during dependency refactor
    </v-alert>
  </div>
</template>

<script setup lang="ts">
// Temporarily disabled - will implement direct protobuf → Vue rendering later
interface Props {
  messageType: string
  modelValue: any
  uischema?: any
  options?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
</script>
