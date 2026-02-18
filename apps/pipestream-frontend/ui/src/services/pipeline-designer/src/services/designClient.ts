import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { create } from '@bufbuild/protobuf'
import {
  DesignModeService,
  CreateDesignGraphRequestSchema,
  ListDesignGraphsRequestSchema,
  ValidateDesignGraphRequestSchema,
  SimulatePipelineRequestSchema,
  DeployGraphRequestSchema,
  type CreateDesignGraphRequest,
  type ListDesignGraphsRequest,
  type ValidateDesignGraphRequest,
  type SimulatePipelineRequest,
  type DeployGraphRequest,
  type DesignGraphSummary,
  type CreateDesignGraphResponse,
  type ValidateDesignGraphResponse,
  type SimulatePipelineResponse,
  type DeployGraphResponse
} from '@ai-pipestream/protobuf-forms/generated'

const transport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true
})

const client = createClient(DesignModeService, transport)

export async function listDesignGraphs(options: {
  userId?: string
  clusterId?: string
  pageSize?: number
  pageToken?: string
} = {}): Promise<{ graphs: DesignGraphSummary[]; nextPageToken: string }> {
  const request = create(ListDesignGraphsRequestSchema, {
    userId: options.userId || '',
    clusterId: options.clusterId || '',
    pageSize: options.pageSize ?? 50,
    pageToken: options.pageToken || ''
  }) as ListDesignGraphsRequest

  const response = await client.listDesignGraphs(request)
  return {
    graphs: response.graphs,
    nextPageToken: response.nextPageToken
  }
}

export async function createDesignGraph(payload: {
  clusterId: string
  graphName: string
  description: string
  userId: string
}): Promise<CreateDesignGraphResponse> {
  const request = create(CreateDesignGraphRequestSchema, {
    clusterId: payload.clusterId,
    graphName: payload.graphName,
    description: payload.description,
    userId: payload.userId
  }) as CreateDesignGraphRequest

  return client.createDesignGraph(request)
}

export async function validateDesignGraph(payload: {
  designGraphId: string
  checkModuleAvailability?: boolean
  checkKafkaTopics?: boolean
}): Promise<ValidateDesignGraphResponse> {
  const request = create(ValidateDesignGraphRequestSchema, {
    designGraphId: payload.designGraphId,
    checkModuleAvailability: payload.checkModuleAvailability ?? true,
    checkKafkaTopics: payload.checkKafkaTopics ?? true
  }) as ValidateDesignGraphRequest

  return client.validateDesignGraph(request)
}

export async function simulatePipeline(payload: {
  designGraphId: string
  sampleDocument: SimulatePipelineRequest['sampleDocument']
  startingNodeId?: string
  stepByStep?: boolean
}): Promise<SimulatePipelineResponse> {
  const request = create(SimulatePipelineRequestSchema, {
    designGraphId: payload.designGraphId,
    sampleDocument: payload.sampleDocument,
    startingNodeId: payload.startingNodeId || '',
    stepByStep: payload.stepByStep ?? false
  }) as SimulatePipelineRequest

  return client.simulatePipeline(request)
}

export async function deployGraph(payload: {
  designGraphId: string
  targetClusterId: string
  dryRun?: boolean
}): Promise<DeployGraphResponse> {
  const request = create(DeployGraphRequestSchema, {
    designGraphId: payload.designGraphId,
    targetClusterId: payload.targetClusterId,
    dryRun: payload.dryRun ?? false
  }) as DeployGraphRequest

  return client.deployGraph(request)
}
