import { createClient } from '@connectrpc/connect';
import { createBinaryTransport } from '@io-pipeline/grpc-stubs';
import { MappingService } from '@io-pipeline/grpc-stubs/mapping';
import type { ApplyMappingRequest, ApplyMappingResponse } from '@io-pipeline/grpc-stubs/mapping';

const transport = createBinaryTransport(`http://${window.location.hostname}:37200`);

const client = createClient(MappingService, transport);

export const mappingService = {
  applyMapping(request: ApplyMappingRequest): Promise<ApplyMappingResponse> {
    return client.applyMapping(request);
  },
};
