# Tasks: Admin Create User Page with Hierarchical Role Selection

**Input**: Design documents from `/specs/003-implement-admin-create/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

**User Requirement**: "Default choose system roles then show system roles to choose. if choose org roles then show all org roles to choose" - Single tabbed interface, not two-step process

## 🎯 EXECUTION STATUS
**GENERATED**: `/tasks` command executed - 22 tasks ready for implementation
**STATUS**: 📋 READY FOR EXECUTION - Follow TDD methodology for each task

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Extracted: Next.js 15, React 18, TanStack Form, shadcn/ui, Better Auth, Prisma
2. Load design documents ✅:
   → data-model.md: Role selection entities, user creation flow
   → contracts/: API contracts and component interfaces
3. Generate tasks by category:
   → Setup: TypeScript types, form validation schemas
   → Tests: API contract tests, component integration tests
   → Core: Hierarchical role selection components, user creation forms, API endpoints
   → Integration: Better Auth integration, email services
   → Polish: Error handling, accessibility, performance validation
4. Apply task rules:
   → Different files = [P] for parallel execution
   → TDD order: Tests before implementation
5. Number tasks sequentially (T001, T002...)
6. SUCCESS: 22 numbered, ordered tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are absolute from repository root `/Users/renhotsai/Desktop/playhard/bo/`

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 [P] Create TypeScript types for hierarchical role selection in src/types/hierarchical-roles.ts
- [ ] T002 [P] Create form validation schema using Zod in src/lib/form-validators.ts
- [ ] T003 [P] Create role selection utility functions in src/lib/role-selection-utils.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests
- [ ] T004 [P] Contract test POST /api/admin/users/create in tests/api/admin-create-user.test.ts
- [ ] T005 [P] Contract test GET /api/admin/organizations in tests/api/admin-organizations.test.ts

### Component Tests
- [ ] T006 [P] Component test HierarchicalRoleSelection in tests/components/hierarchical-role-selection.test.tsx
- [ ] T007 [P] Component test CategorySelection in tests/components/category-selection.test.tsx
- [ ] T008 [P] Component test RoleSelectionStep in tests/components/role-selection-step.test.tsx
- [ ] T009 [P] Component test OrganizationSelection in tests/components/organization-selection.test.tsx
- [ ] T010 [P] Component test CreateUserForm in tests/components/create-user-form.test.tsx

### Integration Tests
- [ ] T011 [P] Integration test user creation flow in tests/integration/user-creation-flow.test.ts
- [ ] T012 [P] Integration test role selection behavior in tests/integration/role-selection-behavior.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Hierarchical Role Selection Components
- [ ] T013 [P] Create CategorySelection component in src/components/forms/hierarchical-role-selection/category-selection.tsx
- [ ] T014 [P] Create RoleSelectionStep component in src/components/forms/hierarchical-role-selection/role-selection-step.tsx
- [ ] T015 [P] Create StepIndicator component in src/components/forms/hierarchical-role-selection/step-indicator.tsx
- [ ] T016 [P] Create OrganizationSelection component in src/components/forms/hierarchical-role-selection/organization-selection.tsx
- [ ] T017 Update HierarchicalRoleSelection main component in src/components/forms/hierarchical-role-selection/hierarchical-role-selection.tsx

### Custom Hook & State Management
- [ ] T018 [P] Create useHierarchicalSelection hook in src/hooks/use-hierarchical-selection.ts

### Form Components
- [ ] T019 Create CreateUserForm with TanStack Form in src/components/forms/create-user-form.tsx

### API Endpoints
- [ ] T020 Implement POST /api/admin/users/create endpoint in src/app/api/admin/users/create/route.ts
- [ ] T021 Update GET /api/admin/organizations endpoint in src/app/api/admin/organizations/route.ts

### Page Implementation
- [ ] T022 Create admin user creation page in src/app/dashboard/admin/users/create/page.tsx

## Dependencies
- Types & setup (T001-T003) before all other tasks
- Tests (T004-T012) before implementation (T013-T022)
- Component hierarchy: T013-T016 before T017 (main HierarchicalRoleSelection component)
- T018 (custom hook) blocks T017, T019 (form components need hook)
- T019 (form) blocks T022 (page needs form)
- T020-T021 (API endpoints) can be parallel with components


## Parallel Execution Examples

### Phase 3.1 - Setup (All Parallel)
```
Task: "Create TypeScript types for hierarchical role selection in src/types/hierarchical-roles.ts"
Task: "Create form validation schema using Zod in src/lib/form-validators.ts" 
Task: "Create role selection utility functions in src/lib/role-selection-utils.ts"
```

### Phase 3.2 - Tests (All Parallel)
```
Task: "Contract test POST /api/admin/users/create in tests/api/admin-create-user.test.ts"
Task: "Contract test GET /api/admin/organizations in tests/api/admin-organizations.test.ts"
Task: "Component test HierarchicalRoleSelection in tests/components/hierarchical-role-selection.test.tsx"
Task: "Component test CategorySelection in tests/components/category-selection.test.tsx"
Task: "Component test RoleSelectionStep in tests/components/role-selection-step.test.tsx"
Task: "Component test OrganizationSelection in tests/components/organization-selection.test.tsx"
Task: "Component test CreateUserForm in tests/components/create-user-form.test.tsx"
Task: "Integration test user creation flow in tests/integration/user-creation-flow.test.ts"
Task: "Integration test role selection behavior in tests/integration/role-selection-behavior.test.ts"
```

### Phase 3.3 - Component Implementation (Partially Parallel)
```
# First wave - Independent sub-components:
Task: "Create CategorySelection component in src/components/forms/hierarchical-role-selection/category-selection.tsx"
Task: "Create RoleSelectionStep component in src/components/forms/hierarchical-role-selection/role-selection-step.tsx"
Task: "Create StepIndicator component in src/components/forms/hierarchical-role-selection/step-indicator.tsx" 
Task: "Create OrganizationSelection component in src/components/forms/hierarchical-role-selection/organization-selection.tsx"
Task: "Create useHierarchicalSelection hook in src/hooks/use-hierarchical-selection.ts"

# Second wave - Main components (after first wave):
Task: "Update HierarchicalRoleSelection main component in src/components/forms/hierarchical-role-selection/hierarchical-role-selection.tsx"
Task: "Create CreateUserForm with TanStack Form in src/components/forms/create-user-form.tsx"
Task: "Implement POST /api/admin/users/create endpoint in src/app/api/admin/users/create/route.ts"
Task: "Update GET /api/admin/organizations endpoint in src/app/api/admin/organizations/route.ts"
```

## Agent Consultation Requirements
**MANDATORY**: Before implementing any task, MUST consult with the appropriate specialized agent based on the feature domain:

### Authentication & Authorization (T020, T021)
- **Agent**: `better-auth-validator`
- **Tasks**: API endpoint implementations, session validation, role-based access control
- **Rationale**: Better Auth integration for user creation, organization access, and permission validation

### UI Components & Styling (T013-T017, T019, T022)  
- **Agent**: `shadcn-ui-designer`
- **Tasks**: All component implementations, form styling, layout components
- **Rationale**: Consistent shadcn/ui integration, accessible form components, proper styling patterns

### TanStack Functionality (T018, T019)
- **Agent**: `tanstack-expert`
- **Tasks**: Form state management, custom hooks, validation integration
- **Rationale**: TanStack Form patterns, proper hook implementation, form validation with Zod

### Next.js Architecture (T001-T003, T020-T022)
- **Agent**: `nextjs-compliance-checker`  
- **Tasks**: File structure, API routes, page implementations, TypeScript configuration
- **Rationale**: Next.js App Router compliance, proper project structure, API route patterns

**Implementation Process**: 
1. Identify Domain → 2. Consult Agent → 3. Follow Guidance → 4. Validate

## Task Validation Checklist
*GATE: Checked before implementation*

- [x] All contracts have corresponding tests (T004-T005 ↔ admin-create-user-api.yaml)
- [x] All components have test tasks (T006-T010 ↔ T013-T019)
- [x] All tests come before implementation (Phase 3.2 → Phase 3.3)
- [x] Parallel tasks are truly independent ([P] marked appropriately)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Dependencies clearly mapped (setup → tests → implementation)
- [x] TDD workflow enforced (tests must fail before implementation)

## Notes
- [P] tasks target different files with no dependencies
- All tests must fail before implementing (TDD enforcement)
- Commit after each completed task
- User's requirement: "Default system roles, switch to org roles" integrated into T017 task
- Hierarchical role selection matches user's specification for tabbed interface
- Better Auth magic link integration for user invitations
- shadcn/ui components for consistent styling
- TanStack Form for robust form state management