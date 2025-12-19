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

echo "// Auto-generated barrel export - do not edit manually" > "$INDEX_FILE"
echo "// Generated at $(date -Iseconds)" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

# Only export ai.pipestream protos - skip google/grpc buf dependencies to avoid duplicates
# Also export grpc.health.v1 since we use it for health checks
find "$GENERATED_DIR/ai" -name "*.ts" ! -name "index.ts" -type f 2>/dev/null | sort | while read file; do
  relative=$(echo "$file" | sed "s|$GENERATED_DIR/||" | sed 's|\.ts$||')
  echo "export * from './$relative';" >> "$INDEX_FILE"
done

# Export only grpc health (needed for ServingStatus enum)
if [ -f "$GENERATED_DIR/grpc/health/v1/health_pb.ts" ]; then
  echo "export * from './grpc/health/v1/health_pb';" >> "$INDEX_FILE"
fi

echo "Index file created successfully!"
