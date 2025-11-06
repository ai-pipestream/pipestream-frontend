import { createClient } from '@connectrpc/connect'
import { create } from '@bufbuild/protobuf'
import { PipeDocSchema, TagsSchema, BlobSchema, BlobBagSchema, SearchMetadataSchema } from '@io-pipeline/grpc-stubs/core'
import {
  PipeDocService,
  // ProcessRequestRepositoryService no longer exists after refactoring
  SearchMetadataSchema
} from '@io-pipeline/grpc-stubs/pipedoc'
import { createBinaryTransport } from '@io-pipeline/grpc-stubs'

// Type imports for TypeScript type checking only
import type { PipeDoc, Tags, Blob, BlobBag, SearchMetadata } from '@io-pipeline/grpc-stubs/pipedoc'

// Create transport to connect through web-proxy using binary format
// The web-proxy will route to repository-service based on the service definitions
const transport = createBinaryTransport()

// Create service clients
export const pipeDocClient = createClient(PipeDocService, transport)
// TODO: ProcessRequestRepositoryService was removed in refactor - needs new implementation
// export const processRequestClient = createClient(ProcessRequestRepositoryService, transport)

// ============================================================================
// PIPEDOC OPERATIONS
// ============================================================================

/**
 * Save (create or update) a PipeDoc in the repository
 */
export async function savePipeDoc(
  pipeDoc: PipeDoc,
  drive: string,
  connectorId: string
): Promise<{ nodeId: string }> {
  const response = await pipeDocClient.savePipeDoc({
    pipedoc: pipeDoc,
    drive,
    connectorId
  }) as any
  return {
    nodeId: response.nodeId
  }
}

/**
 * Legacy: Create a new PipeDoc (maps to savePipeDoc)
 */
export async function createPipeDoc(
  pipeDoc: PipeDoc,
  tags?: Tags,
  description?: string
): Promise<{ storageId: string; storedDocument?: any }> {
  // Build metadata from tags and description
  const metadata: Record<string, string> = {}
  if (description) {
    metadata.description = description
  }
  if (tags?.tagData) {
    Object.keys(tags.tagData).forEach((tag, idx) => {
      metadata[`tag_${idx}`] = tag
    })
  }

  const response = await pipeDocClient.savePipeDoc({
    pipedoc: pipeDoc,
    drive: 'pipedocs-drive',
    connectorId: 'web-ui',
    metadata
  }) as any

  return {
    storageId: response.nodeId,
    storedDocument: { pipeDoc }
  }
}

/**
 * List all stored PipeDocs
 */
export async function listPipeDocs(
  _pageSize = 20,
  _pageToken?: string,
  _filter?: string
): Promise<{
  documents: any[]
  nextPageToken: string
  totalCount: number
}> {
  const response = await pipeDocClient.listPipeDocs({
    drive: 'pipedocs-drive',
    connectorId: 'web-ui'
    // TODO: Add pagination support when proto supports it (limit, continuation_token)
  }) as any
  return {
    documents: response.pipedocs || [],
    nextPageToken: response.nextContinuationToken || '',
    totalCount: response.totalCount || response.pipedocs?.length || 0
  }
}

/**
 * Get a specific PipeDoc by node ID
 */
export async function getPipeDoc(nodeId: string) {
  const response = await pipeDocClient.getPipeDoc({ nodeId }) as any
  return {
    document: response.pipedoc,
    storageId: nodeId,
    id: nodeId
  }
}

/**
 * Update an existing PipeDoc
 * TODO: Backend needs update/delete endpoints - currently only has save/get/list
 */
export async function updatePipeDoc(
  _storageId: string,
  pipeDoc: PipeDoc,
  _tags?: Tags,
  _description?: string
) {
  // For now, use savePipeDoc which should upsert
  // TODO: Use tags and description when implemented
  return await savePipeDoc(pipeDoc, 'pipedocs-drive', 'web-ui')
}

/**
 * Delete a PipeDoc
 * TODO: Backend needs delete endpoint added to PipeDocService
 */
export async function deletePipeDoc(_storageId: string) {
  throw new Error('Delete not yet implemented in PipeDocService - needs backend RPC method')
}

/**
 * Upload a file and create a PipeDoc
 */
// export async function uploadFileAsPipeDoc(
//   file: File,
//   tags?: string[],
//   description?: string
// ): Promise<{ storageId: string; storedDocument?: any }> {
//   // Read file content
//   const arrayBuffer = await file.arrayBuffer()
//   const content = new Uint8Array(arrayBuffer)
// 
//   // Create Blob for the file content
//     blobId: crypto.randomUUID(),
//     // content is oneof: set via content property
//     content: { case: 'data', value: content },
//     mimeType: file.type || 'application/octet-stream',
//     filename: file.name,
//     sizeBytes: BigInt(file.size)
//   }
// 
//   // Create BlobBag containing the Blob
//     // oneof blobData: set blob
//     blobData: { case: 'blob', value: blob }
//   }Bag
// 
//   // Create SearchMetadata
//     title: file.name,
//     sourceUri: `file://${file.name}`,
//     sourceMimeType: file.type || 'application/octet-stream',
//     contentLength: file.size
//   }
// 
//   // Create PipeDoc with proper structure (docId will be assigned by the backend)
//     searchMetadata: searchMetadata,
//     blobBag: blobBag
//   }
// 
//   // Create Tags if provided
// 
//   return createPipeDoc(pipeDoc, tagObject, description)
// }

// ============================================================================
// MODULE PROCESS REQUEST OPERATIONS
// ============================================================================
// TODO: ProcessRequestRepositoryService was removed - needs reimplementation

export async function listProcessRequests(
  _pageSize = 20,
  _pageToken?: string,
  _filter?: string
): Promise<{
  requests: any[]
  nextPageToken: string
  totalCount: number
}> {
  throw new Error('ProcessRequestRepositoryService removed - needs reimplementation')
}

export async function deleteProcessRequest(_storageId: string) {
  throw new Error('ProcessRequestRepositoryService removed - needs reimplementation')
}

export async function createProcessRequestForPipeDoc(
  _pipeDocStorageId: string,
  _moduleName: string,
  _configuration?: Record<string, any>,
  _name?: string,
  _description?: string,
  _tags?: string[]
): Promise<{ storageId: string; storedRequest?: any }> {
  throw new Error('ProcessRequestRepositoryService removed - needs reimplementation')
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Upload multiple files as PipeDocs
 */
export async function uploadMultipleFiles(
  files: File[],
  defaultTags?: string[],
  description?: string,
  progressCallback?: (current: number, total: number) => void
): Promise<Array<{ file: File; result: { storageId: string } | { error: string } }>> {
  const results: Array<{ file: File; result: { storageId: string } | { error: string } }> = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    progressCallback?.(i + 1, files.length)

    try {
      const { storageId } = await uploadFileAsPipeDoc(file, defaultTags, description)
      results.push({ file, result: { storageId } })
    } catch (error: any) {
      results.push({ 
        file, 
        result: { error: error.message || 'Failed to upload' } 
      })
    }
  }

  return results
}

/**
 * Create multiple ProcessRequests for a batch of PipeDocs
 */
export async function createBatchProcessRequests(
  pipeDocStorageIds: string[],
  moduleName: string,
  configuration?: Record<string, any>,
  progressCallback?: (current: number, total: number) => void
): Promise<Array<{ pipeDocId: string; result: { storageId: string } | { error: string } }>> {
  const results: Array<{ pipeDocId: string; result: { storageId: string } | { error: string } }> = []

  for (let i = 0; i < pipeDocStorageIds.length; i++) {
    const pipeDocId = pipeDocStorageIds[i]
    progressCallback?.(i + 1, pipeDocStorageIds.length)

    try {
      const { storageId } = await createProcessRequestForPipeDoc(
        pipeDocId,
        moduleName,
        configuration
      )
      results.push({ pipeDocId, result: { storageId } })
    } catch (error: any) {
      results.push({ 
        pipeDocId, 
        result: { error: error.message || 'Failed to create process request' } 
      })
    }
  }

  return results
}