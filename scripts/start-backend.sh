#!/bin/bash
# Start Platform Shell Backend (Express proxy)
# Port: 38106

set -e

# Source shared utilities
source "$(dirname "$0")/shared-utils.sh"

# Service configuration
SERVICE_NAME="Platform Shell Backend"
SERVICE_PORT="38106"
DESCRIPTION="Express proxy server"

PROJECT_ROOT="$(get_project_root)"
BACKEND_DIR="$PROJECT_ROOT/apps/pipestream-frontend"

print_status "header" "Starting $SERVICE_NAME"
print_status "info" "Port: $SERVICE_PORT"
print_status "info" "Description: $DESCRIPTION"

# Check if already running
if check_port "$SERVICE_PORT" "$SERVICE_NAME"; then
    print_status "info" "Service appears to be already running. Stop it? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        kill_process_on_port "$SERVICE_PORT" "$SERVICE_NAME"
    else
        print_status "info" "Continuing anyway..."
    fi
fi

# Check dependencies
check_node_version
ensure_pnpm

# Check if backend directory exists
if [[ ! -d "$BACKEND_DIR" ]]; then
    print_status "error" "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

# Go to project root
cd "$PROJECT_ROOT" || exit 1

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_status "info" "Installing monorepo dependencies..."
    pnpm install
fi

# Build packages if not built
if [[ ! -d "packages/connector-shared/dist" ]]; then
    print_status "info" "Building packages..."
    pnpm -r --filter './packages/*' build
fi

# Set environment variables
export PORT="$SERVICE_PORT"
export NODE_ENV="${NODE_ENV:-development}"
export PLATFORM_REGISTRATION_HOST="${PLATFORM_REGISTRATION_HOST:-localhost}"
export PLATFORM_REGISTRATION_PORT="${PLATFORM_REGISTRATION_PORT:-38101}"

print_status "success" "Starting backend at http://localhost:$SERVICE_PORT"
print_status "info" "Press Ctrl+C to stop"
echo

# Start the backend
cd "$BACKEND_DIR"
exec pnpm run dev
