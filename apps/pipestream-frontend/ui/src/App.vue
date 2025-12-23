<template>
  <SystemError v-if="systemError" />
  <NavShell
    v-else
    :title="'Pipeline Platform'"
    :items="navItems"
    :auto-load-menu="false"
    :periodic-refresh-ms="0"
  >
    <router-view />
  </NavShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NavShell } from '@ai-pipestream/shared-nav';
import type { NavItem } from '@ai-pipestream/shared-nav';
import { useServiceRegistryStore } from './stores/serviceRegistry';
import SystemError from './components/SystemError.vue';

const systemError = ref(false);

const serviceRegistry = useServiceRegistryStore();

// Platform navigation items - always visible
const platformItems: NavItem[] = [
  { title: 'Home', icon: 'mdi-home', to: '/' },
  { title: 'Health', icon: 'mdi-heart-pulse', to: '/health' },
  { title: 'Modules', icon: 'mdi-puzzle', to: '/modules' },
  { title: 'Filesystem Connector', icon: 'mdi-folder-upload', to: '/filesystem-connector' },
  { title: 'Links', icon: 'mdi-link-variant', to: '/links' },
  { title: 'Components', icon: 'mdi-view-dashboard', to: '/components' },
];

// Service configuration - only shown if service is available
// Service names must match exactly what Consul returns
const serviceConfig = [
  { service: 'account-manager', path: '/accounts', title: 'Account Manager', icon: 'mdi-account-group' },
  { service: 'connector-service', path: '/admin-connector', title: 'Connectors', icon: 'mdi-power-plug' },
  { service: 'mapping-service', path: '/mapping', title: 'Mapping', icon: 'mdi-map' },
  { service: 'opensearch-manager', path: '/opensearch-manager', title: 'OpenSearch Manager', icon: 'mdi-magnify' },
  { service: 'platform-registration-service', path: '/registration', title: 'Registration', icon: 'mdi-server' },
  { service: 'repository-service', path: '/repository', title: 'Repository', icon: 'mdi-database' },
];

// Pipeline module configuration - only shown if service is available
const pipelineModuleConfig = [
  { service: 'chunker', path: '/modules/chunker', title: 'Chunker', icon: 'mdi-scissors-cutting' },
  { service: 'echo', path: '/modules/echo', title: 'Echo', icon: 'mdi-message-reply-text' },
  { service: 'embedder', path: '/modules/embedder', title: 'Embedder', icon: 'mdi-vector-point' },
  { service: 'parser', path: '/modules/parser', title: 'Parser', icon: 'mdi-file-document-outline' },
];

// Build navigation items dynamically based on available services
const navItems = computed(() => {
  const items: NavItem[] = [...platformItems];

  // Add services as a collapsible group if any are available
  const availableServiceItems = serviceConfig
    .filter(service => serviceRegistry.availableServices.has(service.service))
    .map(service => ({
      title: service.title,
      icon: service.icon,
      to: service.path,
    }));

  if (availableServiceItems.length > 0) {
    items.push({
      title: 'Services',
      icon: 'mdi-cube-outline',
      children: availableServiceItems,
    } as NavItem);
  }

  // Add pipeline modules as a collapsible group if any are available
  const availablePipelineItems = pipelineModuleConfig
    .filter(module => serviceRegistry.availableModules.has(module.service))
    .map(module => ({
      title: module.title,
      icon: module.icon,
      to: module.path,
    }));

  if (availablePipelineItems.length > 0) {
    items.push({
      title: 'Pipeline Modules',
      icon: 'mdi-puzzle',
      children: availablePipelineItems,
    } as NavItem);
  }

  return items;
});

// Check system status on mount
onMounted(async () => {
  try {
    const response = await fetch('/api/system-status');
    const data = await response.json();

    // Show error page if registration service is unavailable
    if (data.registration?.status === 'unavailable') {
      systemError.value = true;
    }
  } catch (error) {
    console.error('Failed to check system status:', error);
    // If we can't even check status, show error page
    systemError.value = true;
  }
});
</script>
