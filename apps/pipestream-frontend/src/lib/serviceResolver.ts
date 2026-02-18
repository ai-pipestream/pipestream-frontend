import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { PlatformRegistrationService, type GetServiceResponse } from "@ai-pipestream/protobuf-forms/generated";

// This map holds the live state of all healthy, registered services.
// It is populated by the WatchServices stream.
const serviceRegistry = new Map<string, GetServiceResponse>();

// Get platform-registration-service URL from environment or use default
const REGISTRATION_HOST = process.env.PLATFORM_REGISTRATION_HOST || 'localhost';
const REGISTRATION_PORT = process.env.PLATFORM_REGISTRATION_PORT || '38101';
const REGISTRATION_URL = `http://${REGISTRATION_HOST}:${REGISTRATION_PORT}`;

console.log(`[ServiceResolver] Using platform-registration-service at ${REGISTRATION_URL}`);

// Create a persistent transport to platform-registration-service
const registrationTransport = createGrpcTransport({
  baseUrl: REGISTRATION_URL,
  idleConnectionTimeoutMs: 1000 * 60 * 60, // 1 hour for idle connections
});

const registrationClient = createClient(PlatformRegistrationService, registrationTransport);

/**
 * Watches the platform-registration-service for real-time updates of all
 * healthy services. This function runs continuously in the background.
 */
async function watchAndCacheServices() {
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
    console.log("[ServiceResolver] Retrying watch in 5 seconds...");
    setTimeout(watchAndCacheServices, 5000); // Retry after 5 seconds
  }
}

/**
 * Resolves a service name to its actual host:port from the live registry.
 * This is a synchronous lookup against the in-memory cache.
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
  // Alias account-manager to account-service
  if (serviceName === 'account-manager' && !serviceRegistry.has('account-manager') && serviceRegistry.has('account-service')) {
    console.log(`[ServiceResolver] Aliasing ${serviceName} to account-service`);
    serviceName = 'account-service';
  }

  if (serviceName === 'connector-service' && !serviceRegistry.has('connector-service') && serviceRegistry.has('connector-admin')) {
    console.log(`[ServiceResolver] Aliasing ${serviceName} to connector-admin`);
    serviceName = 'connector-admin';
  }

  const serviceDetails = serviceRegistry.get(serviceName);

  if (!serviceDetails) {
    console.log(`[ServiceResolver] Service "${serviceName}" not found in live registry. Available services:`, Array.from(serviceRegistry.keys()));
    
    // Fallback: Try to resolve common module services directly
    const fallbackPorts: Record<string, number> = {
      'echo': 39000,
      'parser': 39001,
      'chunker': 39002,
      'embedder': 39003,
      'opensearch-sink': 39004
    };
    
    if (fallbackPorts[serviceName]) {
      console.log(`[ServiceResolver] Using fallback for "${serviceName}" -> localhost:${fallbackPorts[serviceName]}`);
      return { host: '127.0.0.1', port: fallbackPorts[serviceName] };
    }
    
    throw new Error(`[ServiceResolver] Service "${serviceName}" not found in live registry. It may be unhealthy or not registered.`);
  }

  const httpEndpoint = pickHttpEndpoint(serviceDetails);
  const preferHttp = isConnectProtocol(serviceDetails);
  const resolvedHost = preferHttp && httpEndpoint ? httpEndpoint.host : serviceDetails.host;
  const resolvedPort = preferHttp && httpEndpoint ? httpEndpoint.port : serviceDetails.port;
  const finalHost = resolvedHost || serviceDetails.host;
  const finalPort = resolvedPort || serviceDetails.port;

  // Normalize localhost variants to IPv4 loopback to avoid IPv6 (::1) dial issues
  const normalizedHost = (() => {
    const h = (finalHost || "").toLowerCase();
    if (h === "localhost" || h === "::1" || h === "0.0.0.0") return "127.0.0.1";
    return finalHost;
  })();

  const result = {
    host: normalizedHost,
    port: finalPort,
  };

  // console.log(`[ServiceResolver] Resolved ${serviceName} to ${result.host}:${result.port} from live registry.`);
  return result;
}

/**
 * Create a dynamic transport for a service by name.
 */
export function createDynamicTransport(serviceName:string) {
    const { host, port } = resolveService(serviceName);
    return createGrpcTransport({
        baseUrl: `http://${host}:${port}`,
        // Disable timeouts for streaming connections
        idleConnectionTimeoutMs: 1000 * 60 * 60 // 1 hour for idle connections
    });
}

/**
 * Clears the service registry. Useful for testing.
 */
export function clearServiceRegistry() {
  serviceRegistry.clear();
  console.log("[ServiceResolver] Service registry cleared.");
}

// Start watching for service updates in the background.
watchAndCacheServices();
