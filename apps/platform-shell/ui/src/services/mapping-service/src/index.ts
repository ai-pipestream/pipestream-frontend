/**
 * Mapping Service UI Exports
 * 
 * This module exports reusable components and utilities from the mapping service.
 * These can be imported by other services in the pipeline platform.
 */

// Export all components
export * from './components'

// Export component utilities if needed
export const mappingServiceInfo = {
  name: '@io-pipeline/mapping-service-ui',
  version: '1.0.0',
  components: [
    'PipeDocPreview',
    'ComponentGallery'
  ]
}