import { ref } from 'vue';
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { PlatformRegistrationService } from '@ai-pipestream/protobuf-forms/generated';

const availableServices = ref<Set<string>>(new Set());
const availableModules = ref<Set<string>>(new Set());

// Singleton controllers - only one set of streams for the entire app
let serviceAbortController: AbortController | null = null;
let moduleAbortController: AbortController | null = null;
let moduleInterval: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

// Start streams once globally
const initializeStreams = () => {
  if (isInitialized) return; // Already initialized
  isInitialized = true;

  // Create fresh abort controllers
  serviceAbortController = new AbortController();
  moduleAbortController = new AbortController();

  // Start service stream
  (async () => {
    try {
      const transport = createConnectTransport({
        baseUrl: window.location.origin,
        useBinaryFormat: true
      });

      const client = createClient(PlatformRegistrationService, transport);

      const serviceStream = client.watchServices({}, {
        signal: serviceAbortController!.signal
      });

      for await (const response of serviceStream) {
        const services = new Set<string>();
        for (const details of response.services) {
          if (details.isHealthy) {
            services.add(details.serviceName);
          }
        }
        availableServices.value = services;
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Failed to watch services:', error);
      }
    }
  })();

  // Start module polling
  const fetchModules = async () => {
    try {
      const transport = createConnectTransport({
        baseUrl: window.location.origin,
        useBinaryFormat: true
      });

      const client = createClient(PlatformRegistrationService, transport);

      const response = await client.listModules({}, {
        signal: moduleAbortController!.signal
      });

      const modules = new Set<string>();
      for (const details of response.modules) {
        if (details.isHealthy) {
          modules.add(details.moduleName);
        }
      }
      availableModules.value = modules;
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Failed to list modules:', error);
      }
    }
  };

  // Initial fetch
  fetchModules();

  // Poll every 10 seconds
  moduleInterval = setInterval(fetchModules, 10000);
};

export function useServiceRegistry() {
  // Initialize streams on first call only
  initializeStreams();

  return {
    availableServices,
    availableModules,
  };
}
