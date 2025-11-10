# Task: Implement Authentication and Authorization

## Objective
Add user authentication and role-based authorization to the platform, securing gRPC endpoints and UI routes based on user permissions.

## Context

**Current State:**
- No authentication (anyone can access everything)
- No user session management
- No permission checking
- gRPC calls are unauthenticated

**Requirements:**
- User login/logout
- JWT-based authentication
- Role-based access control (RBAC)
- Protect routes based on permissions
- Secure gRPC calls with auth tokens
- Session persistence

## Requirements

### 1. Authentication Service Integration

**Assuming backend has auth service, integrate it:**

```typescript
// src/services/auth/authClient.ts

import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { AuthService } from '@ai-pipestream/grpc-stubs/auth'

const transport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true
})

const client = createClient(AuthService, transport)

export async function login(username: string, password: string) {
  const response = await client.login({ username, password })
  return response  // { token, user, expiresAt }
}

export async function logout() {
  const response = await client.logout({})
  return response
}

export async function refreshToken(token: string) {
  const response = await client.refreshToken({ token })
  return response
}

export async function getCurrentUser() {
  const response = await client.getCurrentUser({})
  return response
}
```

### 2. Auth Store (Pinia)

**Create `apps/platform-shell/ui/src/stores/auth.ts`:**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authClient from '@/services/auth/authClient'

interface User {
  id: string
  username: string
  email: string
  roles: string[]
  permissions: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // Load token from localStorage on init
  const storedToken = localStorage.getItem('auth_token')
  if (storedToken) {
    token.value = storedToken
    // Verify token and load user
    loadCurrentUser()
  }

  async function login(username: string, password: string) {
    const response = await authClient.login(username, password)

    token.value = response.token
    user.value = response.user
    localStorage.setItem('auth_token', response.token)

    // Setup token refresh
    scheduleTokenRefresh(response.expiresAt)
  }

  async function logout() {
    await authClient.logout()

    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  async function loadCurrentUser() {
    if (!token.value) return

    try {
      const response = await authClient.getCurrentUser()
      user.value = response.user
    } catch (err) {
      // Token invalid, clear auth
      logout()
    }
  }

  function hasRole(role: string): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  function hasPermission(permission: string): boolean {
    return user.value?.permissions.includes(permission) ?? false
  }

  function hasAnyRole(...roles: string[]): boolean {
    return roles.some(role => hasRole(role))
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasPermission,
    hasAnyRole
  }
})
```

### 3. Auth Interceptor for gRPC

**Add auth token to all gRPC requests:**

```typescript
// src/utils/createAuthenticatedTransport.ts

import { createConnectTransport } from '@connectrpc/connect-web'
import { useAuthStore } from '@/stores/auth'

export function createAuthenticatedTransport(baseUrl?: string) {
  const auth = useAuthStore()

  return createConnectTransport({
    baseUrl: baseUrl || window.location.origin,
    useBinaryFormat: true,
    interceptors: [
      (next) => async (req) => {
        // Add auth token to request headers
        if (auth.token) {
          req.header.set('Authorization', `Bearer ${auth.token}`)
        }

        try {
          return await next(req)
        } catch (err) {
          // Handle 401 Unauthorized
          if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
            auth.logout()
            // Redirect to login
            router.push('/login')
          }
          throw err
        }
      }
    ]
  })
}

// Update all service clients to use this
export const accountClient = createClient(
  AccountService,
  createAuthenticatedTransport()
)
```

### 4. Route Protection

**Add navigation guards:**

```typescript
// router/index.ts

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/signup', '/forgot-password']

  if (publicRoutes.includes(to.path)) {
    return next()
  }

  // Check authentication
  if (!auth.isAuthenticated) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // Check role-based access
  if (to.meta.requiresRole) {
    const requiredRoles = Array.isArray(to.meta.requiresRole)
      ? to.meta.requiresRole
      : [to.meta.requiresRole]

    if (!auth.hasAnyRole(...requiredRoles)) {
      return next({
        path: '/forbidden',
        query: { requiredRole: requiredRoles.join(',') }
      })
    }
  }

  // Check permission-based access
  if (to.meta.requiresPermission) {
    if (!auth.hasPermission(to.meta.requiresPermission as string)) {
      return next('/forbidden')
    }
  }

  next()
})

// Route definitions with meta
const routes = [
  {
    path: '/admin',
    meta: { requiresRole: 'admin' },
    component: () => import('@/pages/AdminPage.vue')
  },
  {
    path: '/account',
    meta: { requiresPermission: 'account:read' },
    component: () => import('@/services/account-manager/src/App.vue')
  }
]
```

### 5. Login Page

**Create `apps/platform-shell/ui/src/pages/LoginPage.vue`:**

```vue
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>
            <h1 class="text-h4">Sign In</h1>
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="Username"
                prepend-icon="mdi-account"
                :error-messages="errors.username"
                @input="errors.username = ''"
              />

              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                prepend-icon="mdi-lock"
                :error-messages="errors.password"
                @input="errors.password = ''"
              />

              <v-alert v-if="loginError" type="error" class="mb-4">
                {{ loginError }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                block
                :loading="isLoading"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const loginError = ref('')
const errors = ref({ username: '', password: '' })

const handleLogin = async () => {
  errors.value = { username: '', password: '' }

  if (!username.value) {
    errors.value.username = 'Username is required'
    return
  }

  if (!password.value) {
    errors.value.password = 'Password is required'
    return
  }

  isLoading.value = true
  loginError.value = ''

  try {
    await auth.login(username.value, password.value)

    // Redirect to original destination or home
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (err) {
    loginError.value = 'Invalid username or password'
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 6. User Menu Component

**Add to AppBar:**

```vue
<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props">
        <v-avatar size="32">
          <v-icon>mdi-account</v-icon>
        </v-avatar>
      </v-btn>
    </template>

    <v-card min-width="200">
      <v-list>
        <v-list-item>
          <v-list-item-title>{{ user.username }}</v-list-item-title>
          <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
        </v-list-item>

        <v-divider />

        <v-list-item to="/profile">
          <v-list-item-title>Profile</v-list-item-title>
        </v-list-item>

        <v-list-item to="/settings">
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>

        <v-divider />

        <v-list-item @click="handleLogout">
          <v-list-item-title>Sign Out</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>
```

### 7. Permission-Based UI

**Hide/disable UI elements based on permissions:**

```vue
<template>
  <v-btn
    v-if="auth.hasPermission('account:delete')"
    @click="deleteAccount"
  >
    Delete
  </v-btn>

  <v-btn
    :disabled="!auth.hasPermission('account:edit')"
    @click="editAccount"
  >
    Edit
  </v-btn>
</template>
```

**Create permission directive:**

```typescript
// plugins/permission-directive.ts

export const vPermission = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const auth = useAuthStore()

    if (!auth.hasPermission(value)) {
      el.style.display = 'none'
    }
  }
}

// Use in template
<v-btn v-permission="'account:create'">Create Account</v-btn>
```

## Backend Requirements

**Agent should verify backend provides:**

1. Auth service with login/logout/refresh endpoints
2. JWT token generation
3. Token validation middleware
4. User/role/permission management
5. gRPC metadata inspection for auth tokens

**If backend doesn't have auth, agent should:**
- Document what needs to be implemented
- Provide example proto definitions
- Suggest auth service architecture

## Security Considerations

- Store tokens in memory + httpOnly cookie (not localStorage for production)
- HTTPS only in production
- CSRF protection
- Token refresh before expiry
- Logout on token expiration
- Rate limiting on login attempts

## Testing

- Test login/logout flow
- Test protected routes redirect to login
- Test permission-based UI hiding
- Test token refresh
- Test expired token handling
- Test role-based access

## Deliverables

1. Auth store with login/logout
2. Auth interceptor for gRPC
3. Router guards for protected routes
4. Login/Logout pages
5. User menu component
6. Permission directive
7. Token refresh logic
8. Tests for auth flows
9. Documentation

## Success Criteria

- [ ] Users can log in and out
- [ ] Protected routes require authentication
- [ ] gRPC calls include auth tokens
- [ ] Token refreshes automatically
- [ ] Expired sessions redirect to login
- [ ] UI elements respect permissions
- [ ] No security vulnerabilities
