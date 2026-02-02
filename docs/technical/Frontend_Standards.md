# Frontend Engineering Standards

## Core Principles
1.  **Strict TypeScript:** All code must be strictly typed. No `any` types unless absolutely unavoidable and documented with a rationale.
2.  **Connect-ES Only:** All network communication must use the Connect-ES library.
    *   **NO** `axios`, `fetch`, or other HTTP clients for API calls.
    *   **NO** REST APIs. All interactions are gRPC/Connect services.
3.  **Generated Code:** 
    *   Protobufs are the single source of truth.
    *   Do not manually type API responses; use the types generated in `packages/protobuf-forms`.
    *   Imports should come from `@ai-pipestream/protobuf-forms/generated`.

## Service Consumption Pattern
*   **Transport:** Use `createConnectTransport` (web) or `createGrpcTransport` (node/server-side rendering) from `@connectrpc/connect-web` / `@connectrpc/connect-node`.
*   **Clients:** Instantiate clients using `createClient` from `@connectrpc/connect`.
*   **Configuration:** Centralize transport configuration (Base URLs, binary format usage) to ensure consistency across the application.

## State Management (Vue)
*   **Composables:** Encapsulate service logic and state in Vue composables (e.g., `useServiceRegistry`).
*   **Reactivity:** Use Vue's `ref` and `computed` to track service availability and data.
*   **Resource Management:** strictly manage resources like `AbortController` and timers to prevent leaks, especially for streaming RPCs (`watch*`).

## Project Structure
*   **Protos:** Located in `packages/protobuf-forms`.
*   **Feature Logic:** Located in `apps/pipestream-frontend/ui/src/`.
*   **Shared Logic:** Common utilities and clients belong in `packages/connector-shared` or `packages/shared-components`.
