import { createClient } from '@connectrpc/connect';
import { MappingService } from '@ai-pipestream/grpc-stubs/dist/mapping-service/mapping_service_pb';
import type { ApplyMappingRequest, ApplyMappingResponse } from '@ai-pipestream/grpc-stubs/dist/mapping-service/mapping_service_pb';

const transport = createConnectTransport(`http://${window.location.hostname}:37200`);

const client = createClient(MappingService, transport);

export const mappingService = {
  applyMapping(request: ApplyMappingRequest): Promise<ApplyMappingResponse> {
    return client.applyMapping(request);
  },
};
