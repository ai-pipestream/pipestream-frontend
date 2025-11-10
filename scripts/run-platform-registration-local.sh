#!/bin/bash

# Script to build and run platform-registration-service locally for frontend development
# This mimics the CI/CD process but runs the container locally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGISTRATION_SERVICE_DIR="/home/krickert/IdeaProjects/ai-pipestream/platform-registration-service"
CONTAINER_NAME="platform-registration-local"
HOST_PORT="38101"
CONTAINER_PORT="8080"

echo "================================================"
echo "Platform Registration Service - Local Runner"
echo "================================================"
echo ""

# Check if the service directory exists
if [ ! -d "$REGISTRATION_SERVICE_DIR" ]; then
  echo "❌ Error: platform-registration-service directory not found at:"
  echo "   $REGISTRATION_SERVICE_DIR"
  exit 1
fi

# Step 1: Build the Docker image
echo "📦 Step 1: Building Docker image..."
echo "   Location: $REGISTRATION_SERVICE_DIR"
cd "$REGISTRATION_SERVICE_DIR"

./gradlew build -Dquarkus.container-image.build=true

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Docker image built successfully"
echo ""

# Step 2: Check if container already exists
echo "🔍 Step 2: Checking for existing container..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "   Found existing container, removing..."
  docker rm -f "$CONTAINER_NAME"
fi

# Step 3: Check if required infrastructure is running
echo "🔍 Step 3: Checking infrastructure dependencies..."
REQUIRED_CONTAINERS=("pipeline-mysql" "pipeline-consul")
MISSING_CONTAINERS=()

for container in "${REQUIRED_CONTAINERS[@]}"; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    MISSING_CONTAINERS+=("$container")
  fi
done

if [ ${#MISSING_CONTAINERS[@]} -gt 0 ]; then
  echo "⚠️  Warning: The following infrastructure containers are not running:"
  for container in "${MISSING_CONTAINERS[@]}"; do
    echo "   - $container"
  done
  echo ""
  echo "   The service requires MySQL and Consul to be running."
  echo "   You may need to start the devservices infrastructure stack."
  echo ""
  read -p "   Do you want to continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "   Aborted."
    exit 1
  fi
fi

# Step 4: Run the container
echo "🚀 Step 4: Starting container..."

docker run -d \
  --name "$CONTAINER_NAME" \
  --network pipeline-shared-devservices_pipeline-test-network \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  -e QUARKUS_HTTP_PORT="$CONTAINER_PORT" \
  -e QUARKUS_DATASOURCE_JDBC_URL="jdbc:mysql://pipeline-mysql:3306/pipeline" \
  -e QUARKUS_DATASOURCE_USERNAME="pipeline" \
  -e QUARKUS_DATASOURCE_PASSWORD="password" \
  -e QUARKUS_DATASOURCE_REACTIVE_URL="mysql://pipeline-mysql:3306/pipeline" \
  -e PIPELINE_CONSUL_HOST="pipeline-consul" \
  -e PIPELINE_CONSUL_PORT="8500" \
  -e KAFKA_BOOTSTRAP_SERVERS="pipeline-kafka:9092" \
  -e MP_MESSAGING_CONNECTOR_SMALLRYE_KAFKA_APICURIO_REGISTRY_URL="http://pipeline-apicurio-registry:8080/apis/registry/v3" \
  -e QUARKUS_LOG_LEVEL="INFO" \
  -e QUARKUS_LOG_CATEGORY_IO_PIPELINE_LEVEL="DEBUG" \
  ghcr.io/ai-pipestream/platform-registration-service:latest

if [ $? -ne 0 ]; then
  echo "❌ Failed to start container!"
  exit 1
fi

echo "✅ Container started successfully"
echo ""

# Step 5: Wait for service to be ready
echo "⏳ Step 5: Waiting for service to be ready..."
RETRIES=30
WAIT_SECONDS=2

for i in $(seq 1 $RETRIES); do
  if curl -s -f "http://localhost:${HOST_PORT}/q/health/ready" > /dev/null 2>&1; then
    echo "✅ Service is ready!"
    break
  fi

  if [ $i -eq $RETRIES ]; then
    echo "⚠️  Service did not become ready after ${RETRIES} attempts"
    echo "   Check logs with: docker logs $CONTAINER_NAME"
  else
    echo "   Attempt $i/$RETRIES - waiting ${WAIT_SECONDS}s..."
    sleep $WAIT_SECONDS
  fi
done

echo ""
echo "================================================"
echo "✨ Platform Registration Service is running!"
echo "================================================"
echo ""
echo "Container name: $CONTAINER_NAME"
echo "Service URL:    http://localhost:${HOST_PORT}"
echo ""
echo "Health checks:"
echo "  Readiness:  curl http://localhost:${HOST_PORT}/q/health/ready"
echo "  Liveness:   curl http://localhost:${HOST_PORT}/q/health/live"
echo "  Full status: curl http://localhost:${HOST_PORT}/q/health"
echo ""
echo "View logs:"
echo "  docker logs -f $CONTAINER_NAME"
echo ""
echo "Stop container:"
echo "  docker stop $CONTAINER_NAME"
echo ""
echo "Remove container:"
echo "  docker rm $CONTAINER_NAME"
echo ""
