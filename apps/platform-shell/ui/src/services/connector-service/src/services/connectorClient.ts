import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { create } from '@bufbuild/protobuf'
import {
  ConnectorAdminService,
  ConnectorRegistrationSchema,
  RegisterConnectorRequestSchema,
  UpdateConnectorRequestSchema,
  GetConnectorRequestSchema,
  ListConnectorsRequestSchema,
  SetConnectorStatusRequestSchema,
  DeleteConnectorRequestSchema,
  RotateApiKeyRequestSchema,
  type ConnectorRegistration,
  type RegisterConnectorRequest,
  type UpdateConnectorRequest,
  type GetConnectorRequest,
  type ListConnectorsRequest,
  type SetConnectorStatusRequest,
  type DeleteConnectorRequest,
  type RotateApiKeyRequest
} from '@ai-pipestream/protobuf-forms/generated'

// Create transport to connect through web-proxy using binary format
// The web-proxy will route to connector-service based on the service definitions
const transport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true
})

// Create service client
export const connectorClient = createClient(ConnectorAdminService, transport)

// ============================================================================
// CONNECTOR OPERATIONS
// ============================================================================

/**
 * Register a new connector
 */
export async function registerConnector(
  connectorName: string,
  connectorType: string,
  accountId: string,
  s3Bucket?: string,
  s3BasePath?: string,
  maxFileSize?: number,
  rateLimitPerMinute?: number
): Promise<{ success: boolean; connectorId: string; apiKey: string; message: string }> {
  const request = create(RegisterConnectorRequestSchema, {
    connectorName,
    connectorType,
    accountId,
    s3Bucket: s3Bucket || '',
    s3BasePath: s3BasePath || '',
    maxFileSize: BigInt(maxFileSize || 0),
    rateLimitPerMinute: BigInt(rateLimitPerMinute || 0)
  }) as RegisterConnectorRequest

  return connectorClient.registerConnector(request)
}

/**
 * Update an existing connector
 */
export async function updateConnector(
  connectorId: string,
  connectorName?: string,
  s3Bucket?: string,
  s3BasePath?: string,
  maxFileSize?: number,
  rateLimitPerMinute?: number
): Promise<{ success: boolean; message: string; connector: ConnectorRegistration }> {
  const request = create(UpdateConnectorRequestSchema, {
    connectorId,
    connectorName: connectorName || '',
    s3Bucket: s3Bucket || '',
    s3BasePath: s3BasePath || '',
    maxFileSize: BigInt(maxFileSize || 0),
    rateLimitPerMinute: BigInt(rateLimitPerMinute || 0)
  }) as UpdateConnectorRequest

  const response = await connectorClient.updateConnector(request)
  
  if (!response.connector) {
    throw new Error('Update response missing connector data')
  }
  
  return {
    success: response.success,
    message: response.message,
    connector: response.connector
  }
}

/**
 * Get a connector by ID
 */
export async function getConnector(connectorId: string): Promise<ConnectorRegistration> {
  const request = create(GetConnectorRequestSchema, {
    connectorId
  }) as GetConnectorRequest

  return connectorClient.getConnector(request)
}

/**
 * List connectors with optional filtering/pagination
 */
export async function listConnectors(options: {
  accountId?: string
  includeInactive?: boolean
  pageSize?: number
  pageToken?: string
} = {}): Promise<{ connectors: ConnectorRegistration[]; nextPageToken: string; totalCount: number }> {
  const request = create(ListConnectorsRequestSchema, {
    accountId: options.accountId || '',
    includeInactive: options.includeInactive ?? false,
    pageSize: options.pageSize ?? 50,
    pageToken: options.pageToken ?? ''
  }) as ListConnectorsRequest

  return connectorClient.listConnectors(request)
}

/**
 * Set connector status (active/inactive)
 */
export async function setConnectorStatus(
  connectorId: string,
  active: boolean,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const request = create(SetConnectorStatusRequestSchema, {
    connectorId,
    active,
    reason: reason || ''
  }) as SetConnectorStatusRequest

  return connectorClient.setConnectorStatus(request)
}

/**
 * Delete a connector (soft delete)
 */
export async function deleteConnector(
  connectorId: string,
  hardDelete: boolean = false
): Promise<{ success: boolean; message: string; crawlSessionsDeleted: number }> {
  const request = create(DeleteConnectorRequestSchema, {
    connectorId,
    hardDelete
  }) as DeleteConnectorRequest

  return connectorClient.deleteConnector(request)
}

/**
 * Rotate API key for a connector
 */
export async function rotateApiKey(
  connectorId: string,
  invalidateOldImmediately: boolean = false
): Promise<{ success: boolean; newApiKey: string; message: string }> {
  const request = create(RotateApiKeyRequestSchema, {
    connectorId,
    invalidateOldImmediately
  }) as RotateApiKeyRequest

  return connectorClient.rotateApiKey(request)
}
