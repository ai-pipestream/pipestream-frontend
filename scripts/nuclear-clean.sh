#!/bin/bash

# Nuclear clean - removes ALL caches and forces complete reinstall
# Use this when you're absolutely sure you want to start fresh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

echo "================================================"
echo "🔥 NUCLEAR CLEAN - Complete Cache Wipe"
echo "================================================"
echo ""
echo "⚠️  WARNING: This will delete:"
echo "  - All node_modules"
echo "  - pnpm lock file"
echo "  - pnpm store cache"
echo "  - All Vite caches"
echo "  - All build outputs"
echo ""
read -p "Are you ABSOLUTELY sure? (type 'yes' to continue): " -r
if [[ ! "$REPLY" == "yes" ]]; then
  echo "Cancelled."
  exit 0
fi

cd "$PROJECT_ROOT"

echo ""
echo "🗑️  Step 1: Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} +
echo "✅ node_modules deleted"

echo ""
echo "🗑️  Step 2: Removing lock files..."
find . -name "pnpm-lock.yaml" -delete
echo "✅ Lock files deleted"

echo ""
echo "🗑️  Step 3: Clearing pnpm store cache..."
pnpm store prune
echo "✅ pnpm store pruned"

echo ""
echo "🗑️  Step 4: Removing Vite caches..."
find . -name ".vite" -type d -prune -exec rm -rf {} +
echo "✅ Vite caches deleted"

echo ""
echo "🗑️  Step 5: Removing dist and build outputs..."
find . -name "dist" -type d -prune -exec rm -rf {} +
find . -name ".turbo" -type d -prune -exec rm -rf {} +
echo "✅ Build outputs deleted"

echo ""
echo "📦 Step 6: Fresh install..."
pnpm install

if [ $? -ne 0 ]; then
  echo "❌ Install failed!"
  exit 1
fi

echo "✅ Fresh install complete"

echo ""
echo "================================================"
echo "✨ Nuclear clean complete!"
echo "================================================"
echo ""
echo "Everything has been wiped and reinstalled fresh."
echo "You can now start the dev server:"
echo "  ./scripts/start-pipestream-frontend.sh"
echo ""
