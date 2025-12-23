import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import {
  ConnectorIntakeService,
  DataSourceAdminService,
  type DataSource,
} from '@ai-pipestream/protobuf-forms/generated';
import chalk from 'chalk';

// Configuration
const CONNECTOR_INTAKE_SERVICE_URL = process.env.CONNECTOR_INTAKE_SERVICE_URL || 'http://localhost:38108';
const CONNECTOR_SERVICE_URL = process.env.CONNECTOR_SERVICE_URL || 'http://localhost:38107';

// Create gRPC transports
const intakeTransport = createGrpcTransport({
  baseUrl: CONNECTOR_INTAKE_SERVICE_URL,
  idleConnectionTimeoutMs: 1000 * 60 * 5, // 5 minutes
});

const connectorTransport = createGrpcTransport({
  baseUrl: CONNECTOR_SERVICE_URL,
  idleConnectionTimeoutMs: 1000 * 60 * 5, // 5 minutes
});

// Create service clients
const intakeClient = createClient(ConnectorIntakeService, intakeTransport);
const dataSourceAdminClient = createClient(DataSourceAdminService, connectorTransport);

/**
 * Connector client for managing filesystem connector operations
 */
export class ConnectorClient {
  private datasourceId: string | null = null;
  private apiKey: string | null = null;
  private datasourceConfig: DataSource | null = null;

  /**
   * Register or get existing datasource
   */
  async registerConnector(
    datasourceName: string,
    accountId: string,
    s3Bucket: string,
    s3BasePath: string
  ): Promise<{ datasourceId: string; apiKey: string }> {
    try {
      // Try to get existing datasource
      // Add timeout to prevent hanging
      const datasource = await Promise.race([
        dataSourceAdminClient.getDataSource({ datasourceId: datasourceName }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      const registration = datasource.datasource;
      if (!registration) {
        throw new Error('DataSource registration not found in response');
      }
      console.log(chalk.green(`✓ Using existing datasource: ${registration.datasourceId}`));
      this.datasourceId = registration.datasourceId;
      this.apiKey = registration.apiKey;
      return { datasourceId: registration.datasourceId, apiKey: registration.apiKey };
    } catch (error: any) {
      // DataSource doesn't exist, create it
      if (error.code === 'NOT_FOUND' || error.message?.includes('not found') || error.message === 'Timeout') {
        console.log(chalk.yellow(`Creating new datasource: ${datasourceName}`));
        
        const response = await dataSourceAdminClient.createDataSource({
          name: datasourceName,
          accountId: accountId,
          metadata: {
            'source': 'filesystem-connector',
            'connector-type': 'filesystem',
            's3_bucket': s3Bucket,
            's3_base_path': s3BasePath,
            'max_file_size': '104857600', // 100MB
            'rate_limit': '1000'
          }
        });

        console.log(chalk.green(`✓ Created datasource: ${response.datasource?.datasourceId}`));
        this.datasourceId = response.datasource?.datasourceId ?? '';
        this.apiKey = response.datasource?.apiKey ?? ''; 
        return { datasourceId: response.datasource?.datasourceId ?? '', apiKey: response.datasource?.apiKey ?? '' };
      }
      throw error;
    }
  }

  /**
   * Set credentials for an existing datasource (skip registration)
   */
  setCredentials(datasourceId: string, apiKey: string): void {
    this.datasourceId = datasourceId;
    this.apiKey = apiKey;
  }

  /**
   * Start a crawl session
   */
  async startCrawlSession(crawlId: string): Promise<string> {
    if (!this.datasourceId || !this.apiKey) {
      throw new Error('DataSource not registered. Call registerConnector() first.');
    }

    const response = await intakeClient.startCrawlSession({
      datasourceId: this.datasourceId,
      apiKey: this.apiKey,
      crawlId: crawlId,
      metadata: {
        connectorType: 'filesystem',
        connectorVersion: '1.0.0',
        sourceSystem: 'local-filesystem',
      },
      trackDocuments: true,
      deleteOrphans: false,
    });

    if (response.success) {
      console.log(chalk.green(`✓ Started crawl session: ${response.sessionId}`));
      return response.sessionId;
    } else {
      throw new Error(`Failed to start crawl session: ${response.message}`);
    }
  }

  /**
   * End a crawl session
   */
  async endCrawlSession(
    sessionId: string,
    crawlId: string,
    summary: {
      documentsFound: number;
      documentsProcessed: number;
      documentsFailed: number;
      bytesProcessed: number;
    }
  ): Promise<void> {
    const response = await intakeClient.endCrawlSession({
      sessionId: sessionId,
      crawlId: crawlId,
      summary: {
        documentsFound: summary.documentsFound,
        documentsProcessed: summary.documentsProcessed,
        documentsFailed: summary.documentsFailed,
        documentsSkipped: 0,
        bytesProcessed: BigInt(summary.bytesProcessed),
        started: {
          seconds: BigInt(Math.floor(Date.now() / 1000)),
          nanos: 0,
        },
        completed: {
          seconds: BigInt(Math.floor(Date.now() / 1000)),
          nanos: 0,
        },
      },
    });

    if (response.success) {
      console.log(chalk.green(`✓ Ended crawl session: ${sessionId}`));
      if (response.orphansFound > 0) {
        console.log(chalk.yellow(`  Found ${response.orphansFound} orphaned documents`));
      }
    } else {
      throw new Error(`Failed to end crawl session: ${response.message}`);
    }
  }

  /**
   * Send heartbeat
   */
  async sendHeartbeat(
    sessionId: string,
    crawlId: string,
    documentsQueued: number,
    documentsProcessing: number
  ): Promise<void> {
    await intakeClient.heartbeat({
      sessionId: sessionId,
      crawlId: crawlId,
      documentsQueued: documentsQueued,
      documentsProcessing: documentsProcessing,
      metrics: {
        'memory_used_mb': String(process.memoryUsage().heapUsed / 1024 / 1024),
        'cpu_percent': '0', // TODO: Add actual CPU monitoring
      },
    });
  }

  /**
   * Get datasource ID
   */
  getDataSourceId(): string {
    if (!this.datasourceId) {
      throw new Error('DataSource not registered');
    }
    return this.datasourceId;
  }

  /**
   * Get API key
   */
  getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('DataSource not registered');
    }
    return this.apiKey;
  }
}