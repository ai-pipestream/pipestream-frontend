import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { MappingService, type ApplyMappingRequest, type ApplyMappingResponse } from '@ai-pipestream/protobuf-forms/generated';

// Use same-origin transport so the web-proxy can route to mapping-service
// This works in both dev (via Vite proxy) and production (via ALB/Traefik)
const transport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true
});

const client = createClient(MappingService, transport);

export const mappingService = {
  applyMapping(request: ApplyMappingRequest): Promise<ApplyMappingResponse> {
    return client.applyMapping(request);
  },
};
