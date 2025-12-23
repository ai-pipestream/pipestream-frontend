import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { expressConnectMiddleware } from "@connectrpc/connect-express";
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { Health, PlatformRegistrationService } from "@ai-pipestream/protobuf-forms/generated";
// TODO: Re-enable when filesystem connector is rewritten
// import { ConnectorIntakeService } from "@ai-pipestream/protobuf-forms/generated";
// import { DocumentStreamer } from "@ai-pipestream/connector-shared";
import { createDynamicTransport, clearServiceRegistry } from './lib/serviceResolver.js';
import { createEmptyRegistryGroups, sortEntries, type RegistryEntry } from './models/registry.js';
import connectRoutes from './routes/connectRoutes.js';

const app = express();
const PORT = process.env.PORT || 38106;

// Middleware
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });


// Internal proxy health endpoint (moved off /health to avoid UI route collision)
app.get('/proxy/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'web-proxy',
        timestamp: new Date().toISOString()
    });
});

// System status endpoint - reports overall backend health
app.get('/api/system-status', async (req, res) => {
    const REGISTRATION_HOST = process.env.PLATFORM_REGISTRATION_HOST || 'localhost';
    const REGISTRATION_PORT = process.env.PLATFORM_REGISTRATION_PORT || '38101';
    const REGISTRATION_URL = `http://${REGISTRATION_HOST}:${REGISTRATION_PORT}`;

    const status = {
        proxy: { status: 'healthy', message: 'Platform shell proxy is running' },
        registration: { status: 'unknown', message: 'Checking platform-registration-service...', url: REGISTRATION_URL },
        timestamp: new Date().toISOString()
    };

    // Test platform-registration connectivity
    try {
        const transport = createGrpcTransport({
            baseUrl: REGISTRATION_URL,
            idleConnectionTimeoutMs: 2000
        });
        const client = createClient(Health, transport);
        await client.check({});
        status.registration.status = 'healthy';
        status.registration.message = 'Platform registration service is reachable';
    } catch (error: any) {
        status.registration.status = 'unavailable';
        status.registration.message = `Cannot connect to platform-registration-service: ${error.message || 'Connection refused'}`;
    }

    const overallHealthy = status.proxy.status === 'healthy' && status.registration.status === 'healthy';
    res.status(overallHealthy ? 200 : 503).json(status);
});

// Temporary JSON endpoint for shared navigation items
// When SystemNavService is implemented, replace this with the RPC
app.get('/connect/system-nav/menu-items.json', async (req, res) => {
    // Determine the base URL for common pages (web-proxy serves these)
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http')
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:38106'
    const coreItems = [
        { title: 'Home', icon: 'mdi-home', to: '/' },
        { title: 'Health', icon: 'mdi-heart-pulse', to: '/health' },
        { title: 'Components', icon: 'mdi-palette', to: '/components' },
        { title: 'Mapping', icon: 'mdi-code-braces', to: '/mapping' },
        { title: 'Modules', icon: 'mdi-puzzle', to: '/modules' },
        { title: 'Links', icon: 'mdi-link-variant', to: '/links' },
    ];

    try {
        const REGISTRATION_HOST = process.env.PLATFORM_REGISTRATION_HOST || 'localhost';
        const REGISTRATION_PORT = process.env.PLATFORM_REGISTRATION_PORT || '38101';
        const REGISTRATION_URL = `http://${REGISTRATION_HOST}:${REGISTRATION_PORT}`;
        const transport = createGrpcTransport({ baseUrl: REGISTRATION_URL, idleConnectionTimeoutMs: 1000 * 60 * 60 });
        const client = createClient(PlatformRegistrationService, transport);

        const [servicesResp, modulesResp] = await Promise.all([
            client.listServices({}),
            client.listPlatformModules({})
        ]);

        const SERVICE_UI_PATH: Record<string, string> = {
            'platform-registration-service': '/platform-registration/',
            // Ensure trailing slash to avoid 404 when omitted
            'repository-service': '/repository/',
            'account-manager': '/account/',
            'connector-service': '/admin-connector/',
            'opensearch-manager': '/opensearch-manager',
            // Root of the dev UI; Traefik middleware adds trailing slash
            'mapping-service': '/mapping-service/',
            'consul': `http://${process.env.CONSUL_HOST || 'localhost'}:${process.env.CONSUL_PORT || '8500'}`, // external UI
        };

        const resolvable = new Map<string, boolean>();
        const markResolvable = async (serviceName: string) => {
            if (resolvable.has(serviceName)) {
                return resolvable.get(serviceName) ?? false;
            }
            try {
                if (serviceName !== 'consul') {
                    await createDynamicTransport(serviceName);
                }
                resolvable.set(serviceName, true);
                return true;
            } catch {
                resolvable.set(serviceName, false);
                return false;
            }
        };

        const EXCLUDED_SERVICES = (process.env.PROXY_NAV_EXCLUDE || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const groups = createEmptyRegistryGroups();

        for (const raw of servicesResp.services ?? []) {
            const serviceName = (raw as any).serviceName as string;
            if (!serviceName || EXCLUDED_SERVICES.includes(serviceName)) {
                continue;
            }

            const metadataAny = { ...(raw as any).metadata };
            const tags: string[] = Array.isArray((raw as any).tags) ? (raw as any).tags : [];
            const capabilities: string[] = Array.isArray((raw as any).capabilities) ? (raw as any).capabilities : [];
            const metadata: Record<string, string> = Object.fromEntries(
                Object.entries(metadataAny ?? {}).filter(([_, v]) => typeof v === 'string')
            ) as Record<string, string>;
            const displayName = metadata['display-name'] || metadata['display_name'] || serviceName;
            const version = (raw as any).version || metadata['version'];
            const target = SERVICE_UI_PATH[serviceName] || `/${serviceName}`;
            const isExternal = typeof target === 'string' && target.startsWith('http');
            const isResolvable = await markResolvable(serviceName);

            const serviceTypeRaw = metadata['service-type'] || metadata['service_type'];
            const serviceType = typeof serviceTypeRaw === 'string' ? serviceTypeRaw.toUpperCase() : '';
            const kind = serviceName === 'consul' || serviceType === 'INFRA' || serviceType === 'INFRASTRUCTURE'
                ? 'INFRA'
                : 'SERVICE';

            const entry: RegistryEntry = {
                name: serviceName,
                displayName,
                kind,
                tags,
                capabilities,
                version,
                metadata,
                resolvable: isResolvable || isExternal,
                targetHint: target,
            };

            if (kind === 'INFRA') {
                groups.infra.push(entry);
            } else {
                groups.services.push(entry);
            }
        }

        for (const raw of modulesResp.modules ?? []) {
            const moduleName = (raw as any).moduleName || (raw as any).serviceName;
            if (!moduleName) continue;

            const metadataAny = { ...(raw as any).metadata };
            const tags: string[] = [];
            if (Array.isArray((raw as any).tags)) {
                tags.push(...(raw as any).tags);
            }
            if (Array.isArray((metadataAny as any)?.tags)) {
                tags.push(...(metadataAny as any).tags);
            }
            const capabilities: string[] = Array.isArray((raw as any).capabilities)
                ? (raw as any).capabilities
                : [];
            const displayName = (metadataAny as any)?.['display-name'] || (metadataAny as any)?.['display_name'] || moduleName;
            const version = (raw as any).version || (metadataAny as any)?.['module-version'] || (metadataAny as any)?.['version'];
            const targetHint = `/modules/${moduleName}`;
            const isResolvable = await markResolvable(moduleName);

            const metadata: Record<string, string> = Object.fromEntries(
                Object.entries(metadataAny ?? {}).filter(([_, v]) => typeof v === 'string')
            ) as Record<string, string>;

            const moduleEntry: RegistryEntry = {
                name: moduleName,
                displayName,
                kind: 'MODULE',
                tags,
                capabilities,
                version,
                metadata,
                resolvable: isResolvable,
                targetHint,
            };

            groups.modules.push(moduleEntry);
        }

        const serviceNavChildren = sortEntries(groups.services).map(entry => {
            const isExternal = entry.targetHint?.startsWith('http');
            return {
                title: entry.displayName,
                icon: 'mdi-cube',
                ...(isExternal
                    ? { href: entry.targetHint, external: true }
                    : { to: entry.targetHint, disabled: !entry.resolvable }),
            };
        });

        const infraNavChildren = sortEntries(groups.infra).map(entry => {
            const isExternal = entry.targetHint?.startsWith('http');
            return {
                title: entry.displayName,
                icon: 'mdi-server',
                ...(isExternal
                    ? { href: entry.targetHint, external: true }
                    : { to: entry.targetHint, disabled: !entry.resolvable }),
            };
        });

        const moduleNavChildren = sortEntries(groups.modules).map(entry => ({
            title: entry.displayName,
            icon: 'mdi-puzzle',
            to: entry.targetHint || `/modules/${entry.name}`,
            disabled: !entry.resolvable,
        }));

        const navItems: any[] = [...coreItems];

        if (serviceNavChildren.length > 0) {
            navItems.push({
                title: 'Services',
                icon: 'mdi-cube-outline',
                children: serviceNavChildren,
            });
        }

        if (infraNavChildren.length > 0) {
            navItems.push({
                title: 'Infrastructure',
                icon: 'mdi-office-building',
                children: infraNavChildren,
            });
        }

        if (moduleNavChildren.length > 0) {
            navItems.push({
                title: 'Modules',
                icon: 'mdi-puzzle',
                children: moduleNavChildren,
            });
        }

        res.json(navItems);
    } catch (e) {
        console.warn('[Nav] Falling back to static nav items:', e);
        res.json([
            ...coreItems,
            { title: 'Repository', icon: 'mdi-database', to: '/repository' },
            { title: 'Platform Registration', icon: 'mdi-account-cog', to: '/platform-registration' }
        ]);
    }
});

// Simple health snapshot aggregator
app.get('/connect/system/health-snapshot', async (req, res) => {
    const servicesToCheck = [
        'platform-registration-service',
        'repository-service',
        'mapping-service',
        'opensearch-manager'
    ];

    // Platform registration fixed location
    const REGISTRATION_HOST = process.env.PLATFORM_REGISTRATION_HOST || 'localhost';
    const REGISTRATION_PORT = process.env.PLATFORM_REGISTRATION_PORT || '38101';
    const REGISTRATION_URL = `http://${REGISTRATION_HOST}:${REGISTRATION_PORT}`;

    async function checkService(serviceName: string) {
        let transport;
        let target = '';
        try {
            if (serviceName === 'platform-registration-service') {
                transport = createGrpcTransport({ baseUrl: REGISTRATION_URL, idleConnectionTimeoutMs: 1000 * 60 * 60 });
                target = REGISTRATION_URL;
            } else {
                transport = await createDynamicTransport(serviceName);
                // createDynamicTransport encodes target in its internal options, but we also try to expose it
                target = 'dynamic';
            }
            const client = createClient(Health, transport);
            const response = await client.check({});
            return { name: serviceName, status: String(response.status), target, error: null };
        } catch (err: any) {
            return { name: serviceName, status: 'UNKNOWN', target, error: err?.message ?? String(err) };
        }
    }

    try {
        const results = await Promise.all(servicesToCheck.map(checkService));
        res.json({ services: results, checkedAt: new Date().toISOString() });
    } catch (e: any) {
        res.status(500).json({ error: e?.message ?? String(e) });
    }
});

// Cache invalidation endpoint for service registry
app.post('/connect/system/invalidate-cache', (req, res) => {
    try {
        clearServiceRegistry();
        console.log('[Web-Proxy] Service registry cache cleared by request');
        res.json({ 
            status: 'success', 
            message: 'Service registry cache cleared',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Web-Proxy] Failed to clear cache:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error?.message ?? String(error),
            timestamp: new Date().toISOString()
        });
    }
});

// Upload API endpoints - TODO: Re-enable when filesystem connector is rewritten
app.post('/api/upload/file', async (req, res) => {
    res.status(503).json({
        success: false,
        error: 'Upload functionality temporarily disabled - filesystem connector being rewritten'
    });
});

app.post('/api/upload/folder', async (req, res) => {
    res.status(503).json({
        success: false,
        error: 'Upload functionality temporarily disabled - filesystem connector being rewritten'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        connectorId: 'initialized',
        sessionId: 'test-session-123'
    });
});

// Serve static files from public directory (built Vue UI)
app.use(express.static('public'));

// Mount Connect routes (no prefix - services use their natural paths like /ai.pipestream.*)
app.use(
    expressConnectMiddleware({
        routes: connectRoutes,
    })
);

// Start server
async function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`Web proxy backend listening at http://localhost:${PORT}`);
            console.log(`Connect RPC services: http://localhost:${PORT}/ai.pipestream.*`);
            console.log(`REST API: http://localhost:${PORT}/connect/*`);
            console.log(`Health check: http://localhost:${PORT}/proxy/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

startServer();
