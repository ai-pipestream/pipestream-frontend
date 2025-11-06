/**
 * Infrastructure service configuration
 *
 * Uses environment variables (Vite env vars prefixed with VITE_) with fallbacks.
 * Configure via .env files or environment variables:
 *
 * VITE_INFRA_HOST=localhost (default)
 * VITE_TRAEFIK_PORT=8080 (default)
 * VITE_CONSUL_PORT=8500 (default)
 * etc.
 */

const getEnvVar = (key: string, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue;
};

export interface InfrastructureConfig {
  host: string;
  services: {
    traefik: { port: string; };
    consul: { port: string; };
    apicurio: { port: string; };
    kafka: { port: string; };
    opensearch: { port: string; };
    minio: { port: string; };
  };
}

export const infrastructureConfig: InfrastructureConfig = {
  host: getEnvVar('VITE_INFRA_HOST', 'localhost'),
  services: {
    traefik: { port: getEnvVar('VITE_TRAEFIK_PORT', '8080') },
    consul: { port: getEnvVar('VITE_CONSUL_PORT', '8500') },
    apicurio: { port: getEnvVar('VITE_APICURIO_PORT', '8888') },
    kafka: { port: getEnvVar('VITE_KAFKA_PORT', '8889') },
    opensearch: { port: getEnvVar('VITE_OPENSEARCH_PORT', '5601') },
    minio: { port: getEnvVar('VITE_MINIO_PORT', '9001') },
  }
};

/**
 * Generate URL for infrastructure service
 */
export const getInfraUrl = (service: keyof InfrastructureConfig['services']): string => {
  const config = infrastructureConfig;
  return `http://${config.host}:${config.services[service].port}`;
};