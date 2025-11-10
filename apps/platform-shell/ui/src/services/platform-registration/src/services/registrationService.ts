/**
 * gRPC client service for Platform Registration Service
 * 
 * This will handle all communication with the backend via Connect-RPC/gRPC-web
 */

import { createClient } from '@connectrpc/connect'
import { PlatformRegistration } from '@ai-pipestream/grpc-stubs/dist/registration/platform_registration_pb'
import type { ServiceDetails, ServiceListResponse } from '@ai-pipestream/grpc-stubs/dist/registration/platform_registration_pb'

// Create the transport - uses same origin to reach /connect/* through Traefik
export const transport = createConnectTransport()

// Create the client
export const registrationClient = createClient(PlatformRegistration, transport)

// Service interface types (temporary until proto definitions are available)
export interface ServiceRegistration {
  name: string
  host: string
  port: number
  type: 'GRPC' | 'HTTP' | 'WEBSOCKET'
  metadata?: Record<string, string>
}

export interface RegisteredService extends ServiceRegistration {
  id: string
  status: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN'
  registeredAt?: string
  lastHealthCheck?: string
}

// Service functions using real gRPC calls
export const registrationService = {
  async registerService(service: ServiceRegistration): Promise<RegisteredService> {
    try {
      // Note: RegisterService returns a stream, we'd need to handle streaming
      // For now, just track locally after registration
      // TODO: Implement when streaming is ready
      // const request = {
      //   serviceName: service.name,
      //   host: service.host,
      //   port: service.port,
      //   version: '1.0.0',
      //   metadata: service.metadata || {},
      //   tags: [],
      //   capabilities: []
      // }
      
      // This returns a stream of RegistrationEvents
      // For now, we'll just return success
      return {
        ...service,
        id: `${service.name}-${service.host}-${service.port}`,
        status: 'HEALTHY',
        registeredAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to register service:', error)
      throw error
    }
  },
  
  async listServices(): Promise<RegisteredService[]> {
    try {
      console.log('Calling listServices via gRPC...')
      const response = await registrationClient.listServices({}) as unknown as ServiceListResponse
      console.log('Received response:', response)
      
      if (!response.services || response.services.length === 0) {
        console.log('No services returned from backend')
        return []
      }
      
      const mappedServices = response.services.map((service: ServiceDetails) => ({
        id: service.serviceId,
        name: service.serviceName,
        host: service.host || 'localhost',
        port: service.port,
        type: 'GRPC' as const, // Assuming GRPC for now
        status: (service.isHealthy ? 'HEALTHY' : 'UNHEALTHY') as 'HEALTHY' | 'UNHEALTHY',
        registeredAt: service.registeredAt ? new Date(
          Number(service.registeredAt.seconds) * 1000 + 
          Number(service.registeredAt.nanos) / 1000000
        ).toISOString() : undefined,
        lastHealthCheck: service.lastHealthCheck ? new Date(
          Number(service.lastHealthCheck.seconds) * 1000 + 
          Number(service.lastHealthCheck.nanos) / 1000000
        ).toISOString() : undefined
      }))
      
      console.log('Mapped services:', mappedServices)
      return mappedServices
    } catch (error) {
      console.error('Failed to list services:', error)
      // Return empty array on error instead of throwing
      return []
    }
  },
  
  async unregisterService(serviceId: string): Promise<void> {
    try {
      // Parse the service ID to get components
      const parts = serviceId.split('-')
      if (parts.length >= 3) {
        const port = parseInt(parts[parts.length - 1])
        const host = parts[parts.length - 2]
        const serviceName = parts.slice(0, -2).join('-')
        
        await registrationClient.unregisterService({
          serviceName,
          host,
          port
        })
      }
    } catch (error) {
      console.error('Failed to unregister service:', error)
    }
  },
  
  async checkHealth(_serviceName?: string): Promise<any> {
    // Health check is on a different service, keeping mock for now
    return {
      status: 'SERVING',
      checks: {
        mysql: 'UP',
        consul: 'UP',
        apicurio: 'UP'
      }
    }
  }
}
