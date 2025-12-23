# Task: Implement Error Boundaries and Centralized Logging

## Objective
Create a robust error handling system with Vue error boundaries, centralized logging, and user-friendly error messages for production debugging.

## Context

**Current State:**
- No global error boundary
- Console.log statements scattered throughout code
- No centralized error tracking
- gRPC errors not consistently handled
- No user feedback for background failures (stream errors)

**Problems:**
- Errors crash entire app
- No visibility into production issues
- Inconsistent error messages
- Stream failures are silent
- No error reporting to backend

## Requirements

### 1. Vue Error Boundary Component

**Create `packages/shared-components/src/components/ErrorBoundary.vue`:**

```vue
<template>
  <div v-if="error" class="error-boundary">
    <v-alert
      type="error"
      variant="tonal"
      prominent
      border="start"
    >
      <v-alert-title>
        <v-icon>mdi-alert-circle</v-icon>
        Something Went Wrong
      </v-alert-title>

      <p class="mb-4">{{ userMessage }}</p>

      <v-expansion-panels v-if="showDetails">
        <v-expansion-panel>
          <v-expansion-panel-title>
            Technical Details
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <pre class="text-caption">{{ errorDetails }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="mt-4">
        <v-btn color="primary" @click="retry">
          Try Again
        </v-btn>
        <v-btn variant="text" to="/">
          Go Home
        </v-btn>
        <v-btn
          v-if="canReport"
          variant="text"
          @click="reportError"
        >
          Report Issue
        </v-btn>
      </div>
    </v-alert>
  </div>

  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useLogger } from '@/composables/useLogger'

const props = defineProps<{
  fallbackMessage?: string
  showDetails?: boolean
  onError?: (error: Error) => void
}>()

const error = ref<Error | null>(null)
const logger = useLogger('ErrorBoundary')

const userMessage = computed(() => {
  if (!error.value) return ''
  return props.fallbackMessage || 'An unexpected error occurred'
})

onErrorCaptured((err, instance, info) => {
  error.value = err
  logger.error('Component error caught', { err, info })
  props.onError?.(err)
  return false // Prevent error from propagating
})

const retry = () => {
  error.value = null
}
</script>
```

### 2. Centralized Logger

**Create `packages/shared-components/src/composables/useLogger.ts`:**

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: Date
  level: LogLevel
  context: string
  message: string
  data?: any
  error?: Error
}

interface LoggerConfig {
  level: LogLevel
  sendToBackend: boolean
  persistLocally: boolean
}

export function useLogger(context: string) {
  const config = {
    level: import.meta.env.PROD ? 'info' : 'debug',
    sendToBackend: import.meta.env.PROD,
    persistLocally: true
  }

  const log = (level: LogLevel, message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context,
      message,
      data
    }

    // Console output (development)
    if (import.meta.env.DEV) {
      const style = getLogStyle(level)
      console[level](`[${context}]`, message, data || '')
    }

    // Send to backend (production)
    if (config.sendToBackend && level !== 'debug') {
      sendLogToBackend(entry)
    }

    // Store locally (for debugging)
    if (config.persistLocally) {
      storeLogEntry(entry)
    }
  }

  return {
    debug: (msg: string, data?: any) => log('debug', msg, data),
    info: (msg: string, data?: any) => log('info', msg, data),
    warn: (msg: string, data?: any) => log('warn', msg, data),
    error: (msg: string, error?: Error, data?: any) => {
      log('error', msg, { error, ...data })
    }
  }
}
```

### 3. gRPC Error Handler

**Create `packages/shared-components/src/utils/grpc-errors.ts`:**

```typescript
import { ConnectError, Code } from '@connectrpc/connect'

export interface UserFriendlyError {
  title: string
  message: string
  canRetry: boolean
  actionLabel?: string
}

export function handleGrpcError(error: unknown): UserFriendlyError {
  if (!(error instanceof ConnectError)) {
    return {
      title: 'Unexpected Error',
      message: error instanceof Error ? error.message : String(error),
      canRetry: true
    }
  }

  // Map gRPC error codes to user-friendly messages
  switch (error.code) {
    case Code.NotFound:
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found',
        canRetry: false
      }

    case Code.PermissionDenied:
    case Code.Unauthenticated:
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this resource',
        canRetry: false,
        actionLabel: 'Sign In'
      }

    case Code.Unavailable:
      return {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again in a moment.',
        canRetry: true
      }

    case Code.DeadlineExceeded:
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete',
        canRetry: true
      }

    case Code.InvalidArgument:
      return {
        title: 'Invalid Input',
        message: error.message || 'The provided data is invalid',
        canRetry: false
      }

    case Code.AlreadyExists:
      return {
        title: 'Already Exists',
        message: 'A resource with this identifier already exists',
        canRetry: false
      }

    default:
      return {
        title: 'Service Error',
        message: error.message || 'An error occurred while communicating with the service',
        canRetry: true
      }
  }
}
```

### 4. Global Error Handler

**Update `apps/pipestream-frontend/ui/src/main.ts`:**

```typescript
import { createApp } from 'vue'
import { useLogger } from '@/composables/useLogger'

const app = createApp(App)
const logger = useLogger('App')

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  logger.error('Vue error', err, { component: instance?.$options.name, info })

  // Show user notification
  const notifications = useNotificationStore()
  notifications.error(
    'An unexpected error occurred',
    { timeout: 5000 }
  )
}

// Global warning handler
app.config.warnHandler = (msg, instance, trace) => {
  if (import.meta.env.DEV) {
    logger.warn('Vue warning', { msg, trace })
  }
}

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason)
  event.preventDefault()
})
```

### 5. Notification Store

**Create `apps/pipestream-frontend/ui/src/stores/notifications.ts`:**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timeout?: number
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])

  const add = (type: Notification['type'], message: string, options = {}) => {
    const id = `${Date.now()}-${Math.random()}`
    const notification: Notification = {
      id,
      type,
      message,
      timeout: options.timeout ?? 3000
    }

    notifications.value.push(notification)

    if (notification.timeout) {
      setTimeout(() => remove(id), notification.timeout)
    }

    return id
  }

  const remove = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications,
    success: (msg: string, opts?: any) => add('success', msg, opts),
    error: (msg: string, opts?: any) => add('error', msg, opts),
    warning: (msg: string, opts?: any) => add('warning', msg, opts),
    info: (msg: string, opts?: any) => add('info', msg, opts),
    remove
  }
})
```

**Add notification display to App.vue:**

```vue
<template>
  <v-app>
    <!-- Main content -->
    <router-view />

    <!-- Global notifications -->
    <v-snackbar
      v-for="notification in notifications"
      :key="notification.id"
      :model-value="true"
      :color="notification.type"
      :timeout="notification.timeout"
      location="top right"
      @update:model-value="removeNotification(notification.id)"
    >
      {{ notification.message }}
    </v-snackbar>
  </v-app>
</template>
```

### 6. Stream Error Recovery

**Update streaming composables to use logger and notifications:**

```typescript
// In useShellHealth.ts or serviceRegistry.ts

const logger = useLogger('ServiceRegistry')
const notifications = useNotificationStore()

try {
  for await (const response of client.watchServices(...)) {
    // Process stream
  }
} catch (err) {
  const friendlyError = handleGrpcError(err)

  // Log for debugging
  logger.error('Service stream failed', err, {
    serviceName: 'platform-registration',
    willRetry: true
  })

  // Notify user (only for critical failures)
  if (err instanceof ConnectError && err.code === Code.Unavailable) {
    notifications.warning(
      'Lost connection to platform registration. Reconnecting...',
      { timeout: 5000 }
    )
  }

  // Retry with backoff
  scheduleReconnect()
}
```

### 7. Backend Log Aggregation

**Create backend endpoint to receive frontend logs:**

```typescript
// apps/pipestream-frontend/src/index.ts

app.post('/api/logs', (req, res) => {
  const { level, context, message, data, timestamp } = req.body

  // Log to backend console with prefix
  console[level](`[Frontend:${context}]`, message, data || '')

  // Could also send to logging service (Loki, CloudWatch, etc.)

  res.status(204).send()
})
```

**Frontend log sender:**

```typescript
async function sendLogToBackend(entry: LogEntry) {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    })
  } catch (err) {
    // Don't let logging errors break the app
    console.error('Failed to send log to backend', err)
  }
}
```

### 8. Local Log Storage

**Store logs in localStorage for debugging:**

```typescript
const MAX_LOGS = 1000
const LOG_STORAGE_KEY = 'app-logs'

function storeLogEntry(entry: LogEntry) {
  const logs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]')
  logs.push(entry)

  // Keep only recent logs
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS)
  }

  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs))
}

// Export logs for debugging
export function exportLogs() {
  const logs = localStorage.getItem(LOG_STORAGE_KEY)
  const blob = new Blob([logs || '[]'], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `app-logs-${new Date().toISOString()}.json`
  a.click()

  URL.revokeObjectURL(url)
}
```

## Deliverables

1. **ErrorBoundary component** with user-friendly UI
2. **useLogger composable** for centralized logging
3. **gRPC error handler** with friendly messages
4. **Notification store and UI** for toast messages
5. **Global error handlers** in main.ts
6. **Backend log endpoint** to aggregate frontend logs
7. **Local log storage** with export functionality
8. **Updated service clients** to use logger and error handler
9. **Documentation** on error handling patterns

## Success Criteria

- [ ] Errors don't crash the entire app
- [ ] Users see friendly error messages
- [ ] Errors are logged centrally
- [ ] Production issues are debuggable
- [ ] Stream errors are handled gracefully
- [ ] Important failures trigger notifications
- [ ] Logs can be exported for support tickets

## Notes

- Keep user messages friendly and actionable
- Log technical details for debugging
- Don't spam users with notifications
- Make error recovery automatic where possible
- Consider error tracking service (Sentry) for production
