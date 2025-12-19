# GitLab Setup Guide

This guide covers how to set up the platform-frontend for GitLab CI/CD and local development when syncing protos from a private GitLab instance.

## Overview

The project supports dual deployment:
- **GitHub** (public): Uses default settings, syncs protos from `ai-pipestream/pipestream-protos`
- **GitLab** (private): Configurable via environment variables, syncs from your GitLab instance

## Local Development Setup

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for container builds)
- Git access to your GitLab protos repository

### 1. Clone and Install

```bash
git clone <your-gitlab-repo>/pipestream-frontend.git
cd pipestream-frontend
pnpm install
```

### 2. Configure Proto Sync for GitLab

Set environment variables to point to your GitLab protos:

```bash
# Required: Your GitLab protos repository (without https:// prefix)
export PROTO_REPO="gitlab.yourcompany.com/your-group/pipestream-protos"

# Required: Use GitLab provider
export PROTO_PROVIDER="gitlab"

# Optional: Branch to sync from (default: main)
export PROTO_BRANCH="main"

# Required for private repos: Personal Access Token with read_repository scope
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"
```

You can add these to your shell profile (`~/.bashrc`, `~/.zshrc`) or create a `.env.local` file:

```bash
# .env.local (do not commit this file)
PROTO_REPO=gitlab.yourcompany.com/your-group/pipestream-protos
PROTO_PROVIDER=gitlab
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

Then source it before running commands:
```bash
source .env.local
```

### 3. Build the Project

```bash
# Sync protos and build all packages
pnpm -r build

# Or just sync protos
cd packages/protobuf-forms
pnpm proto:build
```

### 4. Run Development Server

```bash
# Start both backend and frontend in dev mode
pnpm run dev:all
```

- Backend: http://localhost:38106
- Frontend: http://localhost:33000

## Docker Local Build

### Build the Image

```bash
# From the monorepo root
docker build -f apps/platform-shell/Dockerfile -t platform-shell:local .
```

### Push to GitLab Container Registry

```bash
# Login to GitLab Container Registry
docker login registry.gitlab.yourcompany.com
# Enter your GitLab username and personal access token (with read_registry, write_registry scopes)

# Tag for GitLab registry
# Format: registry.gitlab.yourcompany.com/<group>/<project>/<image>:<tag>
docker tag platform-shell:local \
  registry.gitlab.yourcompany.com/your-group/pipestream-frontend/platform-shell:latest

# Push
docker push registry.gitlab.yourcompany.com/your-group/pipestream-frontend/platform-shell:latest
```

#### Multi-arch Build and Push

For ARM64 support (e.g., Apple Silicon, AWS Graviton):

```bash
# Create a builder with multi-arch support
docker buildx create --name multiarch --use

# Build and push multi-arch image directly
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  -t registry.gitlab.yourcompany.com/your-group/pipestream-frontend/platform-shell:latest \
  -f apps/platform-shell/Dockerfile \
  .
```

### Run the Container

```bash
# Basic run
docker run -p 38106:38106 platform-shell:local

# With environment overrides
docker run -p 38106:38106 \
  -e PLATFORM_REGISTRATION_HOST=host.docker.internal \
  -e PLATFORM_REGISTRATION_PORT=38101 \
  platform-shell:local
```

### Run with Backend Services

If you have the platform-registration-service running:

```bash
# Create a network
docker network create pipestream

# Run registration service (example)
docker run -d --name registration --network pipestream \
  -p 38101:38101 \
  your-registry/platform-registration-service:latest

# Run frontend
docker run -d --name frontend --network pipestream \
  -p 38106:38106 \
  -e PLATFORM_REGISTRATION_HOST=registration \
  -e PLATFORM_REGISTRATION_PORT=38101 \
  platform-shell:local
```

## GitLab CI/CD Setup

### 1. Copy the CI Template

```bash
cp .gitlab-ci.yml.template .gitlab-ci.yml
```

### 2. Configure CI/CD Variables

Go to **Settings → CI/CD → Variables** in your GitLab project and add:

| Variable | Value | Protected | Masked |
|----------|-------|-----------|--------|
| `PROTO_REPO` | `gitlab.yourcompany.com/your-group/pipestream-protos` | No | No |
| `DOCKER_HUB_USER` | (optional) Docker Hub username | Yes | No |
| `DOCKER_HUB_TOKEN` | (optional) Docker Hub token | Yes | Yes |

**Note:** `CI_JOB_TOKEN` is automatically provided and grants access to repositories in the same GitLab group.

### 3. Ensure Same-Group Access

For `CI_JOB_TOKEN` to work, both repositories must be in the same GitLab group:

```
your-group/
├── pipestream-protos      # Proto definitions
├── pipestream-frontend    # This project
└── platform-registration-service  # Backend
```

If they're in different groups, you'll need a deploy token or project access token with `read_repository` scope, stored as a CI variable.

### 4. Pipeline Stages

The GitLab CI pipeline runs these stages:

1. **build**: Install dependencies, sync protos, build all packages
2. **package**: Build multi-arch Docker image (amd64 + arm64)
3. **test**: Run Trivy CVE scan, test container startup
4. **publish**: (optional) Push to Docker Hub

### 5. Container Registry

GitLab CI automatically pushes images to your project's container registry:

```
registry.gitlab.yourcompany.com/<group>/pipestream-frontend/platform-shell:<tag>
```

Tags created:
- `:<commit-sha>` - Every build
- `:<branch-name>` - Latest for each branch
- `:latest` - Only on default branch (main)

**Pull the image:**
```bash
# Login
docker login registry.gitlab.yourcompany.com

# Pull
docker pull registry.gitlab.yourcompany.com/your-group/pipestream-frontend/platform-shell:latest
```

**Use in docker-compose or Kubernetes:**
```yaml
# docker-compose.yml
services:
  frontend:
    image: registry.gitlab.yourcompany.com/your-group/pipestream-frontend/platform-shell:latest
    ports:
      - "38106:38106"
    environment:
      - PLATFORM_REGISTRATION_HOST=registration
```

```yaml
# kubernetes deployment
spec:
  containers:
    - name: frontend
      image: registry.gitlab.yourcompany.com/your-group/pipestream-frontend/platform-shell:latest
      imagePullSecrets:
        - name: gitlab-registry-secret
```

## Environment Variables Reference

### Proto Sync Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PROTO_PROVIDER` | `github` or `gitlab` | `github` |
| `PROTO_REPO` | Repository path | `ai-pipestream/pipestream-protos` |
| `PROTO_BRANCH` | Branch to sync | `main` |
| `GITLAB_TOKEN` | GitLab personal/deploy token | - |
| `GITHUB_TOKEN` | GitHub token (for private repos) | - |
| `CI_JOB_TOKEN` | Auto-provided in GitLab CI | - |

### Runtime Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `38106` |
| `NODE_ENV` | Environment mode | `production` |
| `PLATFORM_REGISTRATION_HOST` | Registration service host | `platform-registration-service` |
| `PLATFORM_REGISTRATION_PORT` | Registration service port | `38101` |

## File Structure

```
pipestream-frontend/
├── .github/workflows/           # GitHub Actions (public CI)
├── .gitlab-ci.yml.template      # GitLab CI template
├── apps/
│   └── platform-shell/
│       ├── Dockerfile           # Full build (syncs protos in Docker)
│       ├── Dockerfile.gitlab    # Uses pre-built CI artifacts
│       └── src/
├── packages/
│   └── protobuf-forms/
│       ├── scripts/
│       │   └── sync-protos.sh   # Supports both GitHub and GitLab
│       └── src/generated/       # Generated proto TypeScript files
└── README-gitlab.md             # This file
```

## Dockerfile Variants

### `Dockerfile` (Full Build)
- Syncs protos during Docker build
- Requires `bash` and `git` in builder stage
- Self-contained, works anywhere
- Used by GitHub Actions

### `Dockerfile.gitlab` (CI Artifacts)
- Uses pre-built artifacts from CI
- Faster builds (no proto sync in Docker)
- No git credentials needed in Docker
- Used by GitLab CI

## Troubleshooting

### Proto sync fails with authentication error

```
fatal: Authentication failed for 'https://gitlab.yourcompany.com/...'
```

**Solution:** Set `GITLAB_TOKEN` with a valid personal access token:
```bash
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"
```

### Container can't find platform-registration-service

```
Error: getaddrinfo ENOTFOUND platform-registration-service
```

**Solution:** This is expected if the backend isn't running. The frontend will show an error page but still function. Set the correct host:
```bash
docker run -e PLATFORM_REGISTRATION_HOST=<your-host> ...
```

### Module not found errors for protos

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../pipeline_config_models_pb'
```

**Solution:** The container uses `tsx` to run TypeScript. Ensure you're using the latest Dockerfile that includes:
```dockerfile
RUN npm install -g tsx
CMD ["tsx", "dist/index.js"]
```

### GitLab CI can't access protos repo

```
remote: The project you were looking for could not be found
```

**Solution:** Ensure both repos are in the same GitLab group for `CI_JOB_TOKEN` to work. Or add a deploy token as `GITLAB_TOKEN` CI variable.

## Syncing Updates from Public Repository

If you forked from the public GitHub repo and want to pull updates:

```bash
# Add upstream remote (one time)
git remote add upstream https://github.com/ai-pipestream/pipestream-frontend.git

# Fetch and merge updates
git fetch upstream
git merge upstream/main

# Resolve any conflicts, then push to your GitLab
git push origin main
```

## Security Notes

1. **Never commit tokens** - Use CI/CD variables or local `.env` files
2. **Use deploy tokens** - For CI access, prefer deploy tokens over personal tokens
3. **Rotate tokens regularly** - Especially if they have write access
4. **Check Trivy reports** - Review CVE scan results in the CI pipeline
