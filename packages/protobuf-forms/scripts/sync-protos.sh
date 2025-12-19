#!/bin/bash
set -e

# Configuration via environment variables
# For GitHub (default): PROTO_REPO="ai-pipestream/pipestream-protos"
# For GitLab: PROTO_REPO="gitlab.example.com/group/pipestream-protos" PROTO_PROVIDER="gitlab"

PROTO_REPO="${PROTO_REPO:-ai-pipestream/pipestream-protos}"
PROTO_PROVIDER="${PROTO_PROVIDER:-github}"  # github or gitlab
BRANCH="${PROTO_BRANCH:-main}"
DEST="proto"
TEMP_DIR=".proto-temp"

echo "Syncing protos from $PROTO_REPO (branch: $BRANCH, provider: $PROTO_PROVIDER)..."

# Clean up
rm -rf "$DEST" "$TEMP_DIR"
mkdir -p "$DEST"

if [ "$PROTO_PROVIDER" = "gitlab" ]; then
  # GitLab: use git clone with CI_JOB_TOKEN or GITLAB_TOKEN
  if [ -n "$CI_JOB_TOKEN" ]; then
    # Running in GitLab CI - use job token
    GIT_URL="https://gitlab-ci-token:${CI_JOB_TOKEN}@${PROTO_REPO}.git"
  elif [ -n "$GITLAB_TOKEN" ]; then
    # Manual run with personal/deploy token
    GIT_URL="https://oauth2:${GITLAB_TOKEN}@${PROTO_REPO}.git"
  else
    # Try without auth (public repo)
    GIT_URL="https://${PROTO_REPO}.git"
  fi

  echo "Cloning from GitLab..."
  git clone --depth 1 --branch "$BRANCH" "$GIT_URL" "$TEMP_DIR"
else
  # GitHub: use degit (fast, no auth needed for public repos)
  if [ -n "$GITHUB_TOKEN" ]; then
    # Private repo - use git clone with token
    GIT_URL="https://${GITHUB_TOKEN}@github.com/${PROTO_REPO}.git"
    git clone --depth 1 --branch "$BRANCH" "$GIT_URL" "$TEMP_DIR"
  else
    # Public repo - use degit
    npx degit "$PROTO_REPO#$BRANCH" "$TEMP_DIR"
  fi
fi

# Copy all proto files from each module
for module in common admin config design engine intake linear-processor opensearch parser pipeline-module registration repo schemamanager testing-harness ui-ux; do
  if [ -d "$TEMP_DIR/$module/proto" ]; then
    cp -r "$TEMP_DIR/$module/proto/"* "$DEST/"
    echo "  ✓ Copied $module protos"
  fi
done

# Clean up temp (including .git if cloned)
rm -rf "$TEMP_DIR"

echo "Proto sync complete!"
