# Task: Frontend Performance Optimization

## Objective
Optimize frontend performance focusing on bundle size, lazy loading, streaming efficiency, and rendering performance.

## Context

**Current Performance:**
- Vite build shows warnings: "Some chunks are larger than 500 kB"
- All routes loaded eagerly (no code splitting)
- Large Vuetify component library included globally
- No bundle analysis or size tracking
- Streaming updates may cause excessive re-renders

**Target Metrics:**
- Initial load: < 200 KB (gzipped)
- Time to interactive: < 3 seconds
- Lighthouse score: > 90
- Bundle size warning threshold: 500 KB

## Requirements

### 1. Bundle Analysis and Monitoring

**Add bundle analyzer:**

```typescript
// apps/pipestream-frontend/ui/vite.config.ts

import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    vuetify(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-vuetify': ['vuetify'],
          'vendor-grpc': [
            '@connectrpc/connect',
            '@connectrpc/connect-web',
            '@bufbuild/protobuf'
          ],
          'vendor-jsonforms': [
            '@jsonforms/core',
            '@jsonforms/vue',
            '@jsonforms/vue-vuetify'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
```

### 2. Route-Based Code Splitting

**Update router to lazy-load all route components:**

```typescript
// apps/pipestream-frontend/ui/src/router/index.ts

const routes = [
  {
    path: '/',
    component: () => import('@/pages/HomePage.vue')  // Lazy
  },
  {
    path: '/health',
    component: () => import('@/pages/HealthPage.vue')  // Lazy
  },
  {
    path: '/account',
    component: () => import('@/services/account-manager/src/App.vue'),  // Lazy
    children: [
      {
        path: '',
        component: () => import('@/services/account-manager/src/views/AccountListView.vue')
      }
    ]
  }
  // ... all routes should be lazy-loaded
]
```

**Add loading indicator:**

```vue
<!-- App.vue -->
<template>
  <v-app>
    <Suspense>
      <template #default>
        <router-view />
      </template>
      <template #fallback>
        <v-container class="fill-height">
          <v-row align="center" justify="center">
            <v-progress-circular indeterminate color="primary" />
          </v-row>
        </v-container>
      </template>
    </Suspense>
  </v-app>
</template>
```

### 3. Component Lazy Loading

**Lazy-load heavy components:**

```vue
<script setup lang="ts">
// Instead of:
import MappingWorkbench from '@/components/MappingWorkbench.vue'

// Use:
const MappingWorkbench = defineAsyncComponent(() =>
  import('@/components/MappingWorkbench.vue')
)
</script>
```

### 4. Vuetify Tree Shaking

**Import only used components:**

```typescript
// apps/pipestream-frontend/ui/src/plugins/vuetify.ts

import { createVuetify } from 'vuetify'

// Instead of importing all components:
import * as components from 'vuetify/components'

// Import only what you use:
import {
  VApp,
  VMain,
  VContainer,
  VRow,
  VCol,
  VBtn,
  VIcon,
  VCard,
  VList,
  VListItem,
  VTable,
  VTextField,
  VSelect,
  // ... only the components you actually use
} from 'vuetify/components'

export default createVuetify({
  components: {
    VApp,
    VMain,
    VContainer,
    // ... explicit list
  }
})
```

### 5. Streaming Optimization

**Debounce rapid updates:**

```typescript
// In serviceRegistry.ts

import { debounce } from 'lodash-es'  // Or implement simple debounce

// Current: Updates on every stream event
for await (const response of client.watchServices(...)) {
  availableServices.value = new Set(...)  // ❌ May cause many re-renders
}

// Optimized: Batch updates
const pendingUpdates = new Set<string>()

const flushUpdates = debounce(() => {
  availableServices.value = new Set(pendingUpdates)
  pendingUpdates.clear()
}, 100)  // Wait 100ms to batch updates

for await (const response of client.watchServices(...)) {
  for (const service of response.services) {
    if (service.isHealthy) {
      pendingUpdates.add(service.serviceName)
    }
  }
  flushUpdates()
}
```

**Use shallowRef for large objects:**

```typescript
// Instead of deep reactive
const availableServices = ref<Set<string>>(new Set())

// Use shallow for better performance
const availableServices = shallowRef<Set<string>>(new Set())

// When updating, create new Set (not mutate)
availableServices.value = new Set([...newServices])
```

### 6. Virtual Scrolling for Long Lists

**For service/module lists with many items:**

```vue
<template>
  <!-- Instead of v-for on all items -->
  <v-virtual-scroll
    :items="services"
    :height="600"
    item-height="64"
  >
    <template v-slot:default="{ item }">
      <ServiceListItem :service="item" />
    </template>
  </v-virtual-scroll>
</template>
```

### 7. Image and Asset Optimization

**Optimize imports:**

```typescript
// Lazy-load images
<img :src="logoUrl" loading="lazy" />

// Use WebP with fallback
<picture>
  <source srcset="/assets/logo.webp" type="image/webp">
  <img src="/assets/logo.png" alt="Logo">
</picture>

// Inline small SVGs
import LogoSvg from '@/assets/logo.svg?raw'
```

**Configure Vite for asset optimization:**

```typescript
export default defineConfig({
  build: {
    assetsInlineLimit: 4096,  // Inline assets < 4KB
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false  // Disable in production
  }
})
```

### 8. Memoization and Caching

**Cache expensive computations:**

```typescript
import { computed, ref } from 'vue'

// Expensive filtering/sorting
const filteredServices = computed(() => {
  return services.value
    .filter(s => s.isHealthy)
    .sort((a, b) => a.name.localeCompare(b.name))
})

// Use useMemo for complex calculations
import { useMemo } from '@vueuse/core'

const statistics = useMemo(() => {
  // Complex calculation here
  return computeServiceStatistics(services.value)
})
```

### 9. Web Workers for Heavy Tasks

**Offload JSON schema generation:**

```typescript
// packages/protobuf-forms/src/worker/schema-generator.worker.ts

self.addEventListener('message', (event) => {
  const { messageType } = event.data

  // Generate schema in worker thread
  const schema = messageToJsonSchema(messageType)

  self.postMessage({ schema })
})
```

**Use in component:**

```typescript
const worker = new Worker(
  new URL('./worker/schema-generator.worker.ts', import.meta.url),
  { type: 'module' }
)

worker.postMessage({ messageType: AccountSchema })

worker.addEventListener('message', (event) => {
  const { schema } = event.data
  // Use schema
})
```

### 10. Preloading and Prefetching

**Preload critical resources:**

```html
<!-- index.html -->
<link rel="preload" href="/assets/logo.svg" as="image">
<link rel="preconnect" href="http://localhost:38106">
```

**Prefetch likely navigations:**

```typescript
// Prefetch route when user hovers over nav item
const prefetchRoute = (routeName: string) => {
  router.resolve({ name: routeName }).then(resolved => {
    if (resolved.matched[0]?.components) {
      // Trigger component lazy load
    }
  })
}
```

## Deliverables

1. **Vite config updates:**
   - Bundle analyzer integration
   - Manual chunks for vendor splitting
   - Asset optimization

2. **Router optimizations:**
   - All routes lazy-loaded
   - Loading states with Suspense
   - Route-based code splitting

3. **Component optimizations:**
   - Lazy-load heavy components
   - Virtual scrolling for lists
   - Memoized computed properties

4. **Streaming optimizations:**
   - Debounced updates
   - Shallow reactivity where appropriate
   - Deduplication logic

5. **Vuetify tree-shaking:**
   - Explicit component imports
   - Reduced bundle size

6. **Performance monitoring:**
   - Bundle size tracking in CI
   - Lighthouse CI integration
   - Performance budget alerts

7. **Documentation:**
   - Performance best practices
   - Bundle analysis guide
   - Optimization checklist

## Success Criteria

- [ ] Initial bundle < 200 KB gzipped
- [ ] Largest chunk < 500 KB
- [ ] Time to interactive < 3s
- [ ] Lighthouse score > 90
- [ ] No layout shift on navigation
- [ ] Smooth scrolling with 100+ items
- [ ] Stream updates don't cause jank

## Measurement

**Before optimization:**
```bash
pnpm run build
du -sh apps/pipestream-frontend/public/assets/*.js
```

**After optimization:**
```bash
pnpm run build
du -sh apps/pipestream-frontend/public/assets/*.js
# Should see reduction
```

**Lighthouse:**
```bash
npm install -g @lhci/cli
lhci autorun --config=lighthouserc.json
```

## Notes

- Measure before optimizing (don't guess)
- Focus on user-perceived performance
- Balance bundle size vs runtime performance
- Don't over-optimize - readability matters
- Test on slow connections (throttle to 3G)
