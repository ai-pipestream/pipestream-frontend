/**
 * Shared utilities for file upload functionality
 */

/**
 * Format bytes into human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Upload statistics interface
 */
export interface UploadStats {
  documentsFound: number;
  documentsProcessed: number;
  documentsFailed: number;
  bytesProcessed: number;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  message: string;
  documentId?: string;
  stats?: UploadStats;
  errors?: string[];
  error?: string;
}

/**
 * File pattern options for UI
 */
export const PATTERN_OPTIONS = [
  { title: 'All Files', value: '**/*' },
  { title: 'Text Files (*.txt)', value: '*.txt' },
  { title: 'PDF Files (*.pdf)', value: '*.pdf' },
  { title: 'Images (*.jpg, *.jpeg, *.png)', value: '*.jpg,*.jpeg,*.png' },
  { title: 'Documents (*.doc, *.docx, *.pdf)', value: '*.doc,*.docx,*.pdf' },
  { title: 'Code Files (*.js, *.ts, *.py, *.java)', value: '*.js,*.ts,*.py,*.java' },
  { title: 'Data Files (*.json, *.csv, *.xml)', value: '*.json,*.csv,*.xml' }
];

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  API_BASE_URL: 'http://localhost:38109',
  ACCOUNT_ID: 'test-account-001',
  S3_BUCKET: 'test-bucket',
  S3_BASE_PATH: 'connectors/filesystem/',
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  DEFAULT_PATTERN: '**/*'
};

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number = DEFAULT_CONFIG.MAX_FILE_SIZE): boolean {
  return file.size <= maxSize;
}

/**
 * Get file MIME type
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Create upload progress handler
 */
export function createProgressHandler(
  onProgress: (progress: { percentage: number; text: string; color: string }) => void
) {
  return {
    start: (text: string = 'Starting upload...') => {
      onProgress({ percentage: 0, text, color: 'primary' });
    },
    update: (percentage: number, text: string) => {
      onProgress({ percentage, text, color: 'primary' });
    },
    complete: (text: string = 'Upload complete!') => {
      onProgress({ percentage: 100, text, color: 'success' });
    },
    error: (text: string = 'Upload failed!') => {
      onProgress({ percentage: 100, text, color: 'error' });
    }
  };
}