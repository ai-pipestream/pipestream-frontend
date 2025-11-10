<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5 mr-4">Links</h2>
      <v-spacer />
      
      <!-- Search Field -->
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Search links..."
        variant="outlined"
        density="compact"
        hide-details
        single-line
        clearable
        style="max-width: 300px;"
      />
      
      <!-- Refresh Button -->
      <v-btn
        @click="refreshLinks"
        :loading="refreshing"
        variant="outlined"
        size="small"
        class="ml-2"
      >
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Category Tabs -->
    <v-tabs v-model="selectedCategory" class="mb-4">
      <v-tab value="all">All ({{ filteredLinks.length }})</v-tab>
      <v-tab 
        v-for="category in categories" 
        :key="category" 
        :value="category"
      >
        {{ formatCategory(category) }} ({{ getLinksByCategory(category).length }})
      </v-tab>
    </v-tabs>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" density="compact" closable>
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <div v-if="loading && allLinks.length === 0" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" class="mb-4" />
      <div class="text-body-2">Loading links...</div>
    </div>

    <!-- No results -->
    <div v-else-if="filteredLinks.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-link-off</v-icon>
      <div class="text-h6 mb-2">No links found</div>
      <div class="text-body-2">Try adjusting your search or category filter</div>
    </div>

    <!-- Links Grid -->
    <v-row v-else>
      <v-col 
        v-for="link in filteredLinks" 
        :key="`${link.category}-${link.title}`" 
        cols="12" 
        md="6" 
        lg="4"
      >
        <v-card 
          :href="link.href" 
          :target="link.external ? '_blank' : '_self'" 
          :rel="link.external ? 'noopener' : ''"
          class="mb-4" 
          variant="tonal"
          :color="getCategoryColor(link.category)"
          hover
        >
          <v-card-title class="d-flex align-center">
            <v-icon :icon="link.icon" class="mr-2" />
            {{ link.title }}
            
            <v-spacer />
            
            <!-- External link indicator -->
            <v-icon 
              v-if="link.external" 
              size="small" 
              color="grey"
            >
              mdi-open-in-new
            </v-icon>
            
            <!-- Dynamic link indicator -->
            <v-chip 
              v-if="link.isDynamic" 
              size="x-small" 
              variant="outlined" 
              color="info"
              class="ml-1"
            >
              DYNAMIC
            </v-chip>
            
            <!-- Disabled indicator -->
            <v-chip 
              v-if="link.disabled" 
              size="x-small" 
              variant="outlined" 
              color="warning"
              class="ml-1"
            >
              UNAVAILABLE
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <div class="text-body-2 mb-2">{{ link.description }}</div>
            
            <!-- Category badge -->
            <v-chip 
              size="small" 
              variant="flat" 
              :color="getCategoryColor(link.category)"
              class="text-capitalize"
            >
              {{ formatCategory(link.category) }}
            </v-chip>
            
            <!-- Status indicator -->
            <v-chip 
              v-if="link.status"
              size="small" 
              variant="outlined" 
              :color="getStatusColor(link.status)"
              class="ml-2"
            >
              {{ link.status }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { NavItem } from '@ai-pipestream/shared-nav'
import { getInfraUrl } from '../config/infrastructure'

interface LinkItem {
  title: string
  href: string
  icon: string
  description: string
  category: string
  external?: boolean
  isDynamic?: boolean
  disabled?: boolean
  status?: string
}

// Reactive state
const searchQuery = ref('')
const selectedCategory = ref('all')
const loading = ref(false)
const refreshing = ref(false)
const error = ref<string | null>(null)
const allLinks = ref<LinkItem[]>([])

// Static links that are always available
const staticLinks: LinkItem[] = [
  {
    title: 'Traefik Dashboard',
    href: getInfraUrl('traefik'),
    icon: 'mdi-router-network',
    description: 'Edge router dashboard and load balancer configuration',
    category: 'infrastructure',
    external: true
  },
  {
    title: 'Consul UI',
    href: getInfraUrl('consul'),
    icon: 'mdi-server',
    description: 'Service discovery, health checking, and configuration',
    category: 'infrastructure',
    external: true
  },
  {
    title: 'Apicurio Registry UI',
    href: getInfraUrl('apicurio'),
    icon: 'mdi-file-code',
    description: 'Schema registry for Kafka protobuf schemas',
    category: 'infrastructure',
    external: true
  },
  {
    title: 'Kafka UI',
    href: getInfraUrl('kafka'),
    icon: 'mdi-message-text',
    description: 'Topic browser, consumers, and message streaming',
    category: 'messaging',
    external: true
  },
  {
    title: 'OpenSearch Dashboards',
    href: getInfraUrl('opensearch'),
    icon: 'mdi-magnify',
    description: 'Cluster state, index management, and data explorer',
    category: 'search',
    external: true
  },
  {
    title: 'MinIO Console',
    href: getInfraUrl('minio'),
    icon: 'mdi-database',
    description: 'Object storage browser and bucket management',
    category: 'storage',
    external: true
  }
]

// Computed properties
const categories = computed(() => {
  const cats = new Set(allLinks.value.map(link => link.category))
  return Array.from(cats).sort()
})

const filteredLinks = computed(() => {
  let links = allLinks.value

  // Filter by category
  if (selectedCategory.value !== 'all') {
    links = links.filter(link => link.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    links = links.filter(link => 
      link.title.toLowerCase().includes(query) ||
      link.description.toLowerCase().includes(query) ||
      link.category.toLowerCase().includes(query)
    )
  }

  return links
})

// Methods
const getLinksByCategory = (category: string): LinkItem[] => {
  return allLinks.value.filter(link => link.category === category)
}

const formatCategory = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    infrastructure: 'blue-lighten-4',
    services: 'green-lighten-4',
    messaging: 'orange-lighten-4',
    search: 'purple-lighten-4',
    storage: 'teal-lighten-4',
    monitoring: 'red-lighten-4',
    documentation: 'grey-lighten-3'
  }
  return colors[category] || 'grey-lighten-3'
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    online: 'success',
    offline: 'error',
    degraded: 'warning',
    unknown: 'grey'
  }
  return colors[status.toLowerCase()] || 'grey'
}

const fetchDynamicLinks = async (): Promise<LinkItem[]> => {
  try {
    console.log('[LinksPage] Fetching dynamic navigation items')
    const response = await fetch('/connect/system-nav/menu-items.json')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const navItems: NavItem[] = await response.json()
    
    // Convert external nav items to links
    const dynamicLinks: LinkItem[] = navItems
      .filter(item => item.href && item.external)
      .map(item => ({
        title: item.title,
        href: item.href!,
        icon: item.icon || 'mdi-link',
        description: `External service: ${item.title}`,
        category: 'services',
        external: true,
        isDynamic: true,
        disabled: item.disabled
      }))
    
    // Also add internal services as documentation links
    const internalLinks: LinkItem[] = navItems
      .filter(item => item.to && !item.external && !['Home', 'Health', 'Links', 'Components', 'Mapping'].includes(item.title))
      .map(item => ({
        title: `${item.title} UI`,
        href: item.to!,
        icon: item.icon || 'mdi-application',
        description: `Internal service UI: ${item.title}`,
        category: 'services',
        external: false,
        isDynamic: true,
        disabled: item.disabled
      }))
    
    return [...dynamicLinks, ...internalLinks]
  } catch (e: any) {
    console.warn('[LinksPage] Failed to fetch dynamic links:', e)
    return []
  }
}

const refreshLinks = async (): Promise<void> => {
  refreshing.value = true
  error.value = null
  
  try {
    const dynamicLinks = await fetchDynamicLinks()
    allLinks.value = [...staticLinks, ...dynamicLinks]
    console.log(`[LinksPage] Loaded ${allLinks.value.length} links (${staticLinks.length} static, ${dynamicLinks.length} dynamic)`)
  } catch (e: any) {
    error.value = `Failed to refresh links: ${e?.message ?? String(e)}`
  } finally {
    refreshing.value = false
  }
}

const loadLinks = async (): Promise<void> => {
  loading.value = true
  await refreshLinks()
  loading.value = false
}

// Watch for category changes and reset to "all" if selected category no longer exists
watch(categories, (newCategories) => {
  if (selectedCategory.value !== 'all' && !newCategories.includes(selectedCategory.value)) {
    selectedCategory.value = 'all'
  }
})

// Initialize
onMounted(() => {
  loadLinks()
})
</script>

<style scoped>
</style>
