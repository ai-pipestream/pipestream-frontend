/**
 * Mapping Service Components
 * 
 * Re-export shared components for local use
 */

// Re-export what we need from shared-components
export { 
  PipeDocPreview,
  ComponentGallery,
  componentMetadata 
} from '@io-pipeline/shared-components'

// Re-export types that components might need
export type { PipeDoc } from '@io-pipeline/grpc-stubs/pipedoc'