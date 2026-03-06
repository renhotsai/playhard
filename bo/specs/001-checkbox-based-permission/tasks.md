# Tasks: Checkbox-Based Permission Management System

**Input**: Design documents from `/specs/001-checkbox-based-permission/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: Next.js 15, Better Auth (org plugin), Prisma, TanStack Suite
   → Structure: Fresh web app with existing route compatibility
2. Load optional design documents ✓:
   → data-model.md: 5 entities (Organization, Member, User, Permission, OrganizationPermissionLimit)
   → contracts/: 1 file with 8 API endpoints
   → research.md: Fresh implementation approach decisions
3. Generate tasks by category ✓:
   → Setup: Better Auth config, Prisma schema, dependencies
   → Tests: Contract tests (8), integration tests (5), component tests
   → Core: Permission library, UI components, API endpoints
   → Integration: DB migrations, middleware, logging
   → Polish: E2E tests, performance validation, documentation
4. Apply task rules ✓:
   → 23 [P] parallel tasks, 7 sequential tasks
   → TDD enforced: All tests before implementation
5. Number tasks sequentially (T001-T030) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓:
   → All 8 API endpoints have contract tests ✓
   → All 5 entities have model/schema tasks ✓
   → All endpoints implemented ✓
9. Return: SUCCESS (30 tasks ready for execution) ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Fresh Next.js structure**: `src/app/`, `src/lib/`, `src/components/`, `tests/`
- Based on plan.md structure decision: Fresh web application

## Phase 3.1: Setup & Foundation
- [ ] T001 Remove existing auth.ts admin plugin and custom permission schemas per research.md
- [ ] T002 [P] Configure fresh Better Auth with organization plugin only in src/lib/auth.ts
- [ ] T003 [P] Create fresh Prisma schema with Better Auth + Permission tables in prisma/schema.prisma
- [ ] T004 [P] Install dependencies: Better Auth organization plugin, TanStack Suite, shadcn/ui
- [ ] T005 [P] Configure TypeScript strict mode and ESLint for fresh implementation

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [P] - Better Auth APIs
- [ ] T006 [P] Contract test GET /api/auth/organization in tests/contracts/better-auth-organization-list.test.ts
- [ ] T007 [P] Contract test GET /api/auth/organization/{organizationId}/members in tests/contracts/better-auth-members.test.ts
- [ ] T008 [P] Contract test POST /api/auth/organization/{organizationId}/invite in tests/contracts/better-auth-invite.test.ts
- [ ] T009 [P] Contract test PATCH /api/auth/organization/{organizationId}/members/{userId} in tests/contracts/better-auth-member-role.test.ts

### Contract Tests [P] - Fresh Permission APIs
- [ ] T010 [P] Contract test GET /api/permissions/matrix/{subjectType}/{subjectId} in tests/contracts/permission-matrix.test.ts
- [ ] T011 [P] Contract test PATCH /api/permissions/matrix/{subjectType}/{subjectId} in tests/contracts/permission-update.test.ts
- [ ] T012 [P] Contract test POST /api/permissions/check in tests/contracts/permission-check.test.ts
- [ ] T013 [P] Contract test GET/PUT /api/admin/organizations/{organizationId}/permission-limits in tests/contracts/admin-limits.test.ts

### Integration Tests [P] - User Scenarios from Quickstart
- [ ] T014 [P] Integration test System Admin sets organization limits in tests/integration/admin-org-limits.test.ts
- [ ] T015 [P] Integration test Organization Owner manages member permissions in tests/integration/owner-permissions.test.ts
- [ ] T016 [P] Integration test Permission inheritance (user + role + team) in tests/integration/permission-inheritance.test.ts
- [ ] T017 [P] Integration test Checkbox matrix UI interactions in tests/integration/checkbox-matrix.test.ts
- [ ] T018 [P] Integration test Route compatibility with existing 26 routes in tests/integration/route-compatibility.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Fresh Permission Core Library
- [ ] T019 [P] Permission types and enums in src/lib/permissions/types.ts
- [ ] T020 [P] Permission validation logic in src/lib/permissions/validation.ts  
- [ ] T021 [P] Permission inheritance rules in src/lib/permissions/inheritance.ts
- [ ] T022 [P] Permission audit trail in src/lib/permissions/audit.ts
- [ ] T023 Main permission library exports in src/lib/permissions/index.ts

### Database Models & Migrations
- [ ] T024 Run Prisma migrations for fresh Better Auth + Permission schema
- [ ] T025 Generate fresh Prisma client to src/generated/prisma

### Fresh UI Component Library
- [ ] T026 [P] PermissionMatrix checkbox component in src/components/permissions/permission-matrix.tsx
- [ ] T027 [P] PermissionSummary display component in src/components/permissions/permission-summary.tsx
- [ ] T028 [P] OrganizationLimits admin interface in src/components/permissions/organization-limits.tsx
- [ ] T029 [P] PermissionAudit trail component in src/components/permissions/permission-audit.tsx

## Phase 3.4: Fresh API Implementation
- [ ] T030 GET /api/permissions/matrix/{subjectType}/{subjectId} endpoint in src/app/api/permissions/matrix/[subjectType]/[subjectId]/route.ts
- [ ] T031 PATCH /api/permissions/matrix/{subjectType}/{subjectId} endpoint (same file as T030)
- [ ] T032 [P] POST /api/permissions/check endpoint in src/app/api/permissions/check/route.ts
- [ ] T033 [P] GET /api/admin/organizations/{organizationId}/permission-limits in src/app/api/admin/organizations/[organizationId]/permission-limits/route.ts
- [ ] T034 PUT /api/admin/organizations/{organizationId}/permission-limits (same file as T033)
- [ ] T035 [P] GET /api/permissions/routes compatibility check in src/app/api/permissions/routes/route.ts

## Phase 3.5: Fresh UI Pages
- [ ] T036 [P] Permission overview page in src/app/dashboard/permissions/page.tsx
- [ ] T037 [P] User permission management page in src/app/dashboard/permissions/users/page.tsx
- [ ] T038 [P] Team permission management page in src/app/dashboard/permissions/teams/page.tsx
- [ ] T039 [P] Organization limits page (admin) in src/app/dashboard/permissions/limits/page.tsx

## Phase 3.6: Integration & Middleware
- [ ] T040 Fresh auth middleware for permission checking in src/middleware.ts
- [ ] T041 Update dashboard layout to include permission navigation in src/app/dashboard/layout.tsx
- [ ] T042 Fresh permission context provider in src/lib/permissions/context.tsx

## Phase 3.7: Polish & Validation
- [ ] T043 [P] Unit tests for permission validation logic in tests/unit/permission-validation.test.ts
- [ ] T044 [P] Unit tests for checkbox matrix component in tests/unit/permission-matrix.test.ts
- [ ] T045 [P] Performance tests (<100ms permission checks) in tests/performance/permission-speed.test.ts
- [ ] T046 [P] E2E tests for complete user workflows in tests/e2e/permission-workflows.spec.ts
- [ ] T047 Execute quickstart.md validation scenarios
- [ ] T048 Verify existing route compatibility (all 26 routes functional)
- [ ] T049 [P] Update project documentation for fresh permission system

## Dependencies

### Critical TDD Dependencies
- **Tests (T006-T018) MUST complete and FAIL before implementation (T019-T049)**
- **T001-T005 (setup) blocks everything else**
- **T024-T025 (migrations) blocks T030-T042 (API/UI)**

### File-Level Dependencies (Same File = Sequential)
- **T030 → T031** (same API route file)
- **T033 → T034** (same admin API file)
- **T019-T022 → T023** (permission library components → index)

### Logical Dependencies
- **T026-T029 (UI components) before T036-T039 (pages)**
- **T019-T023 (core library) before T030-T035 (APIs)**
- **T040-T042 (integration) before T043-T049 (polish)**

## Parallel Execution Examples

### Tests Phase (Run After Setup Complete)
```bash
# Launch all contract tests simultaneously:
Task: "Contract test GET /api/auth/organization in tests/contracts/better-auth-organization-list.test.ts"
Task: "Contract test GET /api/permissions/matrix/{subjectType}/{subjectId} in tests/contracts/permission-matrix.test.ts"
Task: "Contract test POST /api/permissions/check in tests/contracts/permission-check.test.ts"
Task: "Integration test System Admin sets organization limits in tests/integration/admin-org-limits.test.ts"
Task: "Integration test Permission inheritance logic in tests/integration/permission-inheritance.test.ts"
```

### Core Library Phase (Run After Tests Failing)
```bash
# Launch core library development:
Task: "Permission types and enums in src/lib/permissions/types.ts"
Task: "Permission validation logic in src/lib/permissions/validation.ts"
Task: "Permission inheritance rules in src/lib/permissions/inheritance.ts"
Task: "Permission audit trail in src/lib/permissions/audit.ts"
```

### UI Components Phase
```bash
# Launch UI component development:
Task: "PermissionMatrix checkbox component in src/components/permissions/permission-matrix.tsx"
Task: "PermissionSummary display component in src/components/permissions/permission-summary.tsx"
Task: "OrganizationLimits admin interface in src/components/permissions/organization-limits.tsx"
Task: "PermissionAudit trail component in src/components/permissions/permission-audit.tsx"
```

## Constitutional Compliance

### Simplicity Enforcement
- [x] Single project structure (no backend/frontend split)
- [x] Direct framework usage (Better Auth, Next.js, Prisma)
- [x] No wrapper classes or unnecessary abstractions
- [x] Minimal custom schema (2 tables only)

### TDD Enforcement
- [x] All tests (T006-T018) before any implementation
- [x] Contract tests for every API endpoint
- [x] Integration tests for every user scenario
- [x] Tests MUST fail before implementation begins

### Library Architecture
- [x] Permission system as independent library (src/lib/permissions/)
- [x] UI components as separate library (src/components/permissions/)
- [x] Each library independently testable

## Validation Checklist
*GATE: Checked before task execution*

- [x] All 8 API contracts have corresponding tests (T006-T013)
- [x] All 5 entities have schema/model tasks (T003, T019, T024)
- [x] All tests come before implementation (T006-T018 → T019+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Fresh implementation approach maintained throughout
- [x] Existing route compatibility preserved

## Notes
- **Fresh Start**: Treat as blank project, avoid legacy complexity
- **Route Compatibility**: New `/dashboard/permissions/*` routes, preserve existing 26 routes
- **Better Auth Focus**: Organization plugin only, remove admin plugin
- **TDD Mandatory**: RED phase required before GREEN phase
- **Constitutional**: Simplicity, library architecture, observability maintained