/**
 * gRPC/Connect Configuration
 *
 * Most services use same-origin (window.location.origin) and route through web-proxy/Traefik.
 * Only the Platform Registration service needs special configuration since it may run as a
 * Consul sidecar with DNS override in production.
 *
 * Configuration priority:
 * 1. Environment variables (set at build time via Vite)
 * 2. Runtime defaults (window.location.origin)
 */

export interface GrpcConfig {
  /**
   * Base URL for Platform Registration service
   * In production, this may point to a Consul sidecar with DNS override
   * Default: window.location.origin
   */
  platformRegistrationUrl: string

  /**
   * Use binary protobuf format instead of JSON
   * Default: true (better performance)
   */
  useBinaryFormat: boolean

  /**
   * Enable debug logging
   * Default: false (true in dev mode)
   */
  debug: boolean
}

/**
 * Get the Platform Registration service URL
 * Priority: env var > runtime origin
 */
function getPlatformRegistrationUrl(): string {
  // 1. Check environment variable (set at build time)
  // In production, this will point to the Consul sidecar
  const envUrl = import.meta.env.VITE_PLATFORM_REGISTRATION_URL
  if (envUrl) {
    return envUrl
  }

  // 2. Use current origin (works in dev and most prod setups)
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }

  // 3. Fallback for Node.js contexts
  return 'http://localhost:33000'
}

/**
 * Get whether to use binary format
 */
function getUseBinaryFormat(): boolean {
  const envValue = import.meta.env.VITE_GRPC_USE_BINARY
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === true
  }
  return true // Always use binary for better performance
}

/**
 * Get debug mode
 */
function getDebugMode(): boolean {
  const envValue = import.meta.env.VITE_GRPC_DEBUG
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === true
  }
  return import.meta.env.DEV // Enable in dev mode by default
}

/**
 * Default gRPC configuration
 */
export const grpcConfig: GrpcConfig = {
  platformRegistrationUrl: getPlatformRegistrationUrl(),
  useBinaryFormat: getUseBinaryFormat(),
  debug: getDebugMode()
}

/**
 * Get transport config for Platform Registration service
 */
export function getPlatformRegistrationTransportConfig() {
  return {
    baseUrl: grpcConfig.platformRegistrationUrl,
    useBinaryFormat: grpcConfig.useBinaryFormat
  }
}

/**
 * Get transport config for regular services (routed through web-proxy)
 */
export function getDefaultTransportConfig() {
  return {
    baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:33000',
    useBinaryFormat: grpcConfig.useBinaryFormat
  }
}

/**
 * Log configuration on startup (only in debug mode)
 */
if (grpcConfig.debug) {
  console.log('[gRPC Config]', {
    platformRegistrationUrl: grpcConfig.platformRegistrationUrl,
    useBinaryFormat: grpcConfig.useBinaryFormat,
    debug: grpcConfig.debug,
    envVars: {
      VITE_PLATFORM_REGISTRATION_URL: import.meta.env.VITE_PLATFORM_REGISTRATION_URL,
      VITE_GRPC_USE_BINARY: import.meta.env.VITE_GRPC_USE_BINARY,
      VITE_GRPC_DEBUG: import.meta.env.VITE_GRPC_DEBUG,
    }
  })
}
