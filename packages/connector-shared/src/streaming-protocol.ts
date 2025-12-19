/**
 * Document upload protocol helpers
 *
 * Protocol:
 *   - UploadBlob: Simple unary upload for raw file content with metadata
 *   - UploadPipeDoc: Upload of fully-formed PipeDoc objects
 */

import { createHash } from 'crypto';

// Configuration
export const DEFAULT_CHUNK_SIZE = parseInt(process.env.GRPC_CHUNK_SIZE || '10485760'); // 10MB default

/**
 * File metadata for uploads
 */
export interface FileMetadata {
  filename: string;
  path: string;
  mimeType: string;
  sizeBytes: bigint;
  sourceCreated?: Date;
  sourceModified?: Date;
  sourceMetadata?: Record<string, string>;
}

/**
 * Streaming hash calculator for computing SHA256 incrementally
 */
export class StreamingHashCalculator {
  private hash = createHash('sha256');
  private bytesProcessed = 0n;
  private cachedDigest: Buffer | null = null;

  /**
   * Update hash with new data chunk
   */
  update(chunk: Uint8Array): void {
    this.hash.update(chunk);
    this.bytesProcessed += BigInt(chunk.length);
  }

  /**
   * Get final digest (cached after first call)
   */
  private getDigest(): Buffer {
    if (!this.cachedDigest) {
      this.cachedDigest = this.hash.digest();
    }
    return this.cachedDigest;
  }

  /**
   * Get final SHA256 hash (base64)
   */
  getHashBase64(): string {
    return this.getDigest().toString('base64');
  }

  /**
   * Get final SHA256 hash (hex)
   */
  getHashHex(): string {
    return this.getDigest().toString('hex');
  }

  /**
   * Get total bytes processed
   */
  getBytesProcessed(): bigint {
    return this.bytesProcessed;
  }
}

/**
 * Helper to create a document reference
 */
export function createDocumentRef(connectorId: string, filePath: string, uniqueSuffix?: string): string {
  const suffix = uniqueSuffix || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return `${connectorId}:${filePath}:${suffix}`;
}

/**
 * Calculate SHA256 checksum for a buffer
 */
export function calculateChecksum(data: Uint8Array): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Calculate SHA256 checksum for a buffer (base64)
 */
export function calculateChecksumBase64(data: Uint8Array): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('base64');
}
