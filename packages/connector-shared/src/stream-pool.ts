import { createClient, type Client } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import {
  ConnectorIntakeService,
  UploadBlobRequestSchema,
  type UploadBlobRequest,
  type UploadBlobResponse,
} from '@ai-pipestream/protobuf-forms/generated';
import { create } from '@bufbuild/protobuf';
import chalk from 'chalk';

// Configuration
const CONNECTOR_INTAKE_SERVICE_URL = process.env.CONNECTOR_INTAKE_SERVICE_URL || 'http://localhost:38108';

/**
 * Upload client for document uploads using the new unary API
 *
 * This replaces the old StreamPool which used client-side streaming.
 * The new API uses simple unary UploadBlob calls.
 */
export class UploadClient {
  private client: Client<typeof ConnectorIntakeService>;
  private datasourceId: string;
  private apiKey: string;
  private sessionId: string;

  constructor(
    datasourceId: string,
    apiKey: string,
    sessionId: string = ''
  ) {
    // Create gRPC transport
    const intakeTransport = createGrpcTransport({
      baseUrl: CONNECTOR_INTAKE_SERVICE_URL,
      idleConnectionTimeoutMs: 1000 * 60 * 10, // 10 minutes
    });

    // Create service client
    this.client = createClient(ConnectorIntakeService, intakeTransport);
    this.datasourceId = datasourceId;
    this.apiKey = apiKey;
    this.sessionId = sessionId;

    console.log(chalk.cyan(`Created upload client for datasource: ${datasourceId}`));
  }

  /**
   * Upload a blob (raw file content with metadata)
   */
  async uploadBlob(
    content: Uint8Array,
    filename: string,
    mimeType: string,
    path: string = '',
    metadata: Record<string, string> = {}
  ): Promise<{ success: boolean; docId?: string; message?: string }> {
    try {
      const request = create(UploadBlobRequestSchema, {
        datasourceId: this.datasourceId,
        apiKey: this.apiKey,
        sessionId: this.sessionId,
        filename,
        mimeType,
        path: path || filename,
        metadata,
        content,
      });

      console.log(chalk.gray(`Uploading: ${filename} (${content.length} bytes)`));

      const response = await this.client.uploadBlob(request);

      if (response.success) {
        console.log(chalk.green(`✓ Uploaded: ${filename} (doc_id: ${response.docId})`));
        return { success: true, docId: response.docId, message: response.message };
      } else {
        console.error(chalk.red(`✗ Failed: ${filename} - ${response.message}`));
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.error(chalk.red(`✗ Error uploading ${filename}: ${error.message}`));
      return { success: false, message: error.message };
    }
  }

  /**
   * Set the session ID for grouping uploads
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Get the datasource ID
   */
  getDataSourceId(): string {
    return this.datasourceId;
  }
}

/**
 * StreamPool is maintained for backward compatibility but now uses unary uploads
 * @deprecated Use UploadClient directly instead
 */
export class StreamPool {
  private uploadClient: UploadClient;

  constructor(
    datasourceId: string,
    apiKey: string,
    crawlId: string,
    _poolSize: number = 1 // poolSize is ignored in new API
  ) {
    this.uploadClient = new UploadClient(datasourceId, apiKey, crawlId);
    console.log(chalk.cyan(`StreamPool initialized (using unary API)`));
  }

  /**
   * Initialize is a no-op with the new unary API
   */
  async initialize(): Promise<void> {
    console.log(chalk.green(`✓ StreamPool ready (unary mode)`));
  }

  /**
   * Queue a document for upload
   * With the new API, this performs an immediate upload
   */
  async queueDocument(
    request: any,
    _waitForResponse: boolean = false,
    _documentRef?: string
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    // Extract document data from old-style request
    const doc = request.sessionInfo?.value;
    if (!doc) {
      return { success: false, error: 'Invalid request format' };
    }

    // Try to extract content from chunk if present
    let content: Uint8Array = new Uint8Array(0);
    if (doc.content?.case === 'chunk' && doc.content.value?.chunkType?.case === 'rawData') {
      content = doc.content.value.chunkType.value;
    }

    // Upload using the new unary API
    const result = await this.uploadClient.uploadBlob(
      content,
      doc.filename || 'unknown',
      doc.mimeType || 'application/octet-stream',
      doc.path || doc.sourceId || '',
      doc.sourceMetadata || {}
    );

    return {
      success: result.success,
      documentId: result.docId,
      error: result.message,
    };
  }

  /**
   * Close the pool (no-op with unary API)
   */
  async closeAll(): Promise<void> {
    console.log(chalk.green('✓ StreamPool closed'));
  }

  /**
   * Get pool statistics
   */
  getStats(): { total: number; active: number; closed: number } {
    return {
      total: 1,
      active: 1,
      closed: 0,
    };
  }
}