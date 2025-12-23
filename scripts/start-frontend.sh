#!/bin/bash
# Start Platform Shell Frontend (Vite dev server)
# Port: 33000

set -e

# Source shared utilities
source "$(dirname "$0")/shared-utils.sh"

# Service configuration
SERVICE_NAME="Platform Shell Frontend"
SERVICE_PORT="33000"
DESCRIPTION="Vue.js UI with hot-reload"

PROJECT_ROOT="$(get_project_root)"
FRONTEND_DIR="$PROJECT_ROOT/apps/pipestream-frontend/ui"

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

# Check if frontend directory exists
if [[ ! -d "$FRONTEND_DIR" ]]; then
    print_status "error" "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Go to project root
cd "$PROJECT_ROOT" || exit 1

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_status "info" "Installing monorepo dependencies..."
    pnpm install
fi

# Build shared packages if not built
if [[ ! -d "packages/shared-components/dist" ]]; then
    print_status "info" "Building shared packages..."
    pnpm -r --filter './packages/*' build
fi

print_status "warning" "Note: Backend should be running on port 38106 for proxying"
print_status "success" "Starting frontend at http://localhost:$SERVICE_PORT"
print_status "info" "Press Ctrl+C to stop"
echo

# Start the frontend
cd "$FRONTEND_DIR"
exec pnpm run dev
