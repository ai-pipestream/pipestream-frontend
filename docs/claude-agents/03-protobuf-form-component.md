# Task: Fix and Enhance ProtobufForm Component

## Objective
Complete the ProtobufForm component that auto-generates forms from Protocol Buffer message schemas, making it the primary way to create forms in the application.

## Context

**Current State:**
- ProtobufForm.vue exists in `packages/protobuf-forms/src/vue.ts`
- Component is currently disabled with comment: "temporarily disabled during dependency refactor"
- JSONForms integration is partially configured
- Package has @bufbuild/protobuf as dependency
- Vuetify renderer is available (@jsonforms/vue-vuetify)

**The Vision:**
Instead of manually building forms, developers should be able to:
```vue
<ProtobufForm
  :schema="AccountSchema"
  :initial-data="account"
  @submit="handleSubmit"
/>
```

And get a fully-functional, validated form with:
- All fields from the protobuf message
- Correct input types (string, number, enum, repeated fields)
- Validation based on proto field rules
- Vuetify-styled components
- Type-safe submit handler

## Requirements

### 1. Core ProtobufForm Component

**Fix and complete `packages/protobuf-forms/src/vue.ts`:**

**Props:**
```typescript
interface ProtobufFormProps {
  // The protobuf message schema (generated from grpc-stubs)
  schema: MessageType

  // Initial data (for edit mode)
  initialData?: Message

  // Validation mode (submit-only, on-blur, on-change)
  validationMode?: 'submit' | 'blur' | 'change'

  // Show/hide submit button
  showSubmit?: boolean
  submitLabel?: string

  // Read-only mode
  readonly?: boolean

  // Custom UI schema for JSONForms (optional advanced usage)
  uischema?: UISchemaElement
}
```

**Events:**
```typescript
// Emitted when form is submitted and valid
emit('submit', data: Message)

// Emitted when validation fails
emit('validation-error', errors: ValidationError[])

// Emitted when form data changes
emit('update:modelValue', data: Partial<Message>)
```

**Features:**
- Convert protobuf MessageType to JSONForms JSON Schema
- Generate sensible UI schema (field order, grouping)
- Handle all protobuf field types:
  - Scalars: string, int32, int64, bool, double, float, bytes
  - Enums: dropdown/select
  - Messages: nested object forms
  - Repeated fields: arrays with add/remove
  - Optional fields: nullable/undefined handling
  - Oneof fields: radio group or tabs
- Validation from proto annotations (required, min/max, regex if available)
- Submit handling with type conversion back to protobuf Message

### 2. Schema Conversion Logic

**Create `packages/protobuf-forms/src/schema-generator.ts`:**

```typescript
import type { MessageType, FieldInfo } from '@bufbuild/protobuf'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'

/**
 * Converts a protobuf MessageType to JSONForms JSON Schema
 */
export function messageToJsonSchema(messageType: MessageType): JsonSchema {
  // Iterate over messageType.fields
  // Build JSON Schema with type, properties, required
}

/**
 * Generates a default UI schema from message structure
 */
export function generateUiSchema(messageType: MessageType): UISchemaElement {
  // Create vertical/horizontal layouts
  // Group related fields
  // Set appropriate controls (text, number, select, etc.)
}

/**
 * Field type mapping
 */
export function protoFieldToJsonType(fieldInfo: FieldInfo): string {
  // Map proto types to JSON Schema types
  // Handle repeated, optional, oneof
}
```

### 3. Example Usage Patterns

**Simple Form (Account Creation):**
```vue
<template>
  <ProtobufForm
    :schema="AccountSchema"
    submit-label="Create Account"
    @submit="handleCreateAccount"
  />
</template>

<script setup lang="ts">
import { ProtobufForm } from '@ai-pipestream/protobuf-forms/vue'
import { AccountSchema } from '@ai-pipestream/grpc-stubs/account'
import { accountClient } from '@/services/account-manager/services/accountClient'

const handleCreateAccount = async (data: Account) => {
  const result = await accountClient.createAccount(
    data.accountId,
    data.name,
    data.description
  )
  // Handle success
}
</script>
```

**Edit Form (With Initial Data):**
```vue
<template>
  <ProtobufForm
    :schema="AccountSchema"
    :initial-data="account"
    submit-label="Update Account"
    @submit="handleUpdateAccount"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ accountId: string }>()
const account = ref<Account>()

onMounted(async () => {
  account.value = await accountClient.getAccount(props.accountId)
})
</script>
```

**Complex Form (With Custom UI Schema):**
```vue
<template>
  <ProtobufForm
    :schema="ConnectorConfigSchema"
    :initial-data="config"
    :uischema="customLayout"
    validation-mode="blur"
    @submit="handleSave"
  />
</template>

<script setup lang="ts">
// Custom layout for complex nested forms
const customLayout = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Group', label: 'Basic Info', elements: [...] },
    { type: 'Group', label: 'Advanced', elements: [...] }
  ]
}
</script>
```

### 4. Field Type Handlers

**Create custom renderers for specific protobuf types:**

`packages/protobuf-forms/src/renderers/`:
- `EnumRenderer.vue` - Dropdown for proto enums
- `RepeatedFieldRenderer.vue` - Array with add/remove buttons
- `OneofRenderer.vue` - Radio group or conditional display
- `BytesRenderer.vue` - File upload or hex input
- `TimestampRenderer.vue` - Date/time picker
- `DurationRenderer.vue` - Duration input (e.g., "5m", "2h")

Register these with JSONForms:
```typescript
import { vanillaRenderers } from '@jsonforms/vue-vanilla'
import { vuetifyRenderers } from '@jsonforms/vue-vuetify'

export const protobufRenderers = [
  ...vuetifyRenderers,
  enumRenderer,
  repeatedFieldRenderer,
  oneofRenderer,
  bytesRenderer,
  timestampRenderer
]
```

### 5. Validation Integration

**Support proto validation rules:**

If using `buf validate` or similar:
- Required fields
- Min/max length for strings
- Range validation for numbers
- Regex patterns
- Custom error messages

**Validation Strategy:**
1. Generate JSON Schema constraints from proto annotations
2. Use JSONForms built-in validation
3. Add custom validators for complex rules
4. Display errors inline with Vuetify styling

### 6. Testing

**Create tests for protobuf-forms package:**

```typescript
describe('messageToJsonSchema', () => {
  it('should convert simple message to JSON schema', () => {
    // Test with a simple proto message
  })

  it('should handle nested messages', () => {
    // Test nested object structures
  })

  it('should handle repeated fields as arrays', () => {
    // Test array handling
  })

  it('should handle enum fields', () => {
    // Test enum → select
  })

  it('should mark required fields', () => {
    // Test required validation
  })
})

describe('ProtobufForm Component', () => {
  it('should render form with all fields', () => {
    // Test rendering
  })

  it('should emit submit with valid protobuf message', () => {
    // Test type conversion
  })

  it('should show validation errors', () => {
    // Test validation
  })
})
```

### 7. Documentation

**Update package README (`packages/protobuf-forms/README.md`):**

- Installation and setup
- Basic usage examples
- All prop and event documentation
- Custom UI schema examples
- Custom renderer examples
- Troubleshooting common issues

**Add to Developer Guide:**
- When to use ProtobufForm vs manual forms
- How to customize appearance
- How to add custom validators
- Performance considerations for large forms

## Known Challenges

**1. TypeScript Types:**
- JSONForms uses `any` extensively
- Need to add proper type guards
- Proto Message types need conversion to plain objects

**2. JSONForms Alpha Version:**
- Using `@jsonforms/vue@3.7.0-alpha.2`
- May have bugs or breaking changes
- Document any workarounds needed

**3. Repeated Fields:**
- Need good UX for add/remove items
- Drag-to-reorder would be nice
- Nested repeated fields are complex

**4. File Uploads:**
- `bytes` fields need special handling
- Consider integration with upload service
- Preview for images

**5. Default Values:**
- Proto3 has implicit defaults (empty string, 0, false)
- Need to handle undefined vs default value
- Optional fields in proto3

## Deliverables

1. **Working ProtobufForm Component**
   - `packages/protobuf-forms/src/vue.ts` - fixed and complete
   - `packages/protobuf-forms/src/schema-generator.ts` - conversion logic
   - `packages/protobuf-forms/src/renderers/` - custom field renderers

2. **Tests**
   - Unit tests for schema conversion
   - Component tests for ProtobufForm
   - Integration tests with real proto schemas

3. **Examples**
   - At least 3 working examples in different services
   - Replace manual forms in AccountListView, ConnectorEditView, etc.

4. **Documentation**
   - Updated package README
   - Usage guide in developer docs
   - API reference

## Success Criteria

- [ ] ProtobufForm works with Account proto message
- [ ] Can create/edit accounts using auto-generated form
- [ ] Form validates based on proto field types
- [ ] Submit emits properly typed protobuf message
- [ ] Works with nested messages and repeated fields
- [ ] Vuetify styling matches rest of application
- [ ] At least 3 services using ProtobufForm successfully
- [ ] Developer guide shows clear examples

## Migration Path

**Phase 1:** Get basic form working (string, number, bool, enum)
**Phase 2:** Add nested messages and repeated fields
**Phase 3:** Add custom renderers (bytes, timestamp, duration)
**Phase 4:** Migrate existing manual forms to use ProtobufForm
**Phase 5:** Add advanced features (conditional fields, custom validation)

## Notes

- Start simple - string and number fields first
- Test with Account message (it's simple)
- Then try more complex messages (Connector, PipeDoc)
- Keep the component flexible - allow both auto and manual UI schemas
- Performance matters - large forms should render quickly
- Consider memoization for schema generation

## Reference Files

- Current (disabled) component: `packages/protobuf-forms/src/vue.ts`
- JSONForms docs: https://jsonforms.io/docs
- Example manual form: `apps/platform-shell/ui/src/services/account-manager/src/views/AccountEditView.vue`
- Proto schemas: From `@ai-pipestream/grpc-stubs` package
