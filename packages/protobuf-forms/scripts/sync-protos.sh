#!/bin/bash
set -e

REPO="ai-pipestream/pipestream-protos"  # GitHub org/repo
BRANCH="${PROTO_BRANCH:-main}"
DEST="proto"
TEMP_DIR=".proto-temp"

echo "Syncing protos from $REPO (branch: $BRANCH)..."

# Clean up
rm -rf "$DEST" "$TEMP_DIR"
mkdir -p "$DEST"

# Clone repo using degit (no git history)
npx degit "$REPO#$BRANCH" "$TEMP_DIR"

# Copy all proto files from each module
for module in common admin config design engine intake linear-processor opensearch parser pipeline-module registration repo schemamanager testing-harness ui-ux; do
  if [ -d "$TEMP_DIR/$module/proto" ]; then
    cp -r "$TEMP_DIR/$module/proto/"* "$DEST/"
    echo "  ✓ Copied $module protos"
  fi
done

# Clean up temp
rm -rf "$TEMP_DIR"

echo "Proto sync complete!"
