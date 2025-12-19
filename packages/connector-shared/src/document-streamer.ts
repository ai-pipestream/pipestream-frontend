/**
 * Document Streamer - Uses UploadClient for file uploads
 *
 * This replaces the old streaming protocol with the new unary UploadBlob API.
 * For large files, content is read and uploaded in a single request.
 */

import { createReadStream, type ReadStream } from 'fs';
import { stat, readFile } from 'fs/promises';
import { basename, relative } from 'path';
import mime from 'mime-types';
import chalk from 'chalk';
import { UploadClient, StreamPool } from './stream-pool.js';
import {
  StreamingHashCalculator,
  type FileMetadata,
} from './streaming-protocol.js';

/**
 * Document streamer that uses UploadClient for uploads
 */
export class DocumentStreamer {
  private uploadClient: UploadClient;
  private connectorId: string;
  private crawlId: string;

  constructor(streamPool: StreamPool, connectorId: string, crawlId: string) {
    // Create a new upload client directly
    // Note: streamPool is kept for backward compatibility but we use UploadClient directly
    this.uploadClient = new UploadClient(connectorId, '', crawlId);
    this.connectorId = connectorId;
    this.crawlId = crawlId;
  }

  /**
   * Stream a file from filesystem
   */
  async streamFile(
    filePath: string,
    basePath: string = ''
  ): Promise<{ success: boolean; documentId?: string; error?: string; sha256?: string }> {
    try {
      // Get file stats
      const stats = await stat(filePath);
      const fileName = basename(filePath);
      const relativePath = basePath ? relative(basePath, filePath) : fileName;
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';

      // Read the entire file
      const content = await readFile(filePath);
      const hashCalculator = new StreamingHashCalculator();
      hashCalculator.update(content);
      const sha256 = hashCalculator.getHashHex();

      // Create metadata
      const metadata: Record<string, string> = {
        'original-path': filePath,
        'file-size': stats.size.toString(),
        'sha256': sha256,
      };

      // Upload using the new unary API
      const result = await this.uploadClient.uploadBlob(
        content,
        fileName,
        mimeType,
        relativePath,
        metadata
      );

      if (result.success) {
        console.log(chalk.green(`✓ Uploaded: ${relativePath} (SHA256: ${sha256.substring(0, 16)}...)`));
        return { success: true, documentId: result.docId, sha256 };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      console.error(chalk.red(`Error streaming file ${filePath}: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Stream a file buffer from memory (for web uploads)
   */
  async streamFileBuffer(
    buffer: Buffer,
    fileName: string
  ): Promise<{ success: boolean; documentId?: string; error?: string; sha256?: string }> {
    try {
      const mimeType = mime.lookup(fileName) || 'application/octet-stream';

      // Calculate hash
      const hashCalculator = new StreamingHashCalculator();
      hashCalculator.update(buffer);
      const sha256 = hashCalculator.getHashHex();

      // Create metadata
      const metadata: Record<string, string> = {
        'file-size': buffer.length.toString(),
        'source': 'web-upload',
        'sha256': sha256,
      };

      // Upload using the new unary API
      const result = await this.uploadClient.uploadBlob(
        buffer,
        fileName,
        mimeType,
        fileName,
        metadata
      );

      if (result.success) {
        console.log(chalk.green(`✓ Uploaded: ${fileName} (SHA256: ${sha256.substring(0, 16)}...)`));
        return { success: true, documentId: result.docId, sha256 };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      console.error(chalk.red(`Error streaming buffer ${fileName}: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Stream a ReadStream from HTTP request (for web uploads)
   * Note: This now buffers the stream as the new API is unary
   */
  async streamFromReadStream(
    readStream: ReadStream | NodeJS.ReadableStream,
    fileName: string,
    fileSizeHint?: number
  ): Promise<{ success: boolean; documentId?: string; error?: string; sha256?: string }> {
    try {
      const mimeType = mime.lookup(fileName) || 'application/octet-stream';

      // Buffer the stream
      const chunks: Buffer[] = [];
      for await (const chunk of readStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      // Calculate hash
      const hashCalculator = new StreamingHashCalculator();
      hashCalculator.update(buffer);
      const sha256 = hashCalculator.getHashHex();

      // Create metadata
      const metadata: Record<string, string> = {
        'file-size': buffer.length.toString(),
        'source': 'web-upload-stream',
        'sha256': sha256,
      };

      // Upload using the new unary API
      const result = await this.uploadClient.uploadBlob(
        buffer,
        fileName,
        mimeType,
        fileName,
        metadata
      );

      if (result.success) {
        console.log(chalk.green(`✓ Uploaded (streamed): ${fileName} (SHA256: ${sha256.substring(0, 16)}...)`));
        return { success: true, documentId: result.docId, sha256 };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      console.error(chalk.red(`Error streaming ReadStream ${fileName}: ${error.message}`));
      return { success: false, error: error.message };
    }
  }
}
