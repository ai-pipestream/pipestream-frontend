# Task: Create Comprehensive Developer Guide

## Objective
Create a complete developer onboarding guide that helps new frontend developers get productive quickly with the platform-frontend codebase, especially focusing on gRPC integration and streaming patterns.

## Context

**Architecture:**
- Vue 3 + Vite + TypeScript monorepo
- gRPC/Connect-ES for all backend communication
- Real-time streaming for service discovery and health monitoring
- pnpm workspaces with catalog-based version management
- Binary protobuf transport (TypeScript-first)

**Current State:**
- Basic README exists but lacks depth
- No formal developer onboarding documentation
- Complex streaming patterns without explanation
- gRPC integration has steep learning curve for frontend devs

**Target Audience:**
- Frontend developers familiar with Vue/React but not gRPC
- Backend developers learning frontend patterns
- Junior developers joining the team

## Requirements

### 1. Getting Started Guide
Create `docs/DEVELOPER_GUIDE.md` with:

**Environment Setup:**
- Prerequisites (Node 22, pnpm 10)
- Clone and install steps
- Environment variable configuration
- Running locally (frontend + backend together)
- Common troubleshooting (port conflicts, missing services)

**Project Structure:**
- Explain monorepo organization (apps vs packages)
- What each package does (shared-components, shared-nav, connector-shared, protobuf-forms)
- Where to find things (components, services, stores, routes)

### 2. Adding a New Service Integration
Step-by-step guide with complete example:

**Prerequisites:**
- gRPC service must be running and registered with platform-registration-service
- Proto files must be defined and grpc-stubs generated

**Steps:**
1. Create service client file (`src/services/{service-name}/services/{service-name}Client.ts`)
   - Import from grpc-stubs
   - Create transport with binary format
   - Create typed client
   - Export wrapper functions with JSDoc

2. Create service composable (optional, for reactive state)
   - Example: `useServiceHealth.ts` pattern
   - Streaming with AbortController
   - Error handling and reconnection

3. Create UI views
   - List view with table
   - Detail/edit view with forms
   - Use shared-components where possible

4. Add routing
   - Lazy-loaded route in router/index.ts
   - Dynamic import for code splitting

5. Add navigation item
   - Update service registry if dynamic
   - Or add to static nav config

**Complete Code Example:**
Provide a working example that implements all steps for a simple "TaskService" that has:
- `listTasks()` - unary call
- `watchTasks()` - server streaming
- `createTask()` - unary with request body

### 3. gRPC Patterns Guide

**Basic Request/Response:**
```typescript
// Unary RPC - simple request/response
const response = await client.getAccount({ accountId: "123" })
```

**Server Streaming:**
```typescript
// Streaming RPC - real-time updates
const abortController = new AbortController()
for await (const update of client.watchServices({}, { signal: abortController.signal })) {
  // Process each update
}
// Cleanup: abortController.abort()
```

**Error Handling:**
```typescript
try {
  const result = await client.someMethod(request)
} catch (err) {
  if (err instanceof ConnectError) {
    // Handle gRPC-specific errors
    if (err.code === Code.NotFound) {
      // Handle not found
    }
  }
}
```

**Streaming with Reconnection:**
Explain the exponential backoff pattern used in serviceRegistry.ts:
- Initial backoff: 1s
- Max backoff: 30s
- Jitter to prevent thundering herd
- AbortController for cleanup

### 4. Common Patterns

**Creating a Transport:**
```typescript
import { createConnectTransport } from '@connectrpc/connect-web'

const transport = createConnectTransport({
  baseUrl: window.location.origin,  // Uses web-proxy
  useBinaryFormat: true              // ALWAYS use binary for TypeScript
})
```

**Creating a Client:**
```typescript
import { createClient } from '@connectrpc/connect'
import { MyService } from '@ai-pipestream/grpc-stubs/dist/path/to/service_pb'

const client = createClient(MyService, transport)
```

**Using in Vue Components:**
- Composition API with `ref`, `computed`, `onUnmounted`
- Reactive state with Pinia stores
- Streaming lifecycle management

### 5. Troubleshooting

**Common Issues:**

1. "Cannot find module @ai-pipestream/grpc-stubs"
   - Run `pnpm install`
   - Check catalog version in pnpm-workspace.yaml
   - Clear caches: `./scripts/nuclear-clean.sh`

2. "createConnectTransport is not defined"
   - Missing import from '@connectrpc/connect-web'

3. "Module resolution failed"
   - Import paths must NOT include `.ts` extension
   - Use `/dist/path/to/file_pb` not `/dist/path/to/file_pb.ts`

4. "Service not available / 404 errors"
   - Check service is running and registered
   - Check Vite proxy config in vite.config.ts
   - Verify service name matches registration

5. "Vite serving old cached version"
   - Run `./scripts/nuclear-clean.sh`
   - Check browser DevTools > Network > Disable cache
   - Hard reload (Cmd+Shift+R / Ctrl+Shift+R)

### 6. Best Practices

**TypeScript:**
- ALWAYS use strict types, no `any`
- Import types from grpc-stubs
- Use TypeScript type guards

**gRPC:**
- ALWAYS use `useBinaryFormat: true`
- NEVER add `.ts` extension to grpc-stubs imports
- Use `timeoutMs: undefined` for streaming calls
- Always cleanup streams with AbortController

**Performance:**
- Lazy-load routes with dynamic imports
- Use Pinia stores for shared state
- Debounce/throttle rapid updates from streams

**Code Organization:**
- One service per directory
- Services export typed client functions
- Composables for reactive/reusable logic
- Components focus on UI only

### 7. Quick Reference

**File Locations:**
- Components: `packages/shared-components/src/components/`
- Services: `apps/platform-shell/ui/src/services/{service-name}/`
- Stores: `apps/platform-shell/ui/src/stores/`
- Composables: `apps/platform-shell/ui/src/composables/`
- Routes: `apps/platform-shell/ui/src/router/`

**Key Files:**
- Service registry: `apps/platform-shell/ui/src/stores/serviceRegistry.ts`
- Health monitoring: `apps/platform-shell/ui/src/composables/useShellHealth.ts`
- Vite config: `apps/platform-shell/ui/vite.config.ts`
- Version catalog: `pnpm-workspace.yaml`

**Scripts:**
- `pnpm install` - Install dependencies
- `pnpm -r build` - Build all packages
- `./scripts/start-platform-shell.sh` - Run frontend + backend locally
- `./scripts/nuclear-clean.sh` - Clear all caches
- `./scripts/sync-grpc-stubs-version.sh <version>` - Update grpc-stubs version

## Deliverables

1. `docs/DEVELOPER_GUIDE.md` - Main comprehensive guide (aim for 500-800 lines)
2. `docs/GRPC_PATTERNS.md` - Deep dive on gRPC/streaming patterns (300-400 lines)
3. `docs/TROUBLESHOOTING.md` - Common issues and solutions (200-300 lines)
4. `docs/examples/` directory with:
   - `simple-service-integration/` - Complete working example
   - `streaming-pattern/` - Streaming with reconnection example
   - `form-with-grpc/` - Form submission example

## Success Criteria

- [ ] New developer can get the app running locally in < 30 minutes
- [ ] Clear examples for common tasks (add service, create form, handle streams)
- [ ] Troubleshooting guide covers 80% of common issues
- [ ] Code examples are copy-pasteable and work without modification
- [ ] Explains "why" not just "how" (e.g., why binary format, why streaming)

## Notes

- Use the existing codebase as source material
- Reference actual files with line numbers where helpful
- Include diagrams (mermaid) for architecture flow
- Keep language simple and avoid jargon where possible
- Assume reader knows Vue basics but not gRPC
- Focus on practical examples over theory

## Validation

After creating the guide:
1. Test that all code examples actually work
2. Verify all file paths are correct
3. Check that troubleshooting steps actually solve the issues
4. Ensure the guide flows logically (setup → basic → advanced)
