#!/bin/bash
# Run after buf generate to create index.ts barrel export
set -e

GENERATED_DIR="src/generated"
INDEX_FILE="$GENERATED_DIR/index.ts"

if [ ! -d "$GENERATED_DIR" ]; then
  echo "Error: $GENERATED_DIR does not exist. Run buf generate first."
  exit 1
fi

echo "Creating barrel export at $INDEX_FILE..."

cat > "$INDEX_FILE" << 'EOF'
// Auto-generated barrel export - do not edit manually
// Note: Some modules have conflicting type names and are exported with namespace prefixes

export * from './ai/pipestream/config/v1/pipeline_config_models_pb';
export * from './ai/pipestream/config/v1/pipeline_config_service_pb';
export * from './ai/pipestream/connector/intake/v1/connector_intake_service_pb';
export * from './ai/pipestream/connector/intake/v1/connector_registration_pb';
export * from './ai/pipestream/connector/intake/v1/document_upload_pb';
export * from './ai/pipestream/connector/v1/connector_types_pb';
export * from './ai/pipestream/data/module/v1/module_service_pb';
export * from './ai/pipestream/data/v1/pipeline_core_types_pb';
export * from './ai/pipestream/design/v1/design_mode_service_pb';

// Sidecar DlqMessage conflicts with pipeline_core_types DlqMessage - export with prefix
// Use 'export type' for type-only exports (types are erased at runtime)
export type { DlqMessage as SidecarDlqMessage } from './ai/pipestream/engine/sidecar/v1/dlq_message_pb';
export {
  DlqMessageSchema as SidecarDlqMessageSchema,
  file_ai_pipestream_engine_sidecar_v1_dlq_message,
} from './ai/pipestream/engine/sidecar/v1/dlq_message_pb';

export * from './ai/pipestream/engine/sidecar/v1/management_service_pb';
export * from './ai/pipestream/engine/v1/engine_service_pb';
export * from './ai/pipestream/engine/v1/pipeline_graph_service_pb';
export * from './ai/pipestream/events/v1/document_events_pb';
export * from './ai/pipestream/events/v1/repo_metadata_events_pb';
export * from './ai/pipestream/ingestion/v1/opensearch_ingestion_pb';
export * from './ai/pipestream/mapping/v1/mapping_service_pb';
export * from './ai/pipestream/opensearch/v1/opensearch_document_pb';
export * from './ai/pipestream/opensearch/v1/opensearch_manager_pb';
export * from './ai/pipestream/parsed/data/climate/v1/climate_forecast_metadata_pb';
export * from './ai/pipestream/parsed/data/creative_commons/v1/creative_commons_metadata_pb';
export * from './ai/pipestream/parsed/data/database/v1/database_metadata_pb';
export * from './ai/pipestream/parsed/data/dublin/v1/dublin_core_pb';
export * from './ai/pipestream/parsed/data/email/v1/email_metadata_pb';
export * from './ai/pipestream/parsed/data/epub/v1/epub_metadata_pb';
export * from './ai/pipestream/parsed/data/generic/v1/generic_metadata_pb';
export * from './ai/pipestream/parsed/data/html/v1/html_metadata_pb';
export * from './ai/pipestream/parsed/data/image/v1/image_metadata_pb';
export * from './ai/pipestream/parsed/data/media/v1/media_metadata_pb';
export * from './ai/pipestream/parsed/data/office/v1/office_metadata_pb';
export * from './ai/pipestream/parsed/data/pdf/v1/pdf_metadata_pb';
export * from './ai/pipestream/parsed/data/rtf/v1/rtf_metadata_pb';
export * from './ai/pipestream/parsed/data/tika/base/v1/tika_base_metadata_pb';
export * from './ai/pipestream/parsed/data/tika/font/v1/font_metadata_pb';
export * from './ai/pipestream/parsed/data/tika/v1/tika_response_pb';
export * from './ai/pipestream/parsed/data/warc/v1/warc_metadata_pb';
export * from './ai/pipestream/platform/registration/v1/platform_registration_pb';
export * from './ai/pipestream/processing/tika/v1/tika_parser_pb';
export * from './ai/pipestream/repository/account/v1/account_events_pb';
export * from './ai/pipestream/repository/account/v1/account_service_pb';
export * from './ai/pipestream/repository/crawler/v1/filesystem_crawler_pb';
export * from './ai/pipestream/repository/filesystem/upload/v1/upload_service_pb';
export * from './ai/pipestream/repository/filesystem/v1/filesystem_service_pb';
export * from './ai/pipestream/repository/filesystem/v1/repository_events_pb';
export * from './ai/pipestream/repository/pipedoc/v1/pipedoc_service_pb';

// Graph repository service has CreateGraphRequest/Response that conflict with pipeline_graph_service
// Use 'export type' for type-only exports (types are erased at runtime)
export type {
  CreateGraphRequest as RepoCreateGraphRequest,
  CreateGraphResponse as RepoCreateGraphResponse,
  DeleteGraphRequest as RepoDeleteGraphRequest,
  DeleteGraphResponse as RepoDeleteGraphResponse,
  GetGraphRequest as RepoGetGraphRequest,
  GetGraphResponse as RepoGetGraphResponse,
  ListGraphsRequest as RepoListGraphsRequest,
  ListGraphsResponse as RepoListGraphsResponse,
  UpdateGraphRequest as RepoUpdateGraphRequest,
  UpdateGraphResponse as RepoUpdateGraphResponse,
} from './ai/pipestream/repository/v1/graph_repository_service_pb';

export {
  CreateGraphRequestSchema as RepoCreateGraphRequestSchema,
  CreateGraphResponseSchema as RepoCreateGraphResponseSchema,
  DeleteGraphRequestSchema as RepoDeleteGraphRequestSchema,
  DeleteGraphResponseSchema as RepoDeleteGraphResponseSchema,
  GetGraphRequestSchema as RepoGetGraphRequestSchema,
  GetGraphResponseSchema as RepoGetGraphResponseSchema,
  ListGraphsRequestSchema as RepoListGraphsRequestSchema,
  ListGraphsResponseSchema as RepoListGraphsResponseSchema,
  UpdateGraphRequestSchema as RepoUpdateGraphRequestSchema,
  UpdateGraphResponseSchema as RepoUpdateGraphResponseSchema,
  file_ai_pipestream_repository_v1_graph_repository_service,
  GraphRepositoryService,
} from './ai/pipestream/repository/v1/graph_repository_service_pb';

export * from './ai/pipestream/repository/v1/repository_service_data_pb';
export * from './ai/pipestream/repository/v1/repository_service_pb';
export * from './ai/pipestream/schemamanager/v1/schema_manager_pb';
export * from './ai/pipestream/shell/v1/shell_service_pb';
export * from './ai/pipestream/testing/harness/v1/testing_harness_pb';
export * from './ai/pipestream/validation/v1/validation_service_pb';
export * from './grpc/health/v1/health_pb';
EOF

echo "Index file created successfully!"
