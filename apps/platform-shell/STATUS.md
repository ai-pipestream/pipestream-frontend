# Platform Shell - Setup Status

## ✅ Completed

1. **Repository created**: https://git.rokkon.com/io-pipeline/platform-shell
2. **Code copied** from pipeline-engine-refactor/node/applications/web-proxy
3. **Renamed**: web-proxy → platform-shell (better name, no grpc-web confusion)
4. **Dependencies updated**:
   - Changed from `workspace:*` to published `@io-pipeline/*` packages
   - Updated scope: `@pipeline/*` → `@io-pipeline/*`
   - Using published versions: `^1.0.0`
5. **Import statements updated**: All source files updated to use `@io-pipeline/*`
6. **package.json updated**: Both root and ui/
7. **.npmrc created**: Points to Gitea registry for consuming packages
8. **README.md created**: Usage and deployment docs
9. **CI/CD workflow created**: `.gitea/workflows/build-and-publish.yml`
10. **.gitignore created**: Standard Node.js ignores

## 🔄 Awaiting

**grpc-stubs@1.0.1 publishing**: 
- Added subpath exports (`/health`, `/registration`, etc.)
- CI/CD triggered, waiting for publish to complete
- Check: https://git.rokkon.com/io-pipeline/grpc/actions

Once published, platform-shell can:
- Install grpc-stubs@1.0.1
- Build backend successfully
- Build frontend successfully
- Test Docker image

## 📦 Dependencies (Published Packages)

**Backend** (`package.json`):
```json
{
  "@io-pipeline/grpc-stubs": "^1.0.0",
  "@io-pipeline/connector-shared": "^1.0.0",
  "@io-pipeline/protobuf-forms": "^1.0.0"
}
```

**Frontend** (`ui/package.json`):
```json
{
  "@io-pipeline/grpc-stubs": "^1.0.0",
  "@io-pipeline/connector-shared": "^1.0.0",
  "@io-pipeline/protobuf-forms": "^1.0.0",
  "@io-pipeline/shared-components": "^1.0.0",
  "@io-pipeline/shared-nav": "^1.0.0"
}
```

## 🚀 Next Steps

### After grpc-stubs@1.0.1 Publishes

1. **Update dependencies**:
   ```bash
   cd /home/krickert/IdeaProjects/gitea/platform-shell
   pnpm update @io-pipeline/grpc-stubs
   cd ui && pnpm update @io-pipeline/grpc-stubs
   ```

2. **Test build**:
   ```bash
   cd /home/krickert/IdeaProjects/gitea/platform-shell
   pnpm run build         # Backend
   cd ui && pnpm run build  # Frontend
   ```

3. **Test Docker**:
   ```bash
   docker build -t test-platform-shell .
   docker run -p 38106:38106 test-platform-shell
   ```

4. **Commit and push**:
   ```bash
   git add -A
   git commit -m "Initial commit: Platform Shell application"
   git branch -m master main
   git push -u origin main
   ```

## Current State

- ✅ Repository structure ready
- ✅ All code updated for published packages
- ✅ CI/CD configured
- ⏳ Waiting for grpc-stubs@1.0.1 with subpath exports
- ⏳ Build will work after grpc-stubs@1.0.1 published

## Files Modified

- `package.json` - Updated name, dependencies, metadata
- `ui/package.json` - Updated dependencies to published packages
- `.npmrc` - Registry configuration
- All `.ts` and `.vue` files - Import paths updated
- `README.md` - Documentation
- `.gitea/workflows/build-and-publish.yml` - CI/CD
- `.gitignore` - Standard ignores

**Total**: ~586 files ready in platform-shell repository

