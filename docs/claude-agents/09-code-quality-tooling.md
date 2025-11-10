# Task: Setup Code Quality Tooling and CI Checks

## Objective
Implement ESLint, Prettier, TypeScript strict mode, and automated code quality checks in CI/CD to maintain code consistency and catch issues early.

## Context

**Current State:**
- TypeScript with `strict: false` in some configs
- No ESLint configuration
- No Prettier formatting
- Inconsistent code style across files
- No pre-commit hooks
- No automated code quality checks in CI

**Problems:**
- Inconsistent formatting
- Type safety gaps
- No style enforcement
- Code quality drift over time

## Requirements

### 1. ESLint Configuration

**Install ESLint with Vue and TypeScript support:**

```bash
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D eslint-plugin-vue vue-eslint-parser
pnpm add -D @vue/eslint-config-typescript
```

**Create `.eslintrc.cjs`:**

```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],

    // Vue rules
    'vue/multi-word-component-names': 'warn',
    'vue/no-unused-components': 'warn',
    'vue/no-unused-vars': 'error',

    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

### 2. Prettier Configuration

**Install Prettier:**

```bash
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
```

**Create `.prettierrc.json`:**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "vueIndentScriptAndStyle": false
}
```

**Create `.prettierignore`:**

```
dist
node_modules
pnpm-lock.yaml
*.min.js
```

### 3. TypeScript Strict Mode

**Update all tsconfig.json files:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Fix all type errors:**
- Remove all `any` types
- Add proper type annotations
- Fix null/undefined handling
- Add type guards where needed

### 4. Pre-commit Hooks

**Install Husky and lint-staged:**

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

**Configure `.lintstagedrc.json`:**

```json
{
  "*.{ts,tsx,vue}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

**Setup pre-commit hook (`.husky/pre-commit`):**

```bash
#!/bin/sh
pnpm lint-staged
pnpm typecheck
```

### 5. Package Scripts

**Add to package.json:**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.vue",
    "lint:fix": "eslint . --ext .ts,.tsx,.vue --fix",
    "format": "prettier --write \"**/*.{ts,tsx,vue,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,vue,json,md}\"",
    "typecheck": "vue-tsc --noEmit"
  }
}
```

### 6. CI/CD Quality Checks

**Update `.github/workflows/build-and-publish.yml`:**

```yaml
jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Type check
        run: pnpm typecheck

      - name: Run tests
        run: pnpm -r test

  build:
    needs: code-quality  # Only build if quality checks pass
    runs-on: ubuntu-latest
    # ... existing build steps
```

### 7. Import Organization

**Configure import sorting:**

```javascript
// .eslintrc.cjs

rules: {
  'import/order': ['error', {
    'groups': [
      'builtin',
      'external',
      'internal',
      'parent',
      'sibling',
      'index'
    ],
    'pathGroups': [
      {
        'pattern': 'vue',
        'group': 'external',
        'position': 'before'
      },
      {
        'pattern': '@/**',
        'group': 'internal'
      }
    ],
    'alphabetize': {
      'order': 'asc'
    }
  }]
}
```

### 8. Dependency Auditing

**Add to CI:**

```yaml
- name: Audit dependencies
  run: pnpm audit --audit-level=high

- name: Check for outdated dependencies
  run: pnpm outdated || true
```

### 9. Code Complexity Checks

**Optional: Add complexity linting:**

```javascript
rules: {
  'complexity': ['warn', 10],
  'max-lines': ['warn', 300],
  'max-depth': ['warn', 4],
  'max-params': ['warn', 4]
}
```

## Deliverables

1. ESLint configuration with Vue and TypeScript rules
2. Prettier configuration and integration
3. TypeScript strict mode enabled everywhere
4. Pre-commit hooks with Husky
5. CI/CD quality checks before build
6. Package scripts for lint/format/typecheck
7. Import sorting configuration
8. All existing code passing quality checks
9. Documentation on code standards

## Migration Strategy

**Phase 1: Setup (Don't break existing code)**
- Install tooling
- Configure with warnings (not errors)
- Run and document all issues

**Phase 2: Gradual Fix**
- Fix one package at a time
- Start with new code (strict mode on new files)
- Slowly migrate existing code

**Phase 3: Enforcement**
- Change warnings to errors
- Add pre-commit hooks
- Block CI on failures

## Success Criteria

- [ ] ESLint passes with 0 errors
- [ ] Prettier formats all files consistently
- [ ] TypeScript strict mode enabled
- [ ] Pre-commit hooks prevent bad commits
- [ ] CI fails on quality issues
- [ ] No `any` types in new code
- [ ] Import order is consistent
- [ ] Code style is uniform

## Notes

- Don't try to fix everything at once
- Use `// eslint-disable-next-line` sparingly
- Document why rules are disabled
- Keep rules pragmatic (not pedantic)
- Focus on catching real bugs, not style nitpicks
