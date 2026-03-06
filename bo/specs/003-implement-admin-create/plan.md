# Implementation Plan: Admin Create User Page with Hierarchical Role Selection

**Branch**: `003-implement-admin-create` | **Date**: September 18, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-implement-admin-create/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✅
   → Feature spec loaded: Admin Create User Page
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✅
   → Detect Project Type: web application (Next.js frontend + backend)
   → Set Structure Decision: Next.js App Router with API routes
3. Evaluate Constitution Check section below ✅
   → Single project with component-based libraries approach
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md ✅
   → User requirement clarified: Default system roles, toggle to org roles
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✅
6. Re-evaluate Constitution Check section ✅
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md) ✅
8. STOP - Ready for /tasks command ✅
```

## Summary
Primary requirement: Create an admin interface for creating different types of users (system admin, organization owner, organization admin) with a hierarchical role selection component that defaults to showing system roles and allows switching to organization roles. The interface should provide clear visual distinction between role types and handle email validation, invitation sending, and permission-based access control.

Technical approach: Build reusable React components using shadcn/ui with TanStack Form integration, implementing a tabbed interface that defaults to system roles and dynamically shows role options based on category selection.

## Technical Context
**Language/Version**: TypeScript 5.x with Next.js 15  
**Primary Dependencies**: Next.js 15, React 18, TanStack Form, shadcn/ui, Better Auth, Prisma  
**Storage**: PostgreSQL via Prisma ORM  
**Testing**: Jest + React Testing Library for component tests, Playwright for E2E  
**Target Platform**: Web application (desktop + mobile responsive)  
**Project Type**: web - Next.js application with frontend + backend  
**Performance Goals**: <200ms form submission, <100ms role switching  
**Constraints**: Mobile responsive, WCAG accessibility compliance, role-based permissions  
**Scale/Scope**: Admin interface for up to 1000 organizations, role selection component reusable across app

**User Clarification**: "I want is default choose system roles then show system roles to choose. if choose org roles then show all org roles to choose" - This means a single interface with category tabs (System Roles/Organization Roles) defaulting to System Roles tab, with dynamic role list updates based on selected category.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js web app with integrated frontend/backend)
- Using framework directly? Yes (Next.js App Router, React components, TanStack Form)
- Single data model? Yes (user creation with role assignments, no unnecessary DTOs)
- Avoiding patterns? Yes (no Repository/UoW, direct Prisma usage)

**Architecture**:
- EVERY feature as library? Yes (reusable hierarchical role selection component)
- Libraries listed: 
  - `HierarchicalRoleSelection` - Role selection UI component with category tabs
  - `useHierarchicalForm` - Form state management hook
  - `createUserWithRole` - User creation service function
- CLI per library: N/A (React components, not CLI libraries)
- Library docs: Component documentation in JSDoc format

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (tests written first, must fail before implementation)
- Git commits show tests before implementation? Yes (TDD workflow required)
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual database, Better Auth, Resend email)
- Integration tests for: Role selection component, form submission, user creation flow
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (form validation errors, user creation events)
- Frontend logs → backend? Yes (form submission tracking)
- Error context sufficient? Yes (field-level validation, API error messages)

**Versioning**:
- Version number assigned? Yes (follows existing project versioning)
- BUILD increments on every change? Yes (automated in CI/CD)
- Breaking changes handled? Yes (component interface changes tracked)

## Project Structure

### Documentation (this feature)
```
specs/003-implement-admin-create/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Next.js Web Application Structure
src/
├── app/
│   ├── dashboard/admin/users/create/
│   │   └── page.tsx           # Main create user page
│   └── api/admin/users/
│       └── route.ts           # User creation API endpoint
├── components/
│   ├── forms/
│   │   ├── hierarchical-role-selection/
│   │   │   ├── index.ts       # Component exports
│   │   │   ├── hierarchical-role-selection.tsx
│   │   │   ├── category-tabs.tsx
│   │   │   └── role-list.tsx
│   │   └── create-user-form.tsx
│   └── ui/                    # shadcn/ui components
├── hooks/
│   └── use-hierarchical-form.ts
├── lib/
│   ├── services/
│   │   └── user-creation.ts
│   └── validators/
│       └── user-form.ts
└── types/
    └── user-roles.ts

tests/
├── components/
│   └── hierarchical-role-selection.test.tsx
├── integration/
│   └── user-creation-flow.test.ts
└── e2e/
    └── admin-create-user.spec.ts
```

**Structure Decision**: Next.js web application (Option 2) with App Router architecture for integrated frontend/backend

## Phase 0: Outline & Research ✅

**Research findings**:

1. **Hierarchical Role Selection Pattern**: 
   - Decision: Tabbed interface with category selection (System/Organization) and dynamic role list
   - Rationale: User requested "default system roles, switch to org roles" - tabs provide clear visual separation
   - Alternatives considered: Stepper wizard (rejected - too complex), dropdown (rejected - less discoverable)

2. **State Management**:
   - Decision: TanStack Form with custom hook for role selection logic
   - Rationale: Already used in project, handles validation well, integrates with shadcn/ui
   - Alternatives considered: React Hook Form (rejected - migration cost), plain useState (rejected - validation complexity)

3. **Role Data Structure**:
   - Decision: Flat role list with category property, filtered dynamically
   - Rationale: Simple, performant, matches existing role system
   - Alternatives considered: Nested object structure (rejected - harder to search/filter)

**Output**: research.md with all clarifications resolved ✅

## Phase 1: Design & Contracts ✅

**Data Model**: User creation with role assignment, organization context for org roles
**API Contracts**: POST /api/admin/users for user creation with role data
**Component Interface**: HierarchicalRoleSelection with category tabs and role selection
**Form Flow**: Basic info → Role selection (tabbed) → Organization selection (if needed) → Submit

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md ✅

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each component → component test task [P]
- User creation flow → integration test task
- API endpoint → contract test task [P]
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Types → Utils → Components → Forms → API → Integration
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations requiring justification*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*