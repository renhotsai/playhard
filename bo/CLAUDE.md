# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Backoffice (BO)** application for PlayHard - a Next.js 15 admin panel for managing users, organizations, and business operations. This is part of a larger multi-project monorepo.

## Development Commands

**Core Commands:**
- `npm run dev` - Start development server with Turbopack on port 3000
- `npm run build` - Build application with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**Database Commands:**
- `npx prisma generate` - Generate Prisma client (output to src/generated/prisma)
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db push` - Push schema changes to database

**API Testing:**
- Visit `http://localhost:3000/api/auth/reference` - Better Auth OpenAPI documentation
- Use Swagger UI to test authentication endpoints interactively
- All Better Auth endpoints are automatically documented and testable

## Tech Stack & Architecture

**Core Technologies:**
- **Next.js 15** with App Router and Turbopack
- **Better Auth** with username, organization, and magic-link plugins (NO admin plugin)
- **Prisma ORM** with PostgreSQL (custom output to src/generated/prisma)
- **TanStack Suite** as project standard (https://tanstack.com/):
  - **TanStack React Query v5** for server state management
  - **TanStack React Form** for form state management and validation
  - **TanStack React Table** for data tables and datagrids
- **shadcn/ui** component library with Radix UI
- **Tailwind CSS** for styling
- **Resend** for email services

**Authentication System:**
- Better Auth with session-based authentication (see BETTER_AUTH_REFERENCE.md for detailed patterns)
- Magic Link authentication for user invitations
- Organization-level permission system (owner > admin > member)
- Username plugin for user identification
- Organization plugin with teams support
- OpenAPI plugin for API documentation and testing
- Framework-agnostic TypeScript authentication library

**Role Management Enhancement (September 2025):**
- **Two-Section Role Selection**: System Roles vs Organization Roles UI grouping
- **Component Library**: `RoleSelectionSections` and `RoleSectionGroup` components
- **Role Categories**: 
  - System Roles: System Administrator (global access)
  - Organization Roles: Owner, Admin, Game Master, Game Staff, Game Player
- **Implementation**: Uses shadcn/ui RadioGroup with section-based organization
- **Accessibility**: Full ARIA support with role="group" and proper labeling
- **Form Integration**: Maintains existing TanStack Form patterns with enhanced UX

## Database Schema Architecture

**Core Better Auth Tables:**
- `user` - User accounts with basic info (no role field)
- `session` - User sessions with organization context
- `account` - OAuth accounts and passwords
- `verification` - Email verification and magic links

**Organization Management:**
- `organization` - Companies/merchants with slug and metadata
- `member` - User-organization relationships with roles
- `invitation` - Pending organization invitations
- `team` - Teams within organizations
- `teamMember` - User-team relationships

**Role System:**
- **Organization Roles:** 'owner', 'admin', 'member' (stored in member.role)
- Organization-scoped permissions with invitation-based access

## Permission System Architecture

**Current Permission System:**
The system uses Better Auth's organization plugin with a simplified role-based approach:

1. **Role Definitions (`src/lib/permissions.ts`):**
   - 3-tier hierarchy: Owner > Admin > Member
   - Simple organization role checking functions
   - Organization-scoped permission management
   - Invitation-based user access

2. **Authentication Flow:**
   - Organization-level roles stored in `member.role` field  
   - Session-based authentication with organization context
   - Magic link authentication for invitations
   - No system-wide admin roles

## Key Architecture Components

**Authentication & Authorization:**
- `src/lib/auth.ts` - Better Auth server configuration with plugins
- `src/lib/auth-client.ts` - Client-side auth methods and hooks
- `src/middleware.ts` - Next.js middleware for session-based route protection
- `src/lib/permissions.ts` - Role hierarchy definitions and utility functions

**UI Components:**
- `src/components/app-sidebar.tsx` - Navigation sidebar with role-based menu items
- `src/app/dashboard/layout.tsx` - Dashboard layout with sidebar integration
- `src/components/ui/` - shadcn/ui components for consistent styling
- `src/components/forms/` - Form components using TanStack Form

**API Architecture:**
- `/api/auth/[...all]/route.ts` - Better Auth API handler
- Organization-scoped endpoints with automatic role validation
- Custom pagination and error handling patterns
- Invitation-based user management

## API Architecture

**Better Auth Routes:**
- `/api/auth/[...all]` - Better Auth handler
- `/api/auth/magic-link/verify` - Magic link verification with invitation support

**Business Logic APIs:**
- `/api/organizations` - Organization CRUD operations
- `/api/organizations/[id]/invite` - User invitation to organizations
- `/api/create-admin` - Initial organization admin creation

**API Development Patterns:**
- Check authentication status using Better Auth session validation
- Organization-scoped data access based on member.role
- Organization membership validation before data access
- Consistent error handling with appropriate HTTP status codes
- Transform API responses to match frontend expectations

## Environment Configuration

**Required Environment Variables:**
```env
DATABASE_URL="postgres://postgres:password@localhost:5432/playhard"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000/api/auth"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY="your-resend-api-key"
```

**Better Auth Configuration:**
- Session-based authentication with PostgreSQL adapter
- Enhanced organization plugin with role-based permissions and teams support
- Magic link expiration: 15 minutes with custom invitation email handling
- Username, organization, and magic link plugins enabled
- Invitation-based organization access
- New user callback: `/set-username`
- Default callback: `/dashboard`

## User Management Flow

**Organization Admin Creation:**
1. Use `/api/create-admin` to create initial organization admin
2. Creates user account and organization via Better Auth APIs
3. Magic link sent via Resend email service for setup
4. User clicks link → auto-login → set username if needed → dashboard

**Invitation Flow:**
1. Organization admin creates user account via Better Auth 
2. Organization admin sends invitation via Better Auth `organization.inviteMember()`
3. User receives email with invitation link
4. User clicks link → `/accept-invitation/[invitationId]` → login if needed
5. After login → auto-accepts invitation → checks username
6. If no username: redirect to `/set-username`, else redirect to `/dashboard`

**Permission Hierarchy:**
- **Organization Owner**: Full access to their organization, teams, and members
- **Organization Admin**: Manage teams and members within their organization
- **Organization Member**: Basic access within their organization

## Development Patterns

**Implementation Process Requirements:**
**MANDATORY**: Before implementing any feature or fixing any issue, MUST follow this process:

1. **Categorize the Problem First**: Identify which domain the implementation belongs to:
   - Authentication/Authorization → Better Auth domain
   - UI Components/Styling → shadcn/ui domain  
   - Data Management/State → TanStack domain
   - Project Structure/Routing → Next.js domain
   - Database Operations → Prisma domain

2. **Consult Appropriate Agent**: Based on categorization, ALWAYS consult the relevant specialized agent first:
   - **Better Auth**: `better-auth-validator` agent for ALL authentication-related implementations
   - **shadcn/ui**: `shadcn-ui-designer` agent for ALL UI component implementations
   - **TanStack**: `tanstack-expert` agent for query, table, and form implementations
     - React Query (server state management)
     - React Table (data tables and datagrids) 
     - React Form (form state management and validation)
   - **Next.js**: `nextjs-compliance-checker` agent for project structure, routing, and Next.js best practices
   - **Prisma**: Use built-in Prisma knowledge for database schema and query patterns

3. **Get Agent Guidance**: Allow the specialized agent to provide proper implementation patterns and best practices before proceeding

4. **Implement with Agent Recommendations**: Follow the agent's guidance exactly to ensure compliance with framework standards

## Type System Guidelines

**CRITICAL: Prisma Types First Principle**
When creating interfaces, types, or data structures, ALWAYS follow this hierarchy:

1. **Check Prisma Schema First**: Before creating any interface, examine `prisma/schema.prisma` to see if the data structure already exists
2. **Use Prisma Generated Types**: If the type exists in Prisma schema, import and use types from `@/generated/prisma`:
   ```typescript
   import type { User, Member, Organization } from '@/generated/prisma';
   ```
3. **Extend with Prisma Payload Types**: For complex queries with relations, use `Prisma.ModelGetPayload<>`:
   ```typescript
   type UserWithOrganizations = Prisma.UserGetPayload<{
     include: { members: { include: { organization: true } } }
   }>;
   ```
4. **Only Create Custom Types When Necessary**: Only create new interfaces when Prisma types don't cover the use case:
   - Form data structures that differ from database models
   - API response wrappers
   - UI-specific data transformations

**Benefits of Prisma Types First:**
- **Zero Duplication**: Single source of truth for data structures
- **Automatic Updates**: Schema changes automatically update all types
- **Type Safety**: Complete TypeScript coverage from database to UI
- **IDE Support**: Full autocomplete and error checking
- **Consistency**: Ensures all code uses the same data structures

**Why This Process is Critical:**
- Prevents architectural coupling issues (like custom interfaces instead of framework-native types)
- Ensures framework compliance and best practices
- Reduces debugging time and technical debt
- Maintains consistency across the codebase
- Leverages specialized knowledge for each domain

**Better Auth Development Guidelines:**
- **MANDATORY CONSULTATION**: For ALL authentication-related implementations, MUST consult the `better-auth-validator` agent first
- **API Priority Rule**: Use Better Auth server APIs (`auth.api.*`) and client APIs (`authClient.*`) instead of custom implementations
- **Organization-First Approach**: All data access is organization-scoped via Better Auth organization plugin
- **Invitation System**: Use Better Auth's built-in invitation system for user management
- **Framework Compliance**: Any auth-related code must follow Better Auth documentation patterns exactly
- **NO Custom Auth Logic**: Avoid custom authentication implementations that bypass Better Auth APIs

**Authentication & Session Patterns:**
- Use `useSession()` hook from `@/lib/auth-client` for client-side auth state
- Check organization roles with `hasOrganizationAdminAccess()` utility functions  
- Session management with Better Auth built-in session handling
- Organization-scoped UI rendering in components like `AppSidebar`

**Database Patterns:**
- Prisma client imported from `@/generated/prisma` (custom output location)
- Use Better Auth's organization APIs for all organization data access
- Organization-scoped data queries based on user membership
- Always validate organization membership before database operations

**TanStack Query Patterns (Project Standard):**
- Use custom hooks in `src/hooks/` for API calls (see TANSTACK_QUERY_REFERENCE.md)
- Follow query key naming convention: `entityKeys.all()`, `entityKeys.detail(id)`
- Implement optimistic updates for better UX
- Use QueryClient for cache management and invalidation
- Always handle loading, error, and success states
- Configure stale time (5min) and cache time (10min) appropriately
- Use React Query DevTools in development

**TanStack Form Patterns (Project Standard):**
- Use TanStack Form for all form implementations (see TANSTACK_FORM_REFERENCE.md)
- Implement schema validation with Zod for type safety
- Handle async validation with debouncing
- Use field-level granular reactivity
- Integrate with TanStack Query for data mutations

**TanStack Table Patterns (Project Standard):**
- Use TanStack Table for all data tables (see TANSTACK_TABLE_REFERENCE.md)
- Implement headless UI with full control over styling
- Support sorting, filtering, pagination, and row selection
- Integrate with TanStack Query for server-side data
- Use shadcn/ui components for consistent table styling

**Email Integration:**
- Resend service for transactional emails
- HTML templates in `src/templates/emails/`
- Magic link email for user invitations

## File Structure

```
src/
   app/                    # Next.js App Router
      api/               # API routes
      dashboard/         # Protected admin pages
      login/             # Authentication pages
      set-username/      # User onboarding
   components/            # React components
      ui/               # shadcn/ui components
      forms/            # Form components
      auth-*.tsx        # Authentication components
   lib/                   # Utilities and services
      auth.ts           # Better Auth server config
      auth-client.ts    # Better Auth client
      permissions.ts    # Permission service
      email.ts          # Email service
   generated/prisma/      # Generated Prisma client
   templates/emails/      # Email templates
```

## Security Considerations

**Multi-Tenant Security:**
- Organization-scoped data access based on user membership
- Hierarchical permission system: Organization Owner > Admin > Member
- API routes validate organization membership and user roles
- Session-based authentication prevents unauthorized access

**Authentication Security:**
- Better Auth session management with secure cookies
- Magic links expire in 15 minutes for security
- CSRF protection and session validation built into Better Auth
- Organization-based role access control

**API Security:**  
- Session validation on all protected routes
- Organization membership validation before data access
- Input validation and error handling with proper HTTP status codes
- Role-based data filtering within organization scope

## 🚧 Current Development: Organization-Based Permission System

**IMPORTANT: The system has been cleaned up to use pure Better Auth organization plugin.**

**Current Status:** System cleaned up and simplified to organization-only access control.

**Architecture Context:** Uses Better Auth organization plugin exclusively for all permissions and access control.

### Current Permission System Overview
- **Organization-Only**: All access is organization-scoped via Better Auth organization plugin
- **Invitation-Based**: New users join organizations via Better Auth invitation system
- **Clean Architecture**: No system admin concept, all permissions within organizations
- **Initial Setup**: `/api/create-admin` creates first organization admin to bootstrap system

### Key Features
1. **Better Auth Compliance**: 100% compliant with Better Auth organization plugin standards
2. **Invitation System**: Uses Better Auth's built-in invitation email and acceptance flow
3. **Role Hierarchy**: Organization Owner > Admin > Member within each organization
4. **Clean Codebase**: Removed all non-Better Auth compliant code and routes

### System Bootstrap Flow
- **Initial Setup**: Use `/api/create-admin` to create first organization and admin user  
- **Magic Link Setup**: Admin receives magic link email for account activation
- **Organization Growth**: Admin can invite additional users via Better Auth invitation system
- **Self-Contained**: Each organization is completely independent with its own admin structure

**✅ Clean State:** All system admin routes, custom permission code, and non-compliant implementations removed.

## Reference Documentation

**TanStack Suite (Project Standards):**
- See `TANSTACK_QUERY_REFERENCE.md` for server state management patterns
- See `TANSTACK_FORM_REFERENCE.md` for form state management and validation
- See `TANSTACK_TABLE_REFERENCE.md` for data table implementations
- All based on latest TanStack best practices from https://tanstack.com/

**Better Auth Patterns:**
- See `BETTER_AUTH_REFERENCE.md` for comprehensive Better Auth usage patterns
- Includes plugin configurations, client setup, and security best practices
- Based on official Better Auth LLMs.txt documentation