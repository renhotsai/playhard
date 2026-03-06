# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the official website for "玩硬劇本館" (Play Hard Script Hall), a professional script-based gaming venue. The site provides information about available scripts, booking functionality, and venue details.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production app with Turbopack  
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

Next.js 15 application using App Router with TypeScript:

- **App Structure**: `/src/app/` directory with App Router
- **Components**: `/src/components/` with UI components in `/src/components/ui/`
- **Utilities**: Helper functions in `/src/lib/`
- **Styling**: TailwindCSS v4 with custom CSS variables
- **Path Aliases**: `@/` maps to `./src/`

## Page Structure

- **Home** (`/`): Hero section, monthly recommendations carousel, features, CTA
- **Games** (`/games`): 20 mock scripts with filtering and categorization
- **Booking** (`/booking`): Reservation form with script selection and time slots
- **About** (`/about`): Company story, team info, facilities, business hours
- **Contact** (`/contact`): Contact form, location, FAQ, social media links

## Key Components

### MonthlyRecommendations
- Smart component that switches between grid (< 4 items) and carousel (≥ 4 items)
- Uses Embla Carousel with auto-scroll functionality
- Hover to pause auto-scroll, cards have scale hover effects
- Requires careful overflow management for proper hover scaling

### Navigation
- Sticky header with custom orange theme (`bg-nav-primary`)
- Responsive design with theme toggle integration
- Uses custom color variables for consistency

### Theme System
- Custom orange color scheme with white backgrounds
- Navigation uses dedicated color variables (`--nav-primary`, `--nav-primary-foreground`)
- Dark/light mode support via next-themes
- CSS variables defined in `globals.css`

## Key Dependencies

- **Next.js 15**: Framework with Turbopack
- **TypeScript**: Strict mode enabled
- **TailwindCSS v4**: Utility-first CSS with CSS variables
- **shadcn/ui**: "new-york" style components
- **@tanstack/react-query**: Powerful async state management and data fetching
- **Embla Carousel**: Auto-scrolling carousel with hover controls
- **next-themes**: Theme management
- **Lucide React**: Icon library

## Data Management with React Query

The project uses **@tanstack/react-query** for efficient data fetching and state management:

### Query Hooks (`/src/hooks/use-scripts.ts`)
- **`useScripts()`**: Fetches all scripts with caching
- **`useScript(id)`**: Fetches individual script by ID
- **`useMonthlyRecommended()`**: Fetches monthly recommended scripts
- **`useScriptsSearch(filters)`**: Searches scripts with category/difficulty/player filters

### API Layer (`/src/lib/api.ts`)
- Simulates realistic API calls with network delays
- Centralized data fetching functions
- Consistent error handling and response formatting

### Query Configuration
- **5 minute stale time**: Data stays fresh for 5 minutes
- **10 minute garbage collection**: Unused data cleaned up after 10 minutes
- **1 retry attempt**: Failed requests retry once
- **Smart refetching**: Only refetch on window focus in production

## Additional TanStack Packages

Consider these TanStack packages for enhanced functionality:

- **@tanstack/react-form**: Type-safe, performant form management
  - `npm install @tanstack/react-form`
  - Headless form library with excellent TypeScript support

- **@tanstack/react-table**: Headless table/datagrid solution
  - `npm install @tanstack/react-table`
  - Full control over table markup and styling

- **@tanstack/react-virtual**: Virtualization for large lists
  - `npm install @tanstack/react-virtual`
  - Performance optimization for rendering large datasets

- **@tanstack/react-router**: Type-safe routing (alternative to Next.js router)
  - `npm install @tanstack/react-router`
  - Consider for complex routing needs with type safety

## Design Patterns

### Color System
- Navigation uses custom orange theme variables for consistency
- Main content areas use white backgrounds with original shadcn/ui colors
- CSS variables in `globals.css` define the custom orange navigation theme
- Always use existing color variables rather than custom colors

### Spacing Strategy
- Section spacing uses `py-12` to `py-16` for consistent vertical rhythm
- Component-level spacing managed carefully to accommodate hover effects
- Navigation has `h-16` and `px-6` for comfortable touch targets

### Carousel Implementation
- MonthlyRecommendations switches behavior based on item count
- Auto-scroll with hover pause for better UX
- Overflow management critical for proper hover scaling effects
- Uses `overflow: visible` for containers to prevent clipping

## Development Notes

- Keep spacing consistent across sections using established patterns
- When adding hover effects, ensure adequate container spacing
- Use semantic color variables rather than hardcoded values
- Test carousel behavior with different item counts (< 4 vs ≥ 4)
- Navigation and theme toggle should maintain orange color consistency
## Development Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production application

## Project Overview

This is **web**, a murder mystery script showcase website for browsing and exploring Chinese murder mystery party game scripts (劇本殺). The application displays script collections with detailed information including characters, storylines, game rules, and social features.

## Project Architecture

Built with **TanStack React Router** and **TanStack Start** for full-stack capabilities, using **React 19** and **TypeScript** with **Vite** as the build tool.

### Key Technologies
- **TanStack React Router**: File-based routing with type-safe navigation
- **TanStack Start**: Full-stack React framework with server functions
- **React 19**: Latest React version with modern features
- **TypeScript**: Strict typing with comprehensive compiler options
- **Vite**: Development server and build tool
- **shadcn/ui**: Modern component library built on Radix UI and Tailwind CSS
- **Tailwind CSS**: Utility-first CSS framework with custom mystery theme
- **Lucide React**: Modern icon library for UI components
- **Embla Carousel**: Touch-friendly carousel component for shadcn/ui
- **Radix UI**: Headless UI components for accessible interfaces (Dropdown Menu, Separator, etc.)

### Project Structure

```
src/
├── routes/                 # File-based routing
│   ├── __root.tsx         # Root layout component with SEO optimization
│   ├── index.tsx          # Home page with script showcases
│   ├── about/index.tsx    # About page
│   ├── contact/index.tsx  # Contact page
│   ├── categories/        # Category system
│   │   ├── index.tsx      # Categories overview page
│   │   └── $category.tsx  # Dynamic category pages
│   └── script/
│       └── $id.tsx        # Dynamic script detail pages
├── components/            # UI Components
│   ├── ui/                # shadcn/ui components
│   │   ├── badge.tsx      # Badge component
│   │   ├── button.tsx     # Button component
│   │   ├── card.tsx       # Card component
│   │   ├── carousel.tsx   # Carousel component
│   │   ├── dropdown-menu.tsx # Dropdown menu component
│   │   └── separator.tsx  # Separator component
│   ├── Header.tsx         # Header with navigation and dropdown menu
│   ├── Footer.tsx         # Footer component
│   ├── ScriptCard.tsx     # Reusable script card component
│   ├── MonthlyScripts.tsx # Monthly scripts carousel with navigation
│   └── HotRecommendations.tsx # Hot/popular scripts with shadcn/ui Carousel
├── data/                  # Data layer
│   ├── mockScripts.ts     # Mock murder mystery script data
│   └── category.ts        # Category definitions and data
├── types/                 # TypeScript type definitions
│   └── script.ts          # Core domain types (Script, Character, etc.)
├── lib/                   # Utility functions
│   ├── utils.ts           # shadcn/ui utility functions (cn helper)
│   └── category.ts        # Category helper functions and logic
├── router.tsx             # Router configuration
├── routeTree.gen.ts       # Auto-generated route tree (DO NOT EDIT - ignored by git)
├── globals.css            # Global styles with shadcn/ui and mystery theme
└── vite-env.d.ts          # Vite environment type definitions
```

### Domain Model

The application centers around **murder mystery scripts** with rich data modeling:

**Core Entities:**
- `Script`: Complete script with metadata, characters, rules, and story
- `Character`: Individual character roles with backgrounds, secrets, and goals
- `ScriptCard`: Simplified script view for browsing interfaces
- `Category`: Script categories with localized names, descriptions, and styling

**Key Script Properties:**
- Player count range (`playerCount.min`/`playerCount.max`)
- Duration in minutes, difficulty level, and category
- Rating system with favorites and play counts
- Detailed character information and relationships
- Game rules, requirements, and gameplay tips
- Chinese language content throughout

### Routing System

File-based routing with TanStack Router:
- `/` - Home page with monthly scripts and hot recommendations
- `/script/$id` - Dynamic script detail pages with comprehensive information
- `/categories/` - Categories overview page with all script categories
- `/categories/$category` - Dynamic category pages showing scripts by category
- `/about/` and `/contact/` - Basic informational pages
- Route tree automatically generated in `routeTree.gen.ts` (ignored by git)
- Error handling for missing scripts with custom error components

### Data Architecture

- Mock data in `src/data/mockScripts.ts` with 8 sample scripts
- Category system in `src/data/category.ts` with 6 predefined categories
- Helper functions: `getMonthlyScripts()`, `getHotScripts()`, `getScriptById()`
- Category functions: `getScriptsByCategory()`, `getCategoriesWithScriptCount()`, `formatCategoryForDropdown()`
- Server-side data loading using route loaders (not `createServerFn`)
- Type-safe interfaces define the murder mystery domain

### UI Architecture

- **shadcn/ui component system** with Radix UI primitives and Tailwind CSS
- **Dark mystery theme** with custom CSS variables (black/red/gold color scheme)
- **Modern card-based design** with hover effects and smooth transitions
- **Responsive grid layouts** with Tailwind's responsive classes
- **Accessible components** with proper ARIA labels and keyboard navigation
- **Lucide React icons** for consistent iconography
- **Badge system** for status indicators (新/熱), categories, and rankings
- **Button variants** with custom mystery theme colors
- **Typography hierarchy** with proper text sizing and colors
- **Dropdown navigation** with category filtering in header
- **SEO optimization** with comprehensive meta tags and structured data

### TypeScript Configuration

- Strict TypeScript with comprehensive linting rules
- JSX configured for React 19
- Module resolution set to "bundler" for Vite compatibility
- Type-safe routing with auto-generated route types
- Import type-only syntax required due to `verbatimModuleSyntax`

### Development Notes

- Development server typically runs on port 3000 (may auto-increment if occupied)
- Route generation happens automatically - never edit `routeTree.gen.ts` (ignored by git)
- Auto-generated files (.nitro/, .vinxi/, .tanstack-start/) are ignored by git
- Server functions replaced with direct loader implementations for simpler data loading
- All routes inherit from the root layout in `__root.tsx`
- Use `Link` component with `params` object for dynamic routing (not template strings)
- TypeScript errors (TS6133) are automatically resolved through proper import management

### shadcn/ui Integration

- Components located in `src/components/ui/` directory
- Custom utility function `cn()` in `src/lib/utils.ts` for conditional styling
- Tailwind configuration with custom mystery theme colors
- PostCSS setup with `@tailwindcss/postcss` plugin
- Global styles in `src/globals.css` with CSS variables for theming
- Path aliases configured for `@/` but use relative imports for reliability

### Component Usage Patterns

- Use `Card`, `CardHeader`, `CardTitle`, `CardContent` for content sections
- Apply `Badge` with custom variants for status and category indicators
- Implement `Button` with mystery theme colors and hover effects
- Use `Separator` for visual content division
- Apply `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious` for touch-friendly content navigation
- Use `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` for navigation menus
- Import components with relative paths (e.g., `'./ui/card'` or `'../../components/ui/card'`)
- Apply custom mystery theme classes: `text-mystery-text-primary`, `bg-mystery-bg-card`, etc.

### Carousel Implementation Notes

- Hot recommendations section uses shadcn/ui Carousel with Embla Carousel engine
- Responsive design: 1 column on mobile, 2 on tablet, 3 on desktop (`md:basis-1/2 lg:basis-1/3`)
- Loop enabled for continuous navigation
- Desktop: Navigation arrows visible, positioned outside carousel (-left-12, -right-12)
- Mobile: Navigation arrows hidden, swipe gestures enabled with user guidance text
- Custom styling with mystery theme colors for navigation buttons

### Category System

- **Category Management**: Categories defined in `src/data/category.ts` with localized names and descriptions
- **Category Types**: mystery, horror, fantasy, emotion, ancient, modern - each with custom colors and icons
- **Category Navigation**: Dropdown menu in header for quick category access
- **Category Pages**: Dynamic routing for `/categories/$category` with filtered script listings
- **Category Helpers**: Functions in `src/lib/category.ts` for category operations and script filtering

### Git Configuration

- **TanStack Start 2025 Best Practices**: `.gitignore` configured to ignore build artifacts
- **Auto-generated Files**: `.nitro/`, `.vinxi/`, `.tanstack-start/`, `routeTree.gen.ts` ignored
- **Source Maps**: `*.map` files ignored to keep repository clean
- **Deployment Files**: `.vercel/`, `.firebase/` ignored for platform deployment

### Dependencies

Current production dependencies:
- `@radix-ui/react-dropdown-menu`: ^2.1.15 - Dropdown menu component
- `@radix-ui/react-icons`: ^1.3.2 - Icon library
- `@radix-ui/react-separator`: ^1.1.7 - Separator component
- `@radix-ui/react-slot`: ^1.2.3 - Slot component for composition
- `@tailwindcss/postcss`: ^4.1.11 - PostCSS plugin for Tailwind
- `@tailwindcss/typography`: ^0.5.16 - Typography plugin
- `@tanstack/react-router`: ^1.125.6 - File-based routing
- `@tanstack/react-start`: ^1.125.6 - Full-stack framework
- `class-variance-authority`: ^0.7.1 - Utility for component variants
- `clsx`: ^2.1.1 - Conditional class names
- `embla-carousel-react`: ^8.6.0 - Carousel component
- `lucide-react`: ^0.525.0 - Modern icon library
- `tailwind-merge`: ^3.3.1 - Tailwind class merging utility

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
>>>>>>> 2eec19d54b9fb7654108400140375f3044a139cd
