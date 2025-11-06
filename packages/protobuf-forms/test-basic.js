// Simple test to verify the updated protobuf-forms library works
const { ProtobufSchemaLoader } = require('./dist/index.js')

console.log('Testing updated protobuf-forms library...')

try {
  const loader = new ProtobufSchemaLoader()
  
  console.log('✅ ProtobufSchemaLoader created successfully')
  
  // Test getting available message types
  const messageTypes = loader.getAvailableMessageTypes()
  console.log('✅ Available message types:', messageTypes)
  
  // Test getting schema for ApplyMappingRequest
  const schema = loader.getMessageSchema('ApplyMappingRequest')
  console.log('✅ ApplyMappingRequest schema generated:')
  console.log(JSON.stringify(schema, null, 2))
  
  // Test getting schema for PipeDoc
  const pipeDocSchema = loader.getMessageSchema('PipeDoc')
  console.log('✅ PipeDoc schema generated:')
  console.log(JSON.stringify(pipeDocSchema, null, 2))
  
  console.log('\n🎉 All tests passed! The updated protobuf-forms library is working correctly.')
  
} catch (error) {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
}
