#!/bin/bash
# Start Platform Shell (Backend + Frontend together)
# Backend Port: 38106
# Frontend Port: 33000

set -e

# Source shared utilities
source "$(dirname "$0")/shared-utils.sh"

# Service configuration
SERVICE_NAME="Platform Shell"
BACKEND_PORT="38106"
FRONTEND_PORT="33000"

PROJECT_ROOT="$(get_project_root)"
SHELL_DIR="$PROJECT_ROOT/apps/pipestream-frontend"

print_status "header" "Starting $SERVICE_NAME"
print_status "info" "Backend Port: $BACKEND_PORT"
print_status "info" "Frontend Port: $FRONTEND_PORT"

# Check if already running
if check_port "$BACKEND_PORT" "Backend"; then
    print_status "warning" "Backend port $BACKEND_PORT is already in use"
fi

if check_port "$FRONTEND_PORT" "Frontend"; then
    print_status "warning" "Frontend port $FRONTEND_PORT is already in use"
fi

# Check dependencies
check_node_version
ensure_pnpm

# Check if pipestream-frontend directory exists
if [[ ! -d "$SHELL_DIR" ]]; then
    print_status "error" "Platform shell directory not found: $SHELL_DIR"
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
if [[ ! -d "packages/connector-shared/dist" ]] || [[ ! -d "packages/shared-components/dist" ]]; then
    print_status "info" "Building packages..."
    pnpm -r --filter './packages/*' build
fi

# Set environment variables
export NODE_ENV="${NODE_ENV:-development}"
export PORT="$BACKEND_PORT"
export PLATFORM_REGISTRATION_HOST="${PLATFORM_REGISTRATION_HOST:-localhost}"
export PLATFORM_REGISTRATION_PORT="${PLATFORM_REGISTRATION_PORT:-38101}"

print_status "success" "Starting both backend and frontend with hot-reload"
print_status "info" "Backend: http://localhost:$BACKEND_PORT"
print_status "info" "Frontend: http://localhost:$FRONTEND_PORT"
print_status "info" "Press Ctrl+C to stop both services"
echo

# Start both services using concurrently
cd "$SHELL_DIR"
exec pnpm run dev:all
