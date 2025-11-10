# Claude Agent Task Instructions

This directory contains detailed task instructions for Claude Code agents to autonomously implement features and improvements for the platform-frontend project.

## Available Tasks

### Priority 1: Foundation (Do These First)

#### 00. Auto-Start Build Environment
**File:** `00-auto-start-build-environment.md`
**Effort:** 2-3 hours
**Value:** 🔥🔥🔥 Critical

Automates the complete development environment setup. Creates scripts to start all services (platform-registration, backend, frontend) with one command.

**Why critical:** Every developer (and Claude agent) needs this to be productive.

---

#### 01. Developer Guide
**File:** `01-developer-guide.md`
**Effort:** 4-6 hours
**Value:** 🔥🔥🔥 Critical

Comprehensive onboarding documentation covering:
- Getting started
- Adding new services
- gRPC patterns
- Troubleshooting

**Why critical:** Reduces onboarding time from weeks to days.

---

### Priority 2: Quality & Developer Experience

#### 02. Testing Infrastructure
**File:** `02-testing-infrastructure.md`
**Effort:** 6-8 hours
**Value:** 🔥🔥 High

Build complete testing setup with:
- Vitest configuration
- Mock utilities for gRPC
- Example tests (10-15 files)
- Testing guide

**Why important:** No tests = no confidence in changes.

---

#### 09. Code Quality Tooling
**File:** `09-code-quality-tooling.md`
**Effort:** 3-4 hours
**Value:** 🔥🔥 High

Setup ESLint, Prettier, strict TypeScript:
- Consistent code style
- Pre-commit hooks
- CI quality gates
- Type safety enforcement

**Why important:** Prevents code quality drift.

---

### Priority 3: Core Features

#### 03. ProtobufForm Component
**File:** `03-protobuf-form-component.md`
**Effort:** 8-12 hours
**Value:** 🔥🔥🔥 Critical (but complex)

Fix and complete auto-generated forms from protobuf schemas:
- Schema conversion logic
- Custom field renderers
- Validation integration
- Working examples

**Why critical:** This is the "secret weapon" - forms auto-generated from backend proto definitions.

---

#### 04. Graceful Service Unavailability
**File:** `04-graceful-service-unavailability.md`
**Effort:** 4-6 hours
**Value:** 🔥🔥 High

Improve UX when services go down:
- Keep nav items visible but disabled
- Show "site dusting" page
- Health status indicators
- Auto-redirect when service returns

**Why important:** Current behavior (items disappearing) is confusing for users.

---

### Priority 4: Production Readiness

#### 05. Error Boundary and Logging
**File:** `05-error-boundary-and-logging.md`
**Effort:** 4-5 hours
**Value:** 🔥🔥 High

Production-grade error handling:
- Vue error boundaries
- Centralized logging
- User-friendly error messages
- Log aggregation to backend

**Why important:** Can't debug production issues without good logging.

---

#### 06. Performance Optimization
**File:** `06-performance-optimization.md`
**Effort:** 6-8 hours
**Value:** 🔥 Medium-High

Optimize bundle size and runtime performance:
- Code splitting and lazy loading
- Vuetify tree-shaking
- Streaming optimizations
- Bundle analysis

**Why important:** Large bundles = slow load times.

---

### Priority 5: Nice to Have

#### 07. Component Documentation
**File:** `07-component-documentation-storybook.md`
**Effort:** 6-10 hours
**Value:** 🔥 Medium

Interactive component gallery with:
- Live examples
- Prop documentation
- Code snippets
- Storybook or custom gallery

**Why useful:** Helps developers discover and use shared components.

---

#### 08. Authentication & Authorization
**File:** `08-authentication-authorization.md`
**Effort:** 10-15 hours
**Value:** 🔥🔥 High (when needed)

User auth and permissions:
- Login/logout
- JWT tokens
- Role-based access
- Protected routes

**Why defer:** Depends on backend auth service being ready.

---

## Recommended Execution Order

**Week 1: Get Foundation Right**
1. Auto-Start Build Environment (00) - 2-3 hours
2. Developer Guide (01) - 4-6 hours
3. Code Quality Tooling (09) - 3-4 hours

**Week 2: Add Testing & Fix UX**
4. Testing Infrastructure (02) - 6-8 hours
5. Graceful Service Unavailability (04) - 4-6 hours
6. Error Boundary and Logging (05) - 4-5 hours

**Week 3: Advanced Features**
7. ProtobufForm Component (03) - 8-12 hours
8. Performance Optimization (06) - 6-8 hours

**Week 4: Polish**
9. Component Documentation (07) - 6-10 hours
10. Authentication (08) - 10-15 hours (when backend ready)

## Total Estimated Effort

- **Must-have (1-3):** 9-13 hours
- **Should-have (2,4,5,9):** 17-23 hours
- **Nice-to-have (6,7):** 12-18 hours
- **When-ready (8):** 10-15 hours

**Total:** 48-69 hours of focused development work

## How to Use These Files

### For Claude Code Agents:

1. **Read the instruction file completely**
2. **Understand context and requirements**
3. **Execute deliverables in order**
4. **Test everything before completing**
5. **Update documentation**
6. **Commit with descriptive messages**

### For Human Developers:

These files also serve as:
- Feature specifications
- Implementation guides
- Success criteria checklists
- Testing requirements

## Running Multiple Agents in Parallel

**Safe to parallelize:**
- 00 (Auto-start) + 01 (Developer Guide) - No conflicts
- 02 (Testing) + 09 (Code Quality) - Different concerns
- 05 (Error Boundary) + 06 (Performance) - Different areas

**Must run sequentially:**
- 00 before anything else (needed for testing)
- 01 before 07 (component docs reference dev guide)
- 02 before 03 (need test infrastructure for protobuf forms)
- 09 before others (linting will catch issues early)

## Agent Budget Estimation

**Using Claude Sonnet:**
- Simple tasks (00, 09): ~$5-10 each
- Medium tasks (01, 04, 05): ~$15-25 each
- Complex tasks (02, 03, 06, 07): ~$30-50 each
- Very complex (08): ~$50-80

**$1000 budget could cover:**
- All Priority 1 tasks (~$50)
- All Priority 2 tasks (~$100)
- All Priority 3 tasks (~$150)
- Most Priority 4 tasks (~$100)
- Some Priority 5 tasks (~$80)

**Total: ~$480** with plenty left for revisions and additional features.

## Success Metrics

After completing all tasks:

**Developer Experience:**
- Onboarding time: < 1 day
- Time to first feature: < 2 days
- Questions per new dev: < 5

**Code Quality:**
- TypeScript strict: 100%
- Test coverage: > 60%
- ESLint errors: 0
- Bundle size: < 200 KB initial

**Production Readiness:**
- Error tracking: Yes
- Logging: Centralized
- Performance: Lighthouse > 90
- Uptime UX: Graceful degradation

## Notes

- Each task is independent and well-defined
- All have clear deliverables and success criteria
- Estimated efforts are for experienced developers
- Agents may take 1.5-2x longer than estimates
- Testing time is included in estimates
- Documentation time is included

## Getting Started

**To launch an agent on a task:**

```bash
# Read the task file
cat docs/claude-agents/01-developer-guide.md

# Launch Claude Code agent with the task
# The agent will read the file and execute autonomously
```

**Monitor progress:**
- Check commits for completed work
- Run builds to verify nothing broke
- Review deliverables against success criteria
- Test the implementation manually

## Questions?

See individual task files for detailed requirements, or refer to the main project documentation.
