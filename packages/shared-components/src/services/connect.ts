import { createClient, type Transport } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { PlatformRegistrationService, PipeStepProcessorService } from '@ai-pipestream/protobuf-forms/generated'

// Create a browser transport pointing to the web-proxy Connect API
export function createWebProxyTransport(base?: string): Transport {
  // Default to same-origin (relative URLs work in all environments)
  const baseUrl = base ?? window.location.origin
  return createConnectTransport({
    baseUrl,
    useBinaryFormat: true
  })
}

// Note: to avoid leaking generated types in public d.ts (TS2742),
// we keep return types broad.
export function createPlatformRegistrationClient(transport?: Transport): any {
  return createClient(PlatformRegistrationService, transport ?? createWebProxyTransport())
}

// PipeStepProcessor requests must set x-target-backend header to the module service name
export function createPipeStepProcessorClient(moduleServiceName: string, base?: string): any {
  const baseUrl = base ?? window.location.origin
  const transport = createConnectTransport({
    baseUrl,
    useBinaryFormat: true,
    interceptors: [
      (next) => async (req) => {
        req.header.set('x-target-backend', moduleServiceName)
        return next(req)
      }
    ]
  })
  return createClient(PipeStepProcessorService, transport)
}
