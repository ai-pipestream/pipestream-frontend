# Task: Graceful Service Unavailability Handling

## Objective
Improve UX when services go down by keeping navigation visible but disabled, and showing a user-friendly "site dusting" page instead of making menu items disappear entirely.

## Context

**Current Behavior:**
- When a service becomes unavailable, its menu item disappears from navigation
- Users don't know if the service exists or is just down
- No visual feedback about service status
- Menu "jumps" as items appear/disappear

**Desired Behavior:**
- Well-known services and modules stay visible even when down
- Unavailable items are greyed out/disabled
- Clicking disabled item shows "Service Temporarily Unavailable" page
- Status indicator shows health (green dot = up, red dot = down, yellow = unknown)
- Navigation is stable (doesn't reorganize when services change state)

**Files Involved:**
- `apps/platform-shell/ui/src/stores/serviceRegistry.ts` - Tracks available services
- `apps/platform-shell/src/index.ts` - Backend generates nav items (line 65-262)
- `packages/shared-nav/src/components/AppShell.vue` - Navigation shell
- Navigation state managed by service discovery streams

## Requirements

### 1. Service Availability Model

**Update serviceRegistry store:**

```typescript
// Current: just a Set<string> of available services
const availableServices = ref<Set<string>>(new Set())

// New: track service details with health status
interface ServiceStatus {
  name: string
  displayName: string
  kind: 'SERVICE' | 'MODULE' | 'INFRA'
  isAvailable: boolean       // Currently reachable
  isKnownService: boolean    // Part of core platform
  lastSeen?: Date
  healthStatus: 'SERVING' | 'NOT_SERVING' | 'UNKNOWN' | 'UNREACHABLE'
}

const services = ref<Map<string, ServiceStatus>>(new Map())
```

**Define "well-known" services:**
```typescript
// Services that should always appear in nav
const CORE_SERVICES = [
  'platform-registration-service',
  'repository-service',
  'account-manager',
  'connector-service',
  'mapping-service',
  'opensearch-manager'
]

const CORE_MODULES = [
  // Define core modules if any
]
```

### 2. Navigation Item Enhancement

**Update nav item generation (`apps/platform-shell/src/index.ts`):**

**Current (disappearing items):**
```typescript
const serviceNavChildren = sortEntries(groups.services).map(entry => ({
  title: entry.displayName,
  icon: 'mdi-cube',
  to: entry.targetHint,
  disabled: !entry.resolvable  // ❌ These get filtered out
}))
```

**New (persistent items with status):**
```typescript
interface NavItem {
  title: string
  icon: string
  to?: string
  href?: string
  external?: boolean
  disabled: boolean
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown'
  statusIcon?: string
  statusColor?: string
  tooltip?: string  // "Service unavailable" or "Last seen: 2m ago"
}

const serviceNavChildren = sortEntries(groups.services).map(entry => {
  const isKnown = CORE_SERVICES.includes(entry.name)
  const isAvailable = entry.resolvable

  return {
    title: entry.displayName,
    icon: 'mdi-cube',
    to: entry.targetHint,
    disabled: !isAvailable,
    healthStatus: isAvailable ? 'healthy' : 'unhealthy',
    statusIcon: isAvailable ? 'mdi-circle' : 'mdi-circle-outline',
    statusColor: isAvailable ? 'success' : 'error',
    tooltip: isAvailable
      ? `${entry.displayName} is running`
      : `${entry.displayName} is currently unavailable`,
    // Keep in nav if it's a core service OR currently available
    _showInNav: isKnown || isAvailable
  }
}).filter(item => item._showInNav)
```

### 3. Navigation UI Updates

**Update AppShell to show health indicators:**

```vue
<!-- packages/shared-nav/src/components/AppShell.vue -->
<template>
  <v-list-item
    :to="item.to"
    :disabled="item.disabled"
    :class="{ 'service-unavailable': item.disabled }"
  >
    <!-- Status indicator dot -->
    <template v-slot:prepend>
      <v-icon :color="item.statusColor" size="x-small" class="mr-2">
        {{ item.statusIcon }}
      </v-icon>
      <v-icon :icon="item.icon" />
    </template>

    <v-list-item-title>
      {{ item.title }}
    </v-list-item-title>

    <!-- Tooltip on hover -->
    <v-tooltip activator="parent" location="right">
      {{ item.tooltip }}
    </v-tooltip>
  </v-list-item>
</template>

<style scoped>
.service-unavailable {
  opacity: 0.5;
}
.service-unavailable:hover {
  opacity: 0.7;
}
</style>
```

### 4. "Site Dusting" Error Page

**Create `apps/platform-shell/ui/src/pages/ServiceUnavailablePage.vue`:**

```vue
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <v-icon size="120" color="warning" class="mb-4">
          mdi-tools
        </v-icon>

        <h1 class="text-h3 mb-4">Service Temporarily Unavailable</h1>

        <p class="text-h6 text-medium-emphasis mb-6">
          {{ serviceName }} is currently undergoing maintenance or is temporarily offline.
        </p>

        <v-alert type="info" variant="tonal" class="mb-6 text-left">
          <v-alert-title>What's happening?</v-alert-title>
          <p class="mb-2">
            The {{ serviceName }} service is not responding. This could be due to:
          </p>
          <ul>
            <li>Scheduled maintenance</li>
            <li>Service restart or deployment</li>
            <li>Temporary network issues</li>
          </ul>
        </v-alert>

        <div class="mb-4">
          <p class="text-caption text-medium-emphasis mb-2">
            Last checked: {{ lastChecked }}
          </p>
          <v-progress-linear
            v-if="isRetrying"
            indeterminate
            color="primary"
            class="mb-2"
          />
        </div>

        <v-btn
          color="primary"
          @click="retryConnection"
          :loading="isRetrying"
        >
          <v-icon left>mdi-refresh</v-icon>
          Retry Connection
        </v-btn>

        <v-btn
          variant="text"
          to="/"
          class="ml-2"
        >
          Return Home
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useServiceRegistryStore } from '@/stores/serviceRegistry'

const route = useRoute()
const router = useRouter()
const serviceRegistry = useServiceRegistryStore()

const serviceName = computed(() => route.params.serviceName as string || 'This service')
const lastChecked = ref(new Date().toLocaleTimeString())
const isRetrying = ref(false)

const retryConnection = async () => {
  isRetrying.value = true
  lastChecked.value = new Date().toLocaleTimeString()

  // Wait for service registry to update (it's streaming)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Check if service is now available
  const isAvailable = serviceRegistry.availableServices.has(serviceName.value)

  if (isAvailable) {
    // Service is back - navigate to it
    router.push(route.query.returnTo as string || '/')
  } else {
    isRetrying.value = false
  }
}

// Auto-retry every 10 seconds
onMounted(() => {
  const interval = setInterval(() => {
    const isAvailable = serviceRegistry.availableServices.has(serviceName.value)
    if (isAvailable) {
      clearInterval(interval)
      router.push(route.query.returnTo as string || '/')
    }
    lastChecked.value = new Date().toLocaleTimeString()
  }, 10000)

  onUnmounted(() => clearInterval(interval))
})
</script>
```

### 5. Router Integration

**Update router to catch unavailable services:**

```typescript
// apps/platform-shell/ui/src/router/index.ts

router.beforeEach(async (to, from, next) => {
  // Extract service name from route path
  const serviceMatch = to.path.match(/^\/([^/]+)/)
  if (!serviceMatch) return next()

  const serviceName = serviceMatch[1]
  const serviceRegistry = useServiceRegistryStore()

  // Check if it's a known service route
  const KNOWN_SERVICES = ['account', 'repository', 'connector', 'mapping', ...]

  if (KNOWN_SERVICES.includes(serviceName)) {
    const isAvailable = serviceRegistry.availableServices.has(`${serviceName}-service`)

    if (!isAvailable) {
      // Redirect to service unavailable page
      return next({
        name: 'service-unavailable',
        params: { serviceName },
        query: { returnTo: to.fullPath }
      })
    }
  }

  next()
})
```

### 6. Enhanced Service Discovery

**Track service history:**

```typescript
// In serviceRegistry.ts

interface ServiceHistory {
  firstSeen: Date
  lastSeen: Date
  totalDowntime: number  // milliseconds
  downtimeEvents: Array<{ start: Date, end?: Date }>
}

const serviceHistory = ref<Map<string, ServiceHistory>>(new Map())

// Track when services go up/down
watch(availableServices, (newServices, oldServices) => {
  // Services that went down
  for (const service of oldServices) {
    if (!newServices.has(service)) {
      const history = serviceHistory.get(service)
      if (history) {
        history.downtimeEvents.push({ start: new Date() })
      }
    }
  }

  // Services that came back up
  for (const service of newServices) {
    if (!oldServices.has(service)) {
      const history = serviceHistory.get(service)
      if (history && history.downtimeEvents.length > 0) {
        const lastEvent = history.downtimeEvents[history.downtimeEvents.length - 1]
        if (!lastEvent.end) {
          lastEvent.end = new Date()
          history.totalDowntime += lastEvent.end.getTime() - lastEvent.start.getTime()
        }
      }
    }
  }
})
```

### 7. Visual Polish

**Add status badges to navigation:**

```vue
<v-badge
  :color="item.healthStatus === 'healthy' ? 'success' : 'error'"
  :icon="item.healthStatus === 'healthy' ? 'mdi-check' : 'mdi-alert'"
  overlap
>
  <v-list-item :to="item.to" :disabled="item.disabled">
    <!-- ... -->
  </v-list-item>
</v-badge>
```

**Add notification when service goes down:**

```typescript
// In serviceRegistry store
import { useNotificationStore } from '@/stores/notifications'

watch(availableServices, (newServices, oldServices) => {
  const notifications = useNotificationStore()

  // Notify when known service goes down
  for (const service of oldServices) {
    if (!newServices.has(service) && CORE_SERVICES.includes(service)) {
      notifications.warning(
        `${service} is now unavailable`,
        { timeout: 5000 }
      )
    }
  }

  // Notify when service comes back
  for (const service of newServices) {
    if (!oldServices.has(service) && CORE_SERVICES.includes(service)) {
      notifications.success(
        `${service} is back online`,
        { timeout: 3000 }
      )
    }
  }
})
```

## Deliverables

1. **Updated Service Registry**
   - Track service status (not just availability)
   - Maintain known services list
   - Service history tracking

2. **ServiceUnavailablePage Component**
   - User-friendly error page
   - Auto-retry logic
   - Return to previous route when available

3. **Enhanced Navigation**
   - Health status indicators
   - Disabled state for unavailable services
   - Tooltips explaining status
   - Stable menu (no items disappearing)

4. **Router Guards**
   - Intercept navigation to unavailable services
   - Redirect to unavailable page
   - Preserve return URL

5. **Notification System (optional)**
   - Toast notifications for service up/down events
   - Only for core services (avoid spam)

6. **Documentation**
   - Update developer guide with patterns
   - Document how to mark services as "core"

## Success Criteria

- [ ] Navigation items stay visible when service goes down
- [ ] Unavailable services are clearly marked (greyed out + indicator)
- [ ] Clicking unavailable service shows friendly error page
- [ ] Error page auto-redirects when service returns
- [ ] No jarring menu reorganization when services change
- [ ] Users understand service is temporarily down (not broken)
- [ ] Status indicators update in real-time from streams

## Design Considerations

**Core Services List:**
```typescript
const CORE_SERVICES = {
  'platform-registration-service': {
    displayName: 'Platform Registration',
    icon: 'mdi-cog',
    description: 'Service discovery and registration',
    critical: true  // Show warning if this is down
  },
  'repository-service': {
    displayName: 'Repository',
    icon: 'mdi-database',
    description: 'Document storage and retrieval',
    critical: false
  },
  'account-manager': {
    displayName: 'Accounts',
    icon: 'mdi-account-multiple',
    description: 'User account management',
    critical: false
  },
  // ... etc
}
```

**Status Priority:**
1. SERVING (green circle) - Service is healthy
2. NOT_SERVING (yellow circle) - Service is running but not ready
3. UNREACHABLE (red circle) - Service is down/unavailable
4. UNKNOWN (grey circle) - Never seen or status unclear

**UX Flow:**
1. User sees greyed-out menu item with red indicator
2. Hovers → tooltip: "Repository Service is currently unavailable"
3. Clicks → navigates to `/service-unavailable/repository-service`
4. Page shows friendly message with auto-retry
5. When service returns → auto-redirects to intended destination

## Implementation Steps

### Phase 1: Data Model (1-2 hours)
- Update ServiceStatus interface
- Define CORE_SERVICES constant
- Track service health in registry

### Phase 2: Navigation (2-3 hours)
- Update nav item generation to include disabled items
- Add health status indicators
- Update AppShell styling

### Phase 3: Error Page (1-2 hours)
- Create ServiceUnavailablePage component
- Add route for `/service-unavailable/:serviceName`
- Implement auto-retry logic

### Phase 4: Router Guards (1 hour)
- Add beforeEach guard
- Check service availability
- Redirect if needed

### Phase 5: Polish (1-2 hours)
- Add notifications (optional)
- Fine-tune styling
- Test with services going up/down

### Phase 6: Testing (2-3 hours)
- Test service registry updates
- Test navigation disabled states
- Test error page auto-redirect
- Test router guards

## Testing Scenarios

**Simulate service going down:**
```bash
# Stop a service
docker stop repository-service

# Verify:
# - Nav item becomes disabled
# - Status indicator turns red
# - Clicking shows unavailable page
# - Tooltip explains status
```

**Simulate service coming back:**
```bash
# Start the service
docker start repository-service

# Verify:
# - Nav item becomes enabled
# - Status indicator turns green
# - Unavailable page auto-redirects
# - Notification shown (if implemented)
```

**Simulate new service registration:**
```bash
# Start a new service
# Verify it appears in nav dynamically
```

## Edge Cases

1. **Service never seen before** - Should it appear? Probably yes if it registers with platform-registration
2. **Service down during initial load** - Should show greyed out from start
3. **Rapid up/down/up transitions** - Debounce to avoid flashing
4. **User on service page when it goes down** - Show error page immediately or wait?
5. **Critical services down** - Should block app or just warn?

## Accessibility

- Use aria-disabled for disabled nav items
- Provide screen reader text for status indicators
- Ensure error page is keyboard navigable
- Sufficient color contrast for status indicators

## Future Enhancements

- Service uptime percentage in tooltip
- Scheduled maintenance warnings
- Degraded mode (service partially available)
- Service dependency graph (show why service is down)

## Deliverables

1. Updated `serviceRegistry.ts` with ServiceStatus model
2. Updated nav generation in `apps/platform-shell/src/index.ts`
3. Enhanced `AppShell.vue` with status indicators
4. New `ServiceUnavailablePage.vue` component
5. Router guards for service availability
6. Tests for all new functionality
7. Documentation updates

## Success Criteria

- [ ] Core services always visible in nav (even when down)
- [ ] Clear visual indication of service health
- [ ] User-friendly error page with auto-retry
- [ ] No navigation jumping when services change
- [ ] Status updates in real-time from gRPC streams
- [ ] Works correctly when services go down and come back up

## Notes

- Balance between showing too much (cluttered nav) and too little (confused users)
- Consider having a "Show all services" toggle to see non-core services
- Don't spam notifications - only for significant changes
- Keep the implementation simple - this is about UX not complex state management
- Test with actual service restarts, not just mocks
