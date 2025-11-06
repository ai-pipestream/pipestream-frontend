/**
 * Shared API client for upload functionality
 * Can be used by both main app and standalone server
 */

import { UploadResult, UploadStats, DEFAULT_CONFIG } from './upload-utils.js';

export interface UploadApiClientConfig {
  baseUrl?: string;
  timeout?: number;
}

export class UploadApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: UploadApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_CONFIG.API_BASE_URL;
    this.timeout = config.timeout || 30000; // 30 seconds
  }

  /**
   * Upload a single file
   */
  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/upload/file`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json() as UploadResult;
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Upload failed: ${error.message}`
      };
    }
  }

  /**
   * Upload a file by path
   */
  async uploadFileByPath(filePath: string): Promise<UploadResult> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/upload/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });

      const result = await response.json() as UploadResult;
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Upload failed: ${error.message}`
      };
    }
  }

  /**
   * Upload a folder
   */
  async uploadFolder(
    folderPath: string, 
    pattern: string = '**/*', 
    workers: number = 1
  ): Promise<UploadResult> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/upload/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          pattern,
          workers
        })
      });

      const result = await response.json() as UploadResult;
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Folder upload failed: ${error.message}`
      };
    }
  }

  /**
   * Check connector status
   */
  async checkStatus(): Promise<{ initialized: boolean; sessionId?: string }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
      const data = await response.json() as { connectorId: string; sessionId?: string };
      return {
        initialized: data.connectorId === 'initialized',
        sessionId: data.sessionId
      };
    } catch (error: any) {
      return {
        initialized: false
      };
    }
  }

  /**
   * Get upload status for a session
   */
  async getUploadStatus(sessionId: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/upload/status/${sessionId}`);
      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to get upload status: ${error.message}`);
    }
  }

  /**
   * Cancel upload session
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/upload/session/${sessionId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error: any) {
      console.error('Failed to cancel session:', error);
      return false;
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

/**
 * Create a default API client instance
 */
export function createUploadApiClient(config?: UploadApiClientConfig): UploadApiClient {
  return new UploadApiClient(config);
}