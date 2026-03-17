import { createClient, type Client, type Transport } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { PlatformRegistrationService, type GetServiceResponse } from "@ai-pipestream/protobuf-forms/generated";
import Consul from 'consul';

// Discovery Configuration
const DISCOVERY_MODE = (process.env.DISCOVERY_MODE || 'static').toLowerCase(); // 'static' or 'consul'
const CONSUL_HOST = process.env.CONSUL_HOST || 'localhost';
const CONSUL_PORT = process.env.CONSUL_PORT || '8500';

// Fallback / Static Config
const REGISTRATION_HOST = process.env.PLATFORM_REGISTRATION_HOST || 'localhost';
const REGISTRATION_PORT = process.env.PLATFORM_REGISTRATION_PORT || '18101'; 

console.log(`[ServiceResolver] Config: DISCOVERY_MODE=${DISCOVERY_MODE}, REG_HOST=${REGISTRATION_HOST}, REG_PORT=${REGISTRATION_PORT}`);

// Live state
const serviceRegistry = new Map<string, GetServiceResponse>();
let registrationClient: Client<typeof PlatformRegistrationService> | null = null;
let registrationTransport: Transport | null = null;

const consul = new Consul({
  host: CONSUL_HOST,
  port: CONSUL_PORT,
  promisify: true
});

/**
 * Resolves the URL for the platform-registration-service.
 */
async function resolveRegistrationUrl(): Promise<string> {
  if (DISCOVERY_MODE === 'consul') {
    console.log(`[ServiceResolver] Discovering platform-registration-service via Consul at ${CONSUL_HOST}:${CONSUL_PORT}...`);
    try {
      // @ts-ignore
      const services = await consul.catalog.service.nodes('platform-registration-service');
      if (services && services.length > 0) {
        const s = services[0];
        const host = s.ServiceAddress || s.Address;
        const port = s.ServicePort;
        console.log(`[ServiceResolver] Found platform-registration-service in Consul at ${host}:${port}`);
        return `http://${host}:${port}`;
      }
      console.warn(`[ServiceResolver] platform-registration-service not found in Consul, falling back to static config.`);
    } catch (err) {
      console.error(`[ServiceResolver] Consul discovery failed:`, err);
    }
  }
  
  // Static/Fallback mode
  const url = `http://${REGISTRATION_HOST}:${REGISTRATION_PORT}`;
  console.log(`[ServiceResolver] Using static platform-registration-service at ${url}`);
  return url;
}

/**
 * Initializes the discovery layer.
 */
export async function initializeDiscovery() {
  const baseUrl = await resolveRegistrationUrl();
  
  registrationTransport = createGrpcTransport({
    baseUrl,
    idleConnectionTimeoutMs: 1000 * 60 * 60,
  });

  registrationClient = createClient(PlatformRegistrationService, registrationTransport);
  
  // Start the background watch
  watchAndCacheServices();
}

/**
 * Gets the registration transport, ensuring it's initialized.
 */
export function getRegistrationTransport(): Transport {
  if (!registrationTransport) {
    // Synchronous fallback for immediate access if needed, 
    // but initializeDiscovery should ideally be awaited at app start.
    const url = `http://${REGISTRATION_HOST}:${REGISTRATION_PORT}`;
    registrationTransport = createGrpcTransport({
      baseUrl: url,
      idleConnectionTimeoutMs: 1000 * 60 * 60,
    });
  }
  return registrationTransport;
}

/**
 * Watches the platform-registration-service for real-time updates of all
 * healthy services. This function runs continuously in the background.
 */
async function watchAndCacheServices() {
  if (!registrationClient) return;

  console.log("[ServiceResolver] Starting to watch for service updates...");
  try {
    const stream = registrationClient.watchServices({});
    for await (const response of stream) {
      const newRegistry = new Map<string, GetServiceResponse>();
      for (const service of response.services) {
        newRegistry.set(service.serviceName, service);
      }
      // Atomically update the registry
      serviceRegistry.clear();
      for (const [key, value] of newRegistry.entries()) {
        serviceRegistry.set(key, value);
      }
    }
  } catch (error) {
    console.error("[ServiceResolver] Watch stream failed:", error);
    console.log("[ServiceResolver] Retrying discovery initialization in 5 seconds...");
    setTimeout(initializeDiscovery, 5000);
  }
}

/**
 * Protocol detection logic.
 */
function isConnectProtocol(serviceDetails: GetServiceResponse): boolean {
  const metadata = (serviceDetails as any).metadata || {};
  const protocol = (metadata.protocol || metadata.transport || "").toString().toLowerCase();
  if (protocol === "connect" || protocol === "http") {
    return true;
  }

  const tags: string[] = Array.isArray((serviceDetails as any).tags) ? (serviceDetails as any).tags : [];
  return tags.some((tag) => {
    const normalized = tag.toLowerCase();
    return normalized === "connect" || normalized === "protocol:connect" || normalized === "transport:http";
  });
}

function pickHttpEndpoint(serviceDetails: GetServiceResponse): { host: string; port: number } | null {
  const endpoints = (serviceDetails as any).httpEndpoints || [];
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return null;
  }

  const endpoint = endpoints[0];
  if (!endpoint || !endpoint.host || !endpoint.port) {
    return null;
  }

  return {
    host: endpoint.host,
    port: endpoint.port,
  };
}

export function resolveService(serviceName: string): { host: string; port: number } {
  // Alias mapping
  if (serviceName === 'account-manager' && !serviceRegistry.has('account-manager') && serviceRegistry.has('account-service')) {
    serviceName = 'account-service';
  }
  if (serviceName === 'connector-service' && !serviceRegistry.has('connector-service') && serviceRegistry.has('connector-admin')) {
    serviceName = 'connector-admin';
  }

  const serviceDetails = serviceRegistry.get(serviceName);

  if (!serviceDetails) {
    // Fallback: Try to resolve common module services directly
    const fallbackPorts: Record<string, number> = {
      'echo': 39000,
      'parser': 39001,
      'chunker': 39002,
      'embedder': 39003,
      'opensearch-sink': 39004
    };
    
    if (fallbackPorts[serviceName]) {
      return { host: '127.0.0.1', port: fallbackPorts[serviceName] };
    }
    
    throw new Error(`[ServiceResolver] Service "${serviceName}" not found in live registry.`);
  }

  const httpEndpoint = pickHttpEndpoint(serviceDetails);
  const preferHttp = isConnectProtocol(serviceDetails);
  const resolvedHost = preferHttp && httpEndpoint ? httpEndpoint.host : serviceDetails.host;
  const resolvedPort = preferHttp && httpEndpoint ? httpEndpoint.port : serviceDetails.port;
  const finalHost = resolvedHost || serviceDetails.host;
  const finalPort = resolvedPort || serviceDetails.port;

  // Normalize localhost
  const normalizedHost = (() => {
    const h = (finalHost || "").toLowerCase();
    if (h === "localhost" || h === "::1" || h === "0.0.0.0") return "127.0.0.1";
    return finalHost;
  })();

  return {
    host: normalizedHost,
    port: finalPort,
  };
}

/**
 * Create a dynamic transport for a service by name.
 */
export function createDynamicTransport(serviceName:string) {
    const { host, port } = resolveService(serviceName);
    return createGrpcTransport({
        baseUrl: `http://${host}:${port}`,
        idleConnectionTimeoutMs: 1000 * 60 * 60
    });
}

/**
 * Clears the service registry. Useful for testing.
 */
export function clearServiceRegistry() {
  serviceRegistry.clear();
  console.log("[ServiceResolver] Service registry cleared.");
}

// Initial trigger
initializeDiscovery();
