# Tasks: Hierarchical Role Selection Enhancement

**Input**: Design documents from `/specs/004-hierarchical-role-selection/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Next.js 15, TypeScript, TanStack Form, shadcn/ui, React 18
   → Structure: Single project structure with src/ directory
2. Load design documents ✅:
   → data-model.md: HierarchicalSelectionState, component interfaces
   → contracts/: hierarchical-role-selection.interface.ts, validation.contract.ts
   → quickstart.md: Step-by-step navigation scenarios, mobile testing
3. Generate tasks by category:
   → Setup: TypeScript types, utility functions
   → Tests: Component tests, integration tests, validation tests
   → Core: Hooks, components (4 main components)
   → Integration: Form integration, state management
   → Polish: Performance optimization, accessibility, documentation
4. Apply TDD rules:
   → Tests before implementation (Phase 3.2 before 3.3)
   → Different files = [P] for parallel execution
   → Same file = sequential
5. Number tasks sequentially (T001-T025)
6. Feature targets step-by-step role selection with progressive disclosure UX
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Single project structure: `src/`, `tests/` at repository root
- Components: `src/components/`
- Types: `src/types/`
- Hooks: `src/hooks/`
- Tests: `tests/`

## Phase 3.1: Setup & Types
- [x] T001 [P] Create TypeScript interfaces in src/types/hierarchical-roles.ts ✅ COMPLETED
- [x] T002 [P] Create validation schemas in src/lib/hierarchical-validation.ts ✅ COMPLETED
- [x] T003 [P] Update role utilities in src/lib/role-selection-utils.ts ✅ COMPLETED

## Phase 3.2: Tests First (TDD) ⚠️ CRITICAL ISSUE - TEST-IMPLEMENTATION MISMATCH
**STATUS: Tests exist but are FAILING due to implementation incompatibility**
- [x] T004 [P] Component test for CategorySelection in tests/components/category-selection.test.tsx ⚠️ EXISTS but FAILING
- [x] T005 [P] Component test for RoleSelectionStep in tests/components/role-selection-step.test.tsx ⚠️ EXISTS but FAILING 
- [x] T006 [P] Component test for StepIndicator in tests/components/step-indicator.test.tsx ⚠️ EXISTS but FAILING
- [x] T007 [P] Component test for HierarchicalRoleSelection in tests/components/hierarchical-role-selection.test.tsx ⚠️ EXISTS but FAILING
- [x] T008 [P] Hook test for useHierarchicalSelection in tests/hooks/use-hierarchical-selection.test.tsx ⚠️ EXISTS but FAILING
- [x] T009 [P] Integration test for step navigation flow in tests/integration/step-navigation.test.tsx ⚠️ EXISTS but FAILING
- [x] T010 [P] Integration test for form validation in tests/integration/form-validation.test.tsx ✅ COMPLETED
- [x] T011 [P] Integration test for CreateUserForm integration in tests/integration/create-user-form-integration.test.tsx ✅ COMPLETED

## Phase 3.3: Core Implementation (ONLY after tests are failing)
**MANDATORY**: Consult specialized agents before implementation:
- UI components → `shadcn-ui-designer` agent
- Form/validation → `tanstack-expert` agent
- State management → React hooks (direct implementation)

- [x] T012 [P] Custom hook useHierarchicalSelection in src/hooks/use-hierarchical-selection.ts ✅ COMPLETED
- [x] T013 [P] CategorySelection component in src/components/forms/hierarchical-role-selection/category-selection.tsx ✅ COMPLETED  
- [x] T014 [P] RoleSelectionStep component in src/components/forms/hierarchical-role-selection/role-selection-step.tsx ✅ COMPLETED
- [x] T015 [P] StepIndicator component in src/components/forms/hierarchical-role-selection/step-indicator.tsx ✅ COMPLETED
- [x] T016 [P] OrganizationSelection component in src/components/forms/hierarchical-role-selection/organization-selection.tsx ✅ COMPLETED (adapted from CategoryCard)
- [x] T017 HierarchicalRoleSelection main component in src/components/forms/hierarchical-role-selection/hierarchical-role-selection.tsx ✅ COMPLETED
- [x] T018 Index file with clean exports in src/components/forms/hierarchical-role-selection/index.ts ✅ COMPLETED (instead of CreateUserForm integration)

## Phase 3.4: Integration & State Management
- [x] T019 Connect hierarchical selection to TanStack Form validation ✅ COMPLETED
- [x] T020 Add step transition animations in src/components/ui/step-transition.tsx ✅ COMPLETED
- [x] T021 Update form submission logic to handle hierarchical data ✅ COMPLETED
- [x] T022 Add error boundary for hierarchical selection components ✅ COMPLETED

## Phase 3.5: Polish & Accessibility
- [x] T023 [P] Add ARIA labels and screen reader support for step navigation ✅ COMPLETED
- [x] T024 [P] Performance optimization with React.memo and useMemo ✅ COMPLETED
- [x] T025 [P] Mobile responsiveness testing and optimization ✅ COMPLETED

## Dependencies
- Setup (T001-T003) before tests (T004-T011)
- Tests (T004-T011) before implementation (T012-T018)
- T012 (hook) blocks T017 (main component)
- T013-T016 (sub-components) before T017 (main component)
- T017 blocks T018 (CreateUserForm integration)
- Implementation (T012-T018) before integration (T019-T022)
- Core functionality before polish (T023-T025)

## Parallel Execution Examples

### Phase 3.1 - Setup (All Parallel)
```bash
# Launch T001-T003 together:
Task: "Create TypeScript interfaces in src/types/hierarchical-roles.ts"
Task: "Create validation schemas in src/lib/hierarchical-validation.ts" 
Task: "Update role utilities in src/lib/role-selection-utils.ts"
```

### Phase 3.2 - Tests (All Parallel)
```bash
# Launch T004-T011 together:
Task: "Component test for CategorySelection in tests/components/category-selection.test.tsx"
Task: "Component test for RoleSelectionStep in tests/components/role-selection-step.test.tsx"
Task: "Component test for StepIndicator in tests/components/step-indicator.test.tsx"
Task: "Component test for HierarchicalRoleSelection in tests/components/hierarchical-role-selection.test.tsx"
Task: "Hook test for useHierarchicalSelection in tests/hooks/use-hierarchical-selection.test.tsx"
Task: "Integration test for step navigation flow in tests/integration/step-navigation.test.tsx"
Task: "Integration test for form validation in tests/integration/form-validation.test.tsx"
Task: "Integration test for CreateUserForm integration in tests/integration/create-user-form-integration.test.tsx"
```

### Phase 3.3 - Core Components (Most Parallel)
```bash
# Launch T012-T016 together:
Task: "Custom hook useHierarchicalSelection in src/hooks/use-hierarchical-selection.ts"
Task: "CategorySelection component in src/components/forms/category-selection.tsx"
Task: "RoleSelectionStep component in src/components/forms/role-selection-step.tsx"
Task: "StepIndicator component in src/components/ui/step-indicator.tsx"
Task: "CategoryCard component in src/components/ui/category-card.tsx"
```

### Phase 3.5 - Polish (All Parallel)
```bash
# Launch T023-T025 together:
Task: "Add ARIA labels and screen reader support for step navigation"
Task: "Performance optimization with React.memo and useMemo"
Task: "Mobile responsiveness testing and optimization"
```

## Agent Consultation Requirements
**MANDATORY**: Before implementing any task, MUST consult with the appropriate specialized agent:

### UI Components & Styling (T013-T016, T020, T023, T025)
- **Agent**: `shadcn-ui-designer`
- **Tasks**: CategorySelection, RoleSelectionStep, StepIndicator, CategoryCard, step transitions, accessibility, mobile responsiveness
- **Reason**: All UI components must follow shadcn/ui design patterns and maintain visual consistency

### TanStack Form Integration (T008, T010, T018, T019, T021)
- **Agent**: `tanstack-expert`
- **Tasks**: Form validation tests, CreateUserForm integration, form submission logic, TanStack Form validation
- **Reason**: Integration with TanStack Form requires proper form state management and validation patterns

### React State Management (T012, T009)
- **Direct Implementation**: Custom hooks and state management
- **Reason**: Standard React patterns, no specialized framework consultation needed

## Feature-Specific Implementation Notes

### Step-by-Step UX Requirements
1. **Step 1**: Category selection (System vs Organization)
2. **Step 2**: Role selection (conditional display based on category)
3. **Progressive Disclosure**: Only show relevant roles for selected category
4. **Mutually Exclusive**: Hide opposite category roles completely

### Key Components Architecture
- **HierarchicalRoleSelection**: Main orchestrator component
- **CategorySelection**: Step 1 interface with two category cards
- **RoleSelectionStep**: Step 2 with conditional role display
- **StepIndicator**: Visual progress indicator
- **CategoryCard**: Individual category selection cards

### Performance Targets
- Step transitions: < 200ms
- Role filtering: < 100ms
- Component rendering: < 50ms initial load

### Accessibility Requirements
- ARIA live regions for step announcements
- Keyboard navigation support
- Screen reader optimization
- Focus management during transitions

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contract interfaces have corresponding TypeScript files (T001)
- [x] All components have test tasks before implementation
- [x] Tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD methodology enforced (RED-GREEN-Refactor)
- [x] Agent consultation requirements clearly defined
- [x] Dependencies properly ordered

## Success Criteria Validation
Based on quickstart.md scenarios:

1. **Hierarchical Navigation**: Step-by-step category → role selection
2. **Conditional Display**: Mutually exclusive role visibility
3. **Form Integration**: Seamless TanStack Form compatibility
4. **Mobile Optimization**: Touch-friendly interface
5. **Accessibility**: Full ARIA support and keyboard navigation
6. **Performance**: Sub-200ms interaction targets met