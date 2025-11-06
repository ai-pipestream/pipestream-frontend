<template>
  <v-app>
    <v-app-bar flat density="comfortable">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer />
      <slot name="app-bar-actions" />
      
      <!-- Navigation Refresh Button -->
      <v-btn 
        v-if="autoLoadMenu"
        @click="handleRefresh"
        :loading="refreshing"
        icon
        variant="text"
        size="small"
      >
        <v-icon>mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Refresh Navigation
        </v-tooltip>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" :rail="rail" :permanent="permanent" :expand-on-hover="expandOnHover">
      <div class="pa-2">
        <slot name="drawer-header" />
      </div>
      <v-divider />
  <v-list density="comfortable" nav>
    <template v-for="(item, index) in internalItems" :key="index">
          <v-list-item
            v-if="!item.children || item.children.length === 0"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.to"
            :disabled="item.disabled"
            :href="item.href || (!hasRouter ? item.to : undefined)"
            :to="hasRouter ? item.to || undefined : undefined"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener' : undefined"
          />
          <v-list-group v-else :value="item.title">
            <template #activator="{ props }">
              <v-list-item v-bind="props" :prepend-icon="item.icon" :title="item.title" />
            </template>
            <v-list-item
              v-for="(child, cIndex) in item.children"
              :key="cIndex"
              :prepend-icon="child.icon"
              :title="child.title"
              :value="child.to"
              :disabled="child.disabled"
              :href="child.href || (!hasRouter ? child.to : undefined)"
              :to="hasRouter ? child.to || undefined : undefined"
              :target="child.external ? '_blank' : undefined"
              :rel="child.external ? 'noopener' : undefined"
            />
          </v-list-group>
        </template>
      </v-list>
      <slot name="drawer-footer" />
    </v-navigation-drawer>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { NavShellProps, NavItem } from '../types'

const props = withDefaults(defineProps<NavShellProps>(), {
  title: 'Pipeline Platform',
  items: () => [],
  modelValue: true,
  rail: false,
  permanent: true,
  expandOnHover: false,
  autoLoadMenu: false,
  periodicRefreshMs: 60000 // 60 seconds default
})

const drawer = ref(props.modelValue)
const internalItems = ref<NavItem[]>(props.items)
const refreshing = ref(false)
let periodicTimer: ReturnType<typeof setInterval> | null = null

const rail = computed(() => props.rail)
const permanent = computed(() => props.permanent)
const expandOnHover = computed(() => props.expandOnHover)
// Detect if vue-router is present; fallback to href when not
const hasRouter = computed(() => typeof (globalThis as any).__VUE_ROUTER__ !== 'undefined')

const fetchItemsViaHttp = async (): Promise<NavItem[] | null> => {
  if (!props.itemsUrl) return null
  try {
    const response = await fetch(props.itemsUrl, {
      headers: props.target ? { 'x-target-backend': props.target } : undefined
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    // Expecting [{ title, icon, to|href, external, children }]
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.warn('[NavShell] Failed to fetch items via HTTP', e)
    return null
  }
}

const maybeLoadMenu = async () => {
  if (!props.autoLoadMenu) return
  let loaded: NavItem[] | null = null
  if (props.fetchMenuItems) {
    try {
      loaded = await props.fetchMenuItems(props.target)
    } catch (e) {
      console.warn('[NavShell] fetchMenuItems threw', e)
    }
  }
  if (!loaded) {
    loaded = await fetchItemsViaHttp()
  }
  if (loaded && loaded.length > 0) {
    internalItems.value = loaded
  }
}

const handleRefresh = async () => {
  if (refreshing.value) return
  
  refreshing.value = true
  try {
    await maybeLoadMenu()
  } catch (e) {
    console.warn('[NavShell] Manual refresh failed', e)
  } finally {
    refreshing.value = false
  }
}

const startPeriodicRefresh = () => {
  if (periodicTimer) {
    clearInterval(periodicTimer)
  }
  
  if (props.autoLoadMenu && props.periodicRefreshMs > 0) {
    console.log(`[NavShell] Starting periodic refresh every ${props.periodicRefreshMs}ms`)
    periodicTimer = setInterval(() => {
      if (!refreshing.value) {
        console.log('[NavShell] Periodic refresh triggered')
        maybeLoadMenu()
      }
    }, props.periodicRefreshMs)
  }
}

const stopPeriodicRefresh = () => {
  if (periodicTimer) {
    clearInterval(periodicTimer)
    periodicTimer = null
  }
}

watch(() => props.items, (next) => {
  internalItems.value = next
})

watch(() => props.target, () => {
  maybeLoadMenu()
})

watch(() => [props.autoLoadMenu, props.periodicRefreshMs], () => {
  startPeriodicRefresh()
})

onMounted(() => {
  maybeLoadMenu()
  startPeriodicRefresh()
})

onUnmounted(() => {
  stopPeriodicRefresh()
})

</script>

<style scoped>
</style>
