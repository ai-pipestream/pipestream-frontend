# @pipeline/shared-components

Shared Vue 3 + Vuetify 3 components library for the Pipeline platform. These components are designed to work with `@pipeline/proto-stubs` types and can be used across all frontend applications.

## 📦 Installation

```bash
pnpm add @pipeline/shared-components
```

## 🚀 Usage

```typescript
// Import individual components
import { PipeDocPreview, ResponseViewer } from '@pipeline/shared-components'

// Or import everything
import * as SharedComponents from '@pipeline/shared-components'
```

## 🧩 Adding New Components

Follow these steps to add a new component to the shared library:

### 1. Create the Component

Create your Vue component in `src/components/`:

```vue
<!-- src/components/YourComponent.vue -->
<template>
  <v-card>
    <!-- Your component template -->
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  // Define your props
  data?: any
}

const props = withDefaults(defineProps<Props>(), {
  // Default values
})

// Component logic here
</script>

<style scoped>
/* Component styles */
</style>
```

### 2. Export the Component

Add your component export to `src/index.ts`:

```typescript
// Export your component
export { default as YourComponent } from './components/YourComponent.vue'

// Add to appropriate category
export const componentCategories = {
  display: ['PipeDocPreview', 'ResponseViewer'],
  forms: ['RequestBuilderCard', 'MappingConfigCard'],
  cards: ['YourComponent'], // Add here if it's a card
  dev: ['ComponentGallery']
}
```

### 3. Add Component Metadata

Add metadata for automatic discovery in ComponentGallery:

```typescript
export const componentMetadata = {
  // ... existing components ...
  YourComponent: {
    name: 'YourComponent',
    description: 'Brief description of what your component does',
    category: 'cards', // display, forms, cards, or dev
    props: {
      data: {
        type: 'any',
        required: false,
        description: 'The data to display'
      }
      // Document all props here
    },
    events: ['update', 'change'], // List emitted events
    slots: [] // List available slots
  }
}
```

### 4. Add Sample Data (Optional)

If you want your component to appear in the ComponentGallery with sample data, update the `getSamplePropsForComponent` function in `src/components/ComponentGallery.vue`:

```typescript
const getSamplePropsForComponent = (componentName: string): any => {
  const sampleData: Record<string, any> = {
    // ... existing samples ...
    YourComponent: {
      data: {
        // Your sample data here
        id: 'sample-001',
        title: 'Sample Title'
      }
    }
  }
  
  return sampleData[componentName] || {}
}
```

### 5. Build the Library

```bash
pnpm build
```

### 6. Test in ComponentGallery

Your component will automatically appear in the ComponentGallery when used in any application that imports `@pipeline/shared-components`.

To test in the mapping-service:
1. The mapping-service is already configured to use shared-components
2. Navigate to the ComponentGallery view
3. Your new component should appear in the sidebar
4. Click on it to see the preview with sample data

## 📁 Project Structure

```
shared-components/
├── src/
│   ├── components/          # Vue components
│   │   ├── PipeDocPreview.vue
│   │   ├── ResponseViewer.vue
│   │   ├── RequestBuilderCard.vue
│   │   ├── MappingConfigCard.vue
│   │   └── ComponentGallery.vue
│   └── index.ts             # Main exports and metadata
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Component Categories

- **display**: Components for displaying data (PipeDocPreview, ResponseViewer)
- **forms**: Form and input components (RequestBuilderCard, MappingConfigCard)
- **cards**: Card-based UI components
- **dev**: Development tools (ComponentGallery)

## 🛠️ Development

### Prerequisites

- Node.js 22.x
- pnpm 10+
- Vue 3.3+
- Vuetify 3.4+

### Commands

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Type checking
pnpm typecheck
```

## 📝 Component Guidelines

When creating components for this library:

1. **Use Vuetify 3 components** for consistent styling
2. **Support dark mode** using Vuetify's theme system
3. **Type your props** using TypeScript interfaces
4. **Document props** in the metadata for ComponentGallery
5. **Provide sample data** for testing in ComponentGallery
6. **Use Material Design Icons** (mdi) for icons
7. **Follow Vue 3 Composition API** patterns
8. **Make components self-contained** with minimal external dependencies

## 🧪 Testing Components

The ComponentGallery provides an interactive environment for testing components:

1. **Preview Mode**: See the component with sample data
2. **Props Mode**: View prop definitions and sample props JSON
3. **Events Mode**: Monitor emitted events in real-time

### Live Functionality

Components rendered in the ComponentGallery are **fully functional**, not mocks or previews. This means:

- **API Calls**: Components that make gRPC/REST calls will connect to real services
- **State Management**: Vuex, Pinia, or internal reactive state works normally
- **Event Handlers**: All clicks, form submissions, and events function as designed
- **Service Connections**: Real connections to backend services, WebSockets, gRPC streams, etc.
- **Lifecycle Hooks**: `onMounted`, `onUpdated`, and other hooks execute normally
- **Side Effects**: Any side effects (localStorage, cookies, external integrations) will occur

Example: A ServiceRegistration component that connects to actual services:
```vue
<script setup lang="ts">
// This code runs live in ComponentGallery
const registerService = async () => {
  const client = new ServiceRegistryClient('http://localhost:8080')
  await client.register({ /* ... */ })  // Real registration happens!
}

onMounted(() => {
  fetchAvailableServices() // Executes when mounted in gallery
})
</script>
```

**Important**: Ensure components handle error states gracefully (e.g., when backend services are unavailable) to prevent breaking the ComponentGallery.

## 🔄 Integration with Applications

### Mapping Service
Already configured and using the shared components library. The ComponentGallery is available for testing.

### Other Frontend Applications
To use in other frontends:

1. Add dependency: `pnpm add @pipeline/shared-components`
2. Import needed components
3. Ensure Vuetify 3 is configured
4. Ensure MDI fonts are loaded: `import '@mdi/font/css/materialdesignicons.css'`

## 📦 Component Exports

The library exports:
- Individual components (named exports)
- `componentCategories` - Categorized list of components
- `componentMetadata` - Metadata for all components
- `version` - Library version

## 🤝 Contributing

1. Follow the component addition steps above
2. Ensure TypeScript builds without errors
3. Test your component in ComponentGallery
4. Update this README if adding new categories or patterns

## 📄 License

Part of the Pipeline platform - internal use only.
