# Task: Component Documentation and Interactive Gallery

## Objective
Create an interactive component documentation system using Storybook or a custom gallery to showcase all shared components with live examples and usage code.

## Context

**Current State:**
- ComponentsPage exists showing some components
- No formal documentation for components
- No prop/event documentation
- No usage examples
- Developers must read source code to understand components

**Packages with Components:**
- `packages/shared-components/` - Core UI components
- `packages/shared-nav/` - Navigation shell components
- `packages/protobuf-forms/` - Form components

**Goal:**
Interactive gallery where developers can:
- See all available components
- View live examples with different prop combinations
- Copy usage code
- Understand props, events, and slots
- Test components with different states

## Requirements

### Option A: Enhanced Built-in Gallery

**Enhance existing `apps/platform-shell/ui/src/pages/ComponentsPage.vue`:**

**Features to add:**
1. Auto-generate component list from packages
2. Live prop editor for each component
3. Code snippet generator
4. Dark/light mode toggle
5. Mobile/tablet/desktop preview
6. Accessibility audit display

**Component Showcase Structure:**

```vue
<template>
  <v-container>
    <v-row>
      <!-- Sidebar with component list -->
      <v-col cols="3">
        <v-list>
          <v-list-group v-for="category in categories">
            <template v-slot:activator>{{ category.name }}</template>
            <v-list-item
              v-for="component in category.components"
              :key="component.name"
              @click="selectComponent(component)"
            >
              {{ component.name }}
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-col>

      <!-- Main content area -->
      <v-col cols="9">
        <ComponentShowcase
          v-if="selectedComponent"
          :component="selectedComponent"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
```

**ComponentShowcase:**

```vue
<template>
  <div class="component-showcase">
    <h1>{{ component.name }}</h1>
    <p>{{ component.description }}</p>

    <!-- Live preview -->
    <v-card class="mb-4">
      <v-card-title>Live Preview</v-card-title>
      <v-card-text>
        <component
          :is="component.component"
          v-bind="currentProps"
          @[event]="handleEvent"
        />
      </v-card-text>
    </v-card>

    <!-- Prop controls -->
    <v-card class="mb-4">
      <v-card-title>Props</v-card-title>
      <v-card-text>
        <v-row v-for="prop in component.props" :key="prop.name">
          <v-col cols="4">{{ prop.name }}</v-col>
          <v-col cols="8">
            <PropEditor
              :prop="prop"
              v-model="currentProps[prop.name]"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Code snippet -->
    <v-card>
      <v-card-title>
        Usage Code
        <v-btn icon="mdi-content-copy" size="small" @click="copyCode" />
      </v-card-title>
      <v-card-text>
        <pre><code>{{ usageCode }}</code></pre>
      </v-card-text>
    </v-card>
  </div>
</template>
```

### Option B: Storybook Integration

**Install and configure Storybook:**

```bash
pnpm add -D @storybook/vue3 @storybook/addon-essentials
pnpx storybook@latest init
```

**Create stories for each component:**

```typescript
// packages/shared-components/src/components/GrpcHealthStatus.stories.ts

import type { Meta, StoryObj } from '@storybook/vue3'
import GrpcHealthStatus from './GrpcHealthStatus.vue'

const meta: Meta<typeof GrpcHealthStatus> = {
  title: 'Components/GrpcHealthStatus',
  component: GrpcHealthStatus,
  tags: ['autodocs'],
  argTypes: {
    serviceName: { control: 'text' },
    compact: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    compactSize: { control: 'select', options: ['small', 'default', 'large'] }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    serviceName: 'platform-registration-service'
  }
}

export const Compact: Story = {
  args: {
    serviceName: 'repository-service',
    compact: true
  }
}

export const IconOnly: Story = {
  args: {
    serviceName: 'account-manager',
    compact: true,
    iconOnly: true
  }
}

export const Disconnected: Story = {
  args: {
    serviceName: 'unavailable-service'
  }
}
```

### 2. Auto-Generate Component Metadata

**Create script to extract component info:**

```typescript
// scripts/extract-component-metadata.ts

import { parse } from '@vue/compiler-sfc'
import * as fs from 'fs'
import * as path from 'path'

interface ComponentMetadata {
  name: string
  description: string
  props: Array<{
    name: string
    type: string
    required: boolean
    default?: any
    description: string
  }>
  events: Array<{
    name: string
    payload: string
    description: string
  }>
  slots: Array<{
    name: string
    props: string
    description: string
  }>
  examples: string[]
}

function extractMetadata(componentPath: string): ComponentMetadata {
  const source = fs.readFileSync(componentPath, 'utf-8')
  const { descriptor } = parse(source)

  // Parse script setup for props/events
  // Parse template for slots
  // Extract JSDoc comments for descriptions

  return metadata
}

// Scan all components and generate metadata.json
const components = scanComponentDirectory('packages/shared-components/src/components')
const metadata = components.map(extractMetadata)

fs.writeFileSync(
  'apps/platform-shell/ui/src/data/component-metadata.json',
  JSON.stringify(metadata, null, 2)
)
```

### 3. Prop Type Editor Component

**Create dynamic prop editor based on type:**

```vue
<!-- PropEditor.vue -->
<template>
  <v-text-field
    v-if="prop.type === 'string'"
    v-model="localValue"
    :label="prop.name"
  />

  <v-switch
    v-else-if="prop.type === 'boolean'"
    v-model="localValue"
    :label="prop.name"
  />

  <v-text-field
    v-else-if="prop.type === 'number'"
    v-model.number="localValue"
    type="number"
    :label="prop.name"
  />

  <v-select
    v-else-if="prop.type === 'enum'"
    v-model="localValue"
    :items="prop.options"
    :label="prop.name"
  />

  <v-textarea
    v-else-if="prop.type === 'object'"
    v-model="jsonValue"
    :label="prop.name"
    hint="JSON format"
  />
</template>
```

### 4. Categories and Organization

**Organize components by category:**

```typescript
const componentCategories = {
  'Data Display': [
    'GrpcHealthStatus',
    'ServiceStatusBadge',
    'DataTable'
  ],
  'Forms & Inputs': [
    'ProtobufForm',
    'SearchPanel',
    'FileUploader'
  ],
  'Navigation': [
    'AppShell',
    'AppBar',
    'NavDrawer'
  ],
  'Feedback': [
    'LoadingSpinner',
    'ErrorAlert',
    'SuccessMessage'
  ],
  'Layout': [
    'PageContainer',
    'SplitView'
  ]
}
```

### 5. Accessibility Documentation

**For each component, document:**

- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus management

**Add a11y testing:**

```typescript
import { axe } from 'vitest-axe'

it('should have no accessibility violations', async () => {
  const wrapper = mount(GrpcHealthStatus, {
    props: { serviceName: 'test' }
  })

  const results = await axe(wrapper.element)
  expect(results).toHaveNoViolations()
})
```

## Deliverables

### If using built-in gallery:
1. Enhanced ComponentsPage with live editing
2. Component metadata extraction script
3. PropEditor component
4. Code snippet generator
5. Category organization

### If using Storybook:
1. Storybook configuration
2. Stories for all 20+ components
3. Addon configuration (a11y, controls, docs)
4. Custom Storybook theme matching app
5. Deployment setup (static build)

### Both approaches:
1. Component documentation (JSDoc in source files)
2. Usage examples for each component
3. Accessibility documentation
4. Performance notes (when to use, when not to)
5. Migration guide (if replacing old components)

## Success Criteria

- [ ] All shared components have documentation
- [ ] Live examples for each component
- [ ] Props and events clearly documented
- [ ] Copy-pasteable code snippets
- [ ] Searchable component library
- [ ] Accessible via dev server
- [ ] Mobile-responsive gallery
- [ ] Easy to add new components

## Notes

- Built-in gallery: Simpler, integrated, but more work
- Storybook: Feature-rich, standard, but extra dependency
- Consider hybrid: Storybook for development, gallery for production
- Auto-generate what you can (metadata extraction)
- Keep examples simple and focused
- Document the "why" not just the "what"
