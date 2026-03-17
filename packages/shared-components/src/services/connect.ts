import { createClient, type Transport } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { ShellService } from '@ai-pipestream/protobuf-forms/generated'

/**
 * Creates a browser transport pointing to the Node.js Shell BFF.
 * All communication is strictly Protobuf over HTTP (Connect-ES).
 */
export function createShellTransport(base?: string): Transport {
  // Default to same-origin
  const baseUrl = base ?? window.location.origin
  return createConnectTransport({
    baseUrl,
    useBinaryFormat: true
  })
}

/**
 * The primary client for the frontend.
 * Instead of multiple microservice clients, the UI uses this unified facade.
 */
export function createShellClient(transport?: Transport): any {
  return createClient(ShellService, transport ?? createShellTransport())
}

// Global instance for convenience
export const shellClient = createShellClient()
