# Implementation Plan: Hierarchical Role Selection Enhancement

**Branch**: `004-hierarchical-role-selection` | **Date**: September 17, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-hierarchical-role-selection/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded: Hierarchical role selection with step-by-step UX
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type: web application (Next.js frontend + API backend)
   → Set Structure Decision: Option 1 (Single project structure)
3. Evaluate Constitution Check section below
   → Enhancement to existing feature, maintains simplicity
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md ✅
   → All unknowns resolved through UX pattern research
5. Execute Phase 1 → contracts, data-model.md, quickstart.md ✅
6. Re-evaluate Constitution Check section
   → No new violations: Component enhancement follows existing patterns
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Enhance the existing role selection interface with a hierarchical, step-by-step user experience. Users first choose between "System Roles" or "Organization Roles" categories, then see only the relevant role options for their selection. This replaces the current side-by-side interface with progressive disclosure UX pattern for better usability and reduced cognitive load.

## Technical Context
**Language/Version**: TypeScript 5.0 with Next.js 15
**Primary Dependencies**: React 18, TanStack Form, shadcn/ui, Better Auth
**Storage**: PostgreSQL via Prisma ORM (no schema changes required)
**Testing**: Jest with React Testing Library
**Target Platform**: Web application (Chrome 90+, Firefox 88+, Safari 14+)
**Project Type**: web - Next.js frontend with API backend
**Performance Goals**: <200ms step transitions, <100ms role filtering
**Constraints**: Maintain backward compatibility with existing role system
**Scale/Scope**: Single form enhancement, affects 1 create user page

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (existing bo application, no new projects)
- Using framework directly? Yes (TanStack Form, React state management)
- Single data model? Yes (extending existing RoleType without new entities)
- Avoiding patterns? Yes (no Repository/UoW, direct component composition)

**Architecture**:
- EVERY feature as library? No - UI enhancement, not standalone library
- Libraries listed: N/A (component enhancement within existing structure)
- CLI per library: N/A (UI component, no CLI interface needed)
- Library docs: N/A (UI component documentation in quickstart.md)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (component tests fail first, then implement)
- Git commits show tests before implementation? Yes (test-driven development)
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual form state, real role data)
- Integration tests for: component interactions, step transitions, form integration
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (step transition logging, error tracking)
- Frontend logs → backend? N/A (pure frontend enhancement)
- Error context sufficient? Yes (step-specific error handling)

**Versioning**:
- Version number assigned? 1.0.0 (new component interface)
- BUILD increments on every change? Yes
- Breaking changes handled? No breaking changes (enhancement only)

## Project Structure

### Documentation (this feature)
```
specs/004-hierarchical-role-selection/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command) ✅
├── data-model.md        # Phase 1 output (/plan command) ✅
├── quickstart.md        # Phase 1 output (/plan command) ✅
├── contracts/           # Phase 1 output (/plan command) ✅
│   ├── hierarchical-role-selection.interface.ts
│   └── validation.contract.ts
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── components/
│   ├── forms/
│   │   ├── create-user-form.tsx          # UPDATE: Integrate hierarchical component
│   │   ├── hierarchical-role-selection.tsx  # NEW: Main hierarchical component
│   │   ├── category-selection.tsx           # NEW: Step 1 component
│   │   ├── role-selection-step.tsx          # NEW: Step 2 component
│   │   └── step-indicator.tsx               # NEW: Progress indicator
│   └── ui/
│       ├── category-card.tsx                # NEW: Category selection cards
│       └── step-transition.tsx              # NEW: Smooth step transitions
├── types/
│   └── hierarchical-roles.ts               # NEW: Type definitions
├── hooks/
│   └── use-hierarchical-selection.ts       # NEW: State management hook
└── lib/
    └── role-selection-utils.ts             # UPDATE: Add hierarchical utilities

tests/
├── components/
│   ├── hierarchical-role-selection.test.tsx  # NEW: Component tests
│   ├── category-selection.test.tsx            # NEW: Step tests
│   └── create-user-form.integration.test.tsx # UPDATE: Integration tests
└── hooks/
    └── use-hierarchical-selection.test.tsx    # NEW: Hook tests
```

**Structure Decision**: Option 1 (Single project) - UI enhancement within existing Next.js application

## Phase 0: Outline & Research ✅
**COMPLETED**: Research phase documented comprehensive UX patterns and technical approach:

1. **UX Pattern Research**: Multi-step wizard with category-first selection
2. **State Management**: Single state object with step tracking and validation
3. **Component Architecture**: Conditional rendering with shared layout components
4. **Accessibility**: ARIA live regions with clear step announcements
5. **Performance**: Lazy rendering with React.memo and useMemo optimization

**Output**: research.md with all technical decisions documented and justified

## Phase 1: Design & Contracts ✅
**COMPLETED**: Design phase created comprehensive component architecture:

1. **Data Model**: `data-model.md` with complete state structure and interfaces
2. **Component Contracts**: TypeScript interfaces for all components in `/contracts/`
3. **Validation Schema**: Zod validation with step-specific rules
4. **Quickstart Guide**: `quickstart.md` with comprehensive test scenarios
5. **Type Safety**: Complete interface definitions for hierarchical selection

**Output**: data-model.md, /contracts/*, quickstart.md with failing test scenarios defined

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base structure
- Generate tasks from Phase 1 design (contracts, data model, test scenarios)
- Each interface → type definition task [P]
- Each component → component creation task with tests
- Each validation rule → validation implementation task [P]
- Integration tasks for form updates and state management

**Ordering Strategy**:
- TDD order: Tests before implementation (RED phase first)
- Dependency order: Types → Hooks → Components → Integration
- Step components can be developed in parallel [P]
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 20-25 numbered, ordered tasks following TDD methodology

**Task Categories**:
1. **Foundation Tasks (T001-T005)**: Type definitions, validation schemas
2. **Component Tests (T006-T015)**: Failing tests for all new components  
3. **Implementation Tasks (T016-T020)**: Component implementations (GREEN phase)
4. **Integration Tasks (T021-T025)**: Form integration, state management updates

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following TDD principles)  
**Phase 5**: Validation (run tests, execute quickstart.md scenarios, performance validation)

## Complexity Tracking
*No constitutional violations - enhancement follows existing patterns*

| Aspect | Current Approach | Justification |
|--------|------------------|---------------|
| Component Count | 4 new components | Necessary for step separation and reusability |
| State Management | Single hook pattern | Follows existing TanStack Form integration pattern |
| Testing Strategy | Component + Integration | Matches existing test architecture |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

## Implementation Strategy

### Component Architecture
The hierarchical role selection will be implemented as a composition of focused components:

1. **HierarchicalRoleSelection**: Main orchestrator component
2. **CategorySelection**: Step 1 - Category choice interface
3. **RoleSelectionStep**: Step 2 - Role choice with conditional display
4. **StepIndicator**: Progress visualization component

### State Management
- Single custom hook (`use-hierarchical-selection`) for centralized state
- Integration with existing TanStack Form validation
- Step-based validation with cross-step consistency checks

### Testing Approach
- Component-level unit tests for each step
- Integration tests for step transitions and form integration
- E2E tests for complete user flows through quickstart scenarios
- Performance tests for step transition timing

### Migration Strategy
- Feature flag to enable hierarchical mode
- Backward compatibility with existing role selection
- Gradual rollout capability for A/B testing

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*