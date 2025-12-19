import type { Message } from '@bufbuild/protobuf'
import type { GenMessage } from '@bufbuild/protobuf/codegenv2'
import { ProtobufToJsonSchemaConverter, JsonSchema, ConversionOptions } from './converter'

// NOTE: Example imports removed - users should import and register their own message types
// Example usage:
// import { MyMessageSchema } from '@ai-pipestream/protobuf-forms/generated'
// loader.registerMessage('MyMessage', MyMessageSchema)

export interface LoaderOptions extends ConversionOptions {
  // Additional options can be added here
}

export class ProtobufSchemaLoader {
  private converter: ProtobufToJsonSchemaConverter
  private messageRegistry: Map<string, GenMessage<any>>
  private options: LoaderOptions

  constructor(options: LoaderOptions = {}) {
    this.options = options
    this.converter = new ProtobufToJsonSchemaConverter(options)
    this.messageRegistry = new Map()
    this.initializeRegistry()
  }

  /**
   * Initialize the registry with known message types
   */
  private initializeRegistry(): void {
    // Registry starts empty - users register their own message types
    // Example:
    //   loader.registerMessage('MyMessage', MyMessageSchema)
    //   loader.registerMessage('ai.pipestream.my.MyMessage', MyMessageSchema)
  }
  
  /**
   * Register a message type with the loader
   */
  registerMessage(name: string, schema: GenMessage<any>): void {
    this.messageRegistry.set(name, schema)
  }

  /**
   * Load from generated types (replaces file-based loading)
   */
  loadFromGenerated(): void {
    // This method is now essentially a no-op since we initialize in constructor
    // Kept for backward compatibility
  }

  /**
   * Get JSON Schema for a specific message type
   */
  getMessageSchema(messageType: string): JsonSchema {
    const messageSchema = this.messageRegistry.get(messageType)
    
    if (!messageSchema) {
      // Return a basic schema for unknown types
      return this.createBasicSchema(messageType)
    }

    return this.converter.convertMessageSchema(messageSchema)
  }

  /**
   * Get JSON Schema for a specific message type (async version for consistency)
   */
  async getJsonSchema(messageType: string): Promise<JsonSchema> {
    return this.getMessageSchema(messageType)
  }

  /**
   * Create a basic schema for unknown message types
   */
  private createBasicSchema(messageType: string): JsonSchema {
    return {
      type: 'object',
      title: messageType.split('.').pop() || 'Message',
      description: `Schema for ${messageType} (basic fallback)`,
      properties: {
        // Add some common fields
        data: {
          type: 'object',
          title: 'Data',
          description: 'Message data'
        }
      }
    }
  }

  /**
   * Register a new message type
   */
  registerMessageSchema<T extends Message>(name: string, messageSchema: GenMessage<T>): void {
    this.messageRegistry.set(name, messageSchema)
  }

  /**
   * List all available message types
   */
  getAvailableMessageTypes(): string[] {
    return Array.from(this.messageRegistry.keys())
  }

  /**
   * Legacy method for backward compatibility
   */
  async loadProtoFile(protoPath: string): Promise<void> {
    console.warn('loadProtoFile is deprecated with @bufbuild/protobuf. Message types are loaded from generated files.')
    this.loadFromGenerated()
  }

  /**
   * Legacy method for backward compatibility  
   */
  loadProtoString(protoContent: string): void {
    console.warn('loadProtoString is deprecated with @bufbuild/protobuf. Message types are loaded from generated files.')
    this.loadFromGenerated()
  }
}
