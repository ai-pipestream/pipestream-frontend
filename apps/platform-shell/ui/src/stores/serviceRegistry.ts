import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { PlatformRegistration } from '@ai-pipestream/grpc-stubs/dist/registration/platform_registration_pb'

export const useServiceRegistryStore = defineStore('serviceRegistry', () => {
  // State
  const availableServices = ref<Set<string>>(new Set())
  const availableModules = ref<Set<string>>(new Set())

  // Polling intervals
  let serviceInterval: ReturnType<typeof setInterval> | null = null
  let moduleInterval: ReturnType<typeof setInterval> | null = null
  let isInitialized = false

  // Fetch services (polling)
  const fetchServices = async () => {
    try {
      const transport = createConnectTransport({
        baseUrl: window.location.origin,
      })

      const client = createClient(PlatformRegistration, transport)

      const response = await client.listServices({})

      const services = new Set<string>()
      for (const details of response.services) {
        if (details.isHealthy) {
          services.add(details.serviceName)
        }
      }
      availableServices.value = services
    } catch (error: any) {
      console.error('[ServiceRegistry] Failed to list services:', error)
    }
  }

  // Fetch modules (polling)
  const fetchModules = async () => {
    try {
      const transport = createConnectTransport({
        baseUrl: window.location.origin,
      })

      const client = createClient(PlatformRegistration, transport)

      const response = await client.listModules({})

      console.log('[ServiceRegistry] ListModules response:', response)
      const modules = new Set<string>()
      for (const details of response.modules) {
        console.log('[ServiceRegistry] Module details:', details, 'isHealthy:', details.isHealthy, 'moduleName:', details.moduleName)
        if (details.isHealthy) {
          modules.add(details.moduleName)
        }
      }
      console.log('[ServiceRegistry] Available modules:', Array.from(modules))
      availableModules.value = modules
    } catch (error: any) {
      console.error('[ServiceRegistry] Failed to list modules:', error)
    }
  }

  // Actions
  const initializeStreams = () => {
    if (isInitialized) {
      console.log('[ServiceRegistry] Already initialized, skipping')
      return // Already initialized
    }
    isInitialized = true
    console.log('[ServiceRegistry] Initializing polling...')

    // Initial fetch
    fetchServices()
    fetchModules()

    // Poll services every 5 seconds
    serviceInterval = setInterval(fetchServices, 5000)

    // Poll modules every 10 seconds
    moduleInterval = setInterval(fetchModules, 10000)
  }

  const cleanup = () => {
    console.log('[ServiceRegistry] Cleaning up polling')
    
    // Clear service interval
    if (serviceInterval) {
      clearInterval(serviceInterval)
      serviceInterval = null
    }

    // Clear module interval
    if (moduleInterval) {
      clearInterval(moduleInterval)
      moduleInterval = null
    }

    isInitialized = false
  }

  // Auto-initialize polling when store is first created
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
