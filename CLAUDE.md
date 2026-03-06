# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **multi-project monorepo** for "PlayHard" - a script-based gaming platform. It contains three main applications:

1. **`/web`** - Customer-facing website (Supabase + Next.js)
2. **`/bo`** - Backoffice admin panel (Prisma + Next.js) 
3. **Root level** - Docker infrastructure and deployment

## Development Commands

**Web Application (`/web`):**
- `cd web && npm run dev` - Start customer site on port 3000
- `cd web && npm run build` - Build customer site
- `cd web && npm run lint` - Run ESLint

**Backoffice Application (`/bo`):**  
- `cd bo && npm run dev` - Start admin panel on port 3000
- `cd bo && npm run build` - Build admin panel with Turbopack
- `cd bo && npm run lint` - Run ESLint

**Infrastructure:**
- `docker-compose up -d postgres redis pgadmin` - Start core services
- `docker-compose --profile development up` - Start full development stack
- `docker-compose down` - Stop all services

## Architecture Overview

### Web Application (`/web`)
- **Tech Stack**: Next.js 15 + Supabase + TanStack Query + TypeScript
- **Purpose**: Customer website for browsing scripts and making bookings
- **Database**: Supabase PostgreSQL with RLS policies
- **Auth**: Supabase Auth with social login support
- **Key Features**: Script browsing, booking system, user profiles

### Backoffice Application (`/bo`)
- **Tech Stack**: Next.js 15 + Prisma + Better Auth + TypeScript  
- **Purpose**: Admin panel for managing scripts, bookings, and users
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Better Auth with username plugin
- **Key Features**: Content management, user administration, analytics

### Infrastructure
- **PostgreSQL**: Shared database (separate schemas: `playhard_main`, `playhard_backoffice`)
- **Redis**: Caching and session storage
- **pgAdmin**: Database management UI on port 5050
- **Docker**: Development environment orchestration

## Database Architecture

**Dual Database Strategy:**
- Web app connects to Supabase (cloud or self-hosted)
- Backoffice connects to local PostgreSQL via Prisma
- Both can share the same PostgreSQL instance with different schemas

**Key Tables:**
- `scripts` - Game script metadata and content
- `bookings` - Customer reservations and time slots
- `users` - Customer accounts (web) and admin accounts (backoffice)
- `time_slots` - Available booking periods

## Project Structure

```
/
├── web/                    # Customer website
│   ├── src/app/           # Next.js App Router
│   ├── src/components/    # UI components + shadcn/ui
│   ├── src/lib/          # Supabase client, utilities
│   └── supabase/         # Database migrations
├── bo/                    # Admin backoffice  
│   ├── src/app/          # Next.js App Router
│   ├── src/components/   # Admin UI components
│   ├── src/lib/          # Prisma client, Better Auth
│   └── prisma/           # Database schema
├── docker-compose.yml     # Development infrastructure
└── docker/               # Init scripts and configs
```

## Key Dependencies

**Web App:**
- `@supabase/supabase-js` - Database and auth client
- `@tanstack/react-query` - Server state management
- Next.js 15 with Turbopack
- shadcn/ui components

**Backoffice:**
- `@prisma/client` - Database ORM
- `better-auth` - Authentication system
- `@tanstack/react-table` - Data tables
- `recharts` - Analytics charts

## Development Workflow

1. **Start Infrastructure**: `docker-compose up -d postgres redis pgadmin`
2. **Choose Application**:
   - Customer site: `cd web && npm run dev`
   - Admin panel: `cd bo && npm run dev`
3. **Database Management**:
   - Web: Use Supabase CLI or dashboard
   - Backoffice: Use Prisma CLI or pgAdmin
4. **Both apps share**: PostgreSQL (different schemas), Redis, pgAdmin

## Environment Configuration

**Web App** requires Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Backoffice** requires database and auth:
- `DATABASE_URL` - Postgres connection
- `BETTER_AUTH_SECRET` - Authentication secret
- `REDIS_URL` - Redis connection

**Docker** provides default development values in `docker-compose.yml`

## Navigation Between Apps

- **Web**: Customer-facing features (booking, browsing, profiles)
- **Backoffice**: Admin features (content management, user admin, analytics)
- **Both apps** can run simultaneously on different ports
- **Shared database** enables data consistency across applications