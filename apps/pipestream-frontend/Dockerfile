# Multi-stage build for pipestream-frontend (monorepo)
# This creates a single container with both the backend proxy and frontend UI
#
# Build from monorepo root: docker build -f apps/pipestream-frontend/Dockerfile -t ai-pipestream/pipestream-frontend .
# Run: docker run -p 38106:38106 ai-pipestream/pipestream-frontend

# Stage 1: Build backend and frontend
FROM node:22-alpine AS builder

# Install bash and git (required for proto sync scripts and degit)
RUN apk add --no-cache bash git

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Set working directory to monorepo root
WORKDIR /app

# Copy monorepo workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy all package.json files for dependency resolution
COPY packages/connector-shared/package.json ./packages/connector-shared/
COPY packages/protobuf-forms/package.json ./packages/protobuf-forms/
COPY packages/shared-components/package.json ./packages/shared-components/
COPY packages/shared-nav/package.json ./packages/shared-nav/
COPY apps/pipestream-frontend/package.json ./apps/pipestream-frontend/
COPY apps/pipestream-frontend/ui/package.json ./apps/pipestream-frontend/ui/

# Install all dependencies (includes UI as workspace member)
RUN pnpm install --frozen-lockfile

# Copy source code for packages
COPY packages/ ./packages/

# Copy source code for pipestream-frontend
COPY apps/pipestream-frontend/src ./apps/pipestream-frontend/src
COPY apps/pipestream-frontend/ui ./apps/pipestream-frontend/ui
COPY apps/pipestream-frontend/tsconfig.json ./apps/pipestream-frontend/

# Build all packages and apps recursively (handles dependency order automatically)
RUN pnpm -r build

# Stage 2: Production runtime (minimal image)
FROM node:22-alpine AS runtime

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy monorepo workspace config
COPY --chown=nodejs:nodejs pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy package.json files for workspace
COPY --chown=nodejs:nodejs packages/connector-shared/package.json ./packages/connector-shared/
COPY --chown=nodejs:nodejs packages/protobuf-forms/package.json ./packages/protobuf-forms/
COPY --chown=nodejs:nodejs apps/pipestream-frontend/package.json ./apps/pipestream-frontend/

# Install production dependencies + tsx for TypeScript runtime
# (protobuf-forms exports TypeScript files directly)
RUN pnpm install --frozen-lockfile --prod && \
    npm install -g tsx && \
    pnpm store prune && \
    rm -rf /root/.local/share/pnpm/store

# Copy built packages
COPY --from=builder --chown=nodejs:nodejs /app/packages/connector-shared/dist ./packages/connector-shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/protobuf-forms/dist ./packages/protobuf-forms/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/protobuf-forms/src/generated ./packages/protobuf-forms/src/generated
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-components/dist ./packages/shared-components/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-nav/dist ./packages/shared-nav/dist

# Copy built backend
COPY --from=builder --chown=nodejs:nodejs /app/apps/pipestream-frontend/dist ./apps/pipestream-frontend/dist

# Copy built frontend (static assets)
# Vite builds to apps/pipestream-frontend/public
COPY --from=builder --chown=nodejs:nodejs /app/apps/pipestream-frontend/public ./apps/pipestream-frontend/public

# Switch to non-root user
USER nodejs

# Set working directory to app
WORKDIR /app/apps/pipestream-frontend

# Environment variables with sensible defaults
ENV NODE_ENV=production
ENV PORT=38106
ENV VITE_PORT=33000
ENV PLATFORM_REGISTRATION_HOST=platform-registration-service
ENV PLATFORM_REGISTRATION_PORT=38101

# Expose backend port (frontend is served as static files from backend)
EXPOSE 38106

# Health check - check if backend is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the application with tsx (needed for TypeScript proto imports)
CMD ["tsx", "dist/index.js"]
