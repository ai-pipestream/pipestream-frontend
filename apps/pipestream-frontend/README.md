# Platform Shell

Unified web frontend and Connect-ES proxy for Pipeline Engine platform. Provides the main UI shell that dynamically discovers and routes to all services and modules.

## Features

- **Unified Frontend**: Single Vue 3 + Vuetify application hosting all service/module UIs
- **Connect-ES Proxy**: Backend proxy routes API calls to backend services via Consul
- **Service Discovery**: Dynamically discovers services from platform-registration-service
- **ComponentGallery**: Interactive component showcase and testing
- **Docker Ready**: Production-ready Docker container

## Architecture

```
pipestream-frontend/
├── src/              # Backend (Express + Connect-ES proxy)
│   ├── index.ts
│   ├── routes/
│   └── lib/
└── ui/               # Frontend (Vue 3 + Vuetify)
    ├── src/
    │   ├── services/      # Service UIs (accounts, connectors, mapping, etc.)
    │   ├── pipeline-modules/  # Module UIs (chunker, parser, echo)
    │   ├── pages/        # Platform pages (Home, Health, etc.)
    │   └── stores/       # Pinia state management
    └── public/           # Built assets (generated)
```

## Development

### Prerequisites
- Node.js 22.x
- pnpm 10.x

### Setup

```bash
# Install dependencies
pnpm install
cd ui && pnpm install && cd ..

# Start backend (Terminal 1)
pnpm run dev

# Start frontend (Terminal 2)
cd ui && pnpm run dev
```

**Access**:
- Frontend: http://localhost:33000
- Backend API: http://localhost:38106

## Production

### Build

```bash
# Build backend
pnpm run build

# Build frontend (outputs to ../public/)
cd ui
pnpm run build

# Run production server
cd ..
NODE_ENV=production pnpm start
```

**Access**: http://localhost:38106 (backend serves frontend from `public/`)

### Docker

```bash
# Build image
docker build -t ai-pipestream/pipestream-frontend:latest .

# Run
docker run -d \
  --name pipestream-frontend \
  -p 38106:38106 \
  -e PLATFORM_REGISTRATION_HOST=platform-registration-service \
  -e PLATFORM_REGISTRATION_PORT=38101 \
  ai-pipestream/pipestream-frontend:latest
```

## Dependencies

Uses workspace packages and published libraries:
- `@ai-pipestream/protobuf-forms` - Service stubs and form generation (workspace package)
- `@ai-pipestream/shared-components` - UI components (includes ComponentGallery)
- `@ai-pipestream/shared-nav` - Navigation shell
- `@ai-pipestream/connector-shared` - Connector utilities

## Environment Variables

- `PORT` - Server port (default: 38106)
- `NODE_ENV` - Environment (development|production)
- `PLATFORM_REGISTRATION_HOST` - Platform registration service host
- `PLATFORM_REGISTRATION_PORT` - Platform registration service port

## Routes

**Connect RPC**:
```
POST /ai.pipestream.platform.registration.PlatformRegistration/ListServices
POST /ai.pipestream.repository.account.AccountService/ListAccounts
# etc - follows /ai.pipestream.{package}.{Service}/{Method} pattern
```

**Static Files**:
```
GET / → public/index.html (SPA)
GET /assets/* → public/assets/*
```

## License

Apache-2.0
