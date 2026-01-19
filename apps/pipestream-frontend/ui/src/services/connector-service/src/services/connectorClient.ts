import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { create } from '@bufbuild/protobuf'
import {
  DataSourceAdminService,
  DataSourceSchema,
  CreateDataSourceRequestSchema,
  UpdateDataSourceRequestSchema,
  GetDataSourceRequestSchema,
  ListDataSourcesRequestSchema,
  SetDataSourceStatusRequestSchema,
  DeleteDataSourceRequestSchema,
  RotateApiKeyRequestSchema,
  type DataSource,
  type CreateDataSourceRequest,
  type UpdateDataSourceRequest,
  type GetDataSourceRequest,
  type ListDataSourcesRequest,
  type SetDataSourceStatusRequest,
  type DeleteDataSourceRequest,
  type RotateApiKeyRequest
} from '@ai-pipestream/protobuf-forms/generated'

// Create transport to connect through web-proxy using binary format
// The web-proxy will route to connector-service based on the service definitions
const transport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true
})

// Create service client
export const dataSourceClient = createClient(DataSourceAdminService, transport)

// ============================================================================
// DATASOURCE OPERATIONS
// ============================================================================

/**
 * Create a new datasource
 */
export async function createDataSource(
  name: string,
  accountId: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; datasource_id: string; api_key: string; message: string }> {
  const request = create(CreateDataSourceRequestSchema, {
    name,
    accountId,
    metadata: metadata || {}
  }) as CreateDataSourceRequest

  const response = await dataSourceClient.createDataSource(request)
  
  if (!response.datasource) {
    throw new Error('Create response missing datasource data')
  }

  return {
    success: response.success,
    datasource_id: response.datasource.datasourceId,
    api_key: response.datasource.apiKey,
    message: response.message
  }
}

/**
 * Update an existing datasource
 */
export async function updateDataSource(
  datasourceId: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; message: string; datasource: DataSource }> {
  const request = create(UpdateDataSourceRequestSchema, {
    datasourceId,
    name: name || '',
    metadata: metadata || {}
  }) as UpdateDataSourceRequest

  const response = await dataSourceClient.updateDataSource(request)
  
  if (!response.datasource) {
    throw new Error('Update response missing datasource data')
  }
  
  return {
    success: response.success,
    message: response.message,
    datasource: response.datasource
  }
}

/**
 * Get a datasource by ID
 */
export async function getDataSource(datasourceId: string): Promise<DataSource> {
  const request = create(GetDataSourceRequestSchema, {
    datasourceId
  }) as GetDataSourceRequest

  const response = await dataSourceClient.getDataSource(request)
  if (!response.datasource) {
    throw new Error('Get response missing datasource data')
  }
  return response.datasource
}

/**
 * List datasources with optional filtering/pagination
 */
export async function listDataSources(options: {
  accountId?: string
  includeInactive?: boolean
  pageSize?: number
  pageToken?: string
} = {}): Promise<{ datasources: DataSource[]; nextPageToken: string; totalCount: number }> {
  const request = create(ListDataSourcesRequestSchema, {
    accountId: options.accountId || '',
    includeInactive: options.includeInactive ?? false,
    pageSize: options.pageSize ?? 50,
    pageToken: options.pageToken ?? ''
  }) as ListDataSourcesRequest

  const response = await dataSourceClient.listDataSources(request)
  return {
    datasources: response.datasources,
    nextPageToken: response.nextPageToken,
    totalCount: response.totalCount
  }
}

/**
 * Set datasource status (active/inactive)
 */
export async function setDataSourceStatus(
  datasourceId: string,
  active: boolean,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const request = create(SetDataSourceStatusRequestSchema, {
    datasourceId,
    active,
    reason: reason || ''
  }) as SetDataSourceStatusRequest

  return dataSourceClient.setDataSourceStatus(request)
}

/**
 * Delete a datasource (soft delete)
 */
export async function deleteDataSource(
  datasourceId: string,
  hardDelete: boolean = false
): Promise<{ success: boolean; message: string }> {
  const request = create(DeleteDataSourceRequestSchema, {
    datasourceId,
    hardDelete
  }) as DeleteDataSourceRequest

  return dataSourceClient.deleteDataSource(request)
}

/**
 * Rotate API key for a datasource
 */
export async function rotateApiKey(
  datasourceId: string,
  invalidateOldImmediately: boolean = false
): Promise<{ success: boolean; newApiKey: string; message: string }> {
  const request = create(RotateApiKeyRequestSchema, {
    datasourceId,
    invalidateOldImmediately
  }) as RotateApiKeyRequest

  return dataSourceClient.rotateApiKey(request)
}