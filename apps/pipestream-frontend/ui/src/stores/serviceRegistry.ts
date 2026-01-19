import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createClient, ConnectError, Code } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { PlatformRegistrationService } from '@ai-pipestream/protobuf-forms/generated'

export const useServiceRegistryStore = defineStore('serviceRegistry', () => {
  // State
  const availableServices = ref<Set<string>>(new Set())
  const availableModules = ref<Set<string>>(new Set())

  // Polling state
  let pollingInterval: ReturnType<typeof setInterval> | null = null
  let isInitialized = false

  // Fetch services (polling)
  const fetchServices = async (): Promise<void> => {
    try {
      // console.log('[ServiceRegistry] Polling services...')
      const transport = createConnectTransport({
        baseUrl: window.location.origin,
        useBinaryFormat: true
      })

      const client = createClient(PlatformRegistrationService, transport)
      const response = await client.listServices({})

      const services = new Set<string>()
      for (const details of response.services) {
        if (details.isHealthy) {
          services.add(details.serviceName)
        }
      }

      // Only update and log if services actually changed
      const current = availableServices.value
      const hasChanged =
        services.size !== current.size ||
        Array.from(services).some(s => !current.has(s))

      if (hasChanged) {
        availableServices.value = services
        console.log('[ServiceRegistry] Services updated:', Array.from(services))
      }
    } catch (error: any) {
      console.error('[ServiceRegistry] Service polling error:', error)
    }
  }

  // Fetch modules (polling)
  const fetchModules = async (): Promise<void> => {
    try {
      // console.log('[ServiceRegistry] Polling modules...')
      const transport = createConnectTransport({
        baseUrl: window.location.origin,
        useBinaryFormat: true
      })

      const client = createClient(PlatformRegistrationService, transport)
      const response = await client.listPlatformModules({})

      const modules = new Set<string>()
      for (const details of response.modules) {
        if (details.isHealthy) {
          modules.add(details.moduleName)
        }
      }

      // Only update and log if modules actually changed
      const current = availableModules.value
      const hasChanged =
        modules.size !== current.size ||
        Array.from(modules).some(m => !current.has(m))

      if (hasChanged) {
        availableModules.value = modules
        console.log('[ServiceRegistry] Modules updated:', Array.from(modules))
      }
    } catch (error: any) {
      console.error('[ServiceRegistry] Module polling error:', error)
    }
  }

  // Actions
  const initializeStreams = () => {
    if (isInitialized) {
      return // Already initialized
    }
    isInitialized = true
    console.log('[ServiceRegistry] Initializing polling...')

    // Initial fetch
    fetchServices()
    fetchModules()

    // Start polling every 5 seconds
    pollingInterval = setInterval(() => {
      fetchServices()
      fetchModules()
    }, 5000)
  }

  const cleanup = () => {
    console.log('[ServiceRegistry] Cleaning up polling')
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    isInitialized = false
  }

  // Auto-initialize when store is first created
  initializeStreams()

  return {
    // State
    availableServices,
    availableModules,

    // Actions
    initializeStreams,
    cleanup,
  }
})
