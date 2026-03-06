# Loading State Patterns

This document outlines the standardized loading patterns used across the PlayHard Backoffice application.

## Overview

We use a consistent set of loading components to provide unified UX across all loading states:

- **LoadingState**: Main flexible loading component
- **LoadingSpinner**: Just the spinner for inline use
- **LoadingOverlay**: Full screen loading with backdrop
- **LoadingInline**: Small loading for buttons/form elements
- **LoadingCard**: Medium loading for cards/sections
- **LoadingPage**: Large loading for main page content

## Import Pattern

```typescript
import { LoadingCard, LoadingSpinner, LoadingOverlay } from '@/components/ui';
```

## Usage Patterns

### 1. Full Screen Loading (Authentication/Permissions)

**Use Case**: While checking authentication or permissions
**Component**: `LoadingOverlay`

```typescript
if (isPending) {
  return <LoadingOverlay message="Checking permissions..." />;
}
```

### 2. Card/Section Loading (Data Fetching)

**Use Case**: Loading content within cards, tables, or sections
**Component**: `LoadingCard`

```typescript
{isLoading ? (
  <LoadingCard message="Loading organizations..." />
) : (
  // Your content here
)}
```

### 3. Button Loading States

**Use Case**: Form submissions, actions in progress
**Component**: `LoadingSpinner` + text

```typescript
<Button disabled={isPending}>
  {isPending && <LoadingSpinner size="sm" className="mr-2" />}
  {isPending ? 'Creating...' : 'Create User'}
</Button>
```

### 4. Table Row Loading

**Use Case**: Loading states within table cells
**Component**: `LoadingInline`

```typescript
<TableRow>
  <TableCell colSpan={6} className="h-24 text-center">
    <LoadingInline message="Loading users..." />
  </TableCell>
</TableRow>
```

### 5. Suspense Boundaries

**Use Case**: React Suspense fallbacks
**Component**: `LoadingCard`

```typescript
<Suspense fallback={<LoadingCard message="Loading form..." />}>
  <YourComponent />
</Suspense>
```

### 6. Select/Dropdown Loading

**Use Case**: Loading states in form selects
**Pattern**: Conditional placeholder text

```typescript
<SelectValue placeholder={isLoading ? "Loading..." : "Select option"} />
```

## Accessibility Features

All loading components include:
- `role="status"`
- `aria-live="polite"`  
- `aria-label` with the loading message
- `aria-hidden="true"` on spinner icons
- Screen reader appropriate text

## Size Guide

| Size | Icon Size | Use Case |
|------|-----------|----------|
| `sm` | 16px | Buttons, inline elements |
| `md` | 24px | Cards, sections (default) |
| `lg` | 32px | Pages, overlays |

## Error and Empty States

Combine with consistent error and empty states:

```typescript
{isLoading ? (
  <LoadingCard message="Loading data..." />
) : error ? (
  <ErrorState 
    title="Failed to load"
    message={error.message}
    onRetry={refetch}
  />
) : data.length === 0 ? (
  <EmptyState
    icon={Users}
    title="No data found"
    description="Get started by adding some data."
    action={{
      label: "Add Item",
      onClick: handleAdd
    }}
  />
) : (
  // Your data display
)}
```

## Migration Guide

### Before (Inconsistent)
```typescript
// Different patterns across the app
<div className="flex items-center justify-center py-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2"></div>
  <span>Loading...</span>
</div>

<Loader2 className="h-6 w-6 animate-spin" />
{isPending ? "Loading..." : "Load"}
```

### After (Consistent)
```typescript
// Unified patterns
<LoadingCard message="Loading data..." />

<LoadingSpinner size="md" />
{isPending ? "Loading..." : "Load"}
```

## Performance Benefits

- **Reduced Bundle Size**: Single loading system vs scattered implementations
- **Better UX**: Consistent timing and animations
- **Accessibility**: Built-in ARIA attributes
- **Maintainability**: Single source of truth for loading states

## Best Practices

1. **Always provide meaningful messages**: Use descriptive text like "Loading users..." instead of generic "Loading..."

2. **Match the context**: Use `LoadingCard` for card content, `LoadingInline` for table rows, etc.

3. **Combine with error handling**: Always handle loading, error, and empty states together

4. **Use Suspense boundaries**: Wrap async components with appropriate loading fallbacks

5. **Button states**: Disable buttons during loading and show progress indicators

## Files Updated

The following files have been updated to use the standardized loading patterns:

- `/src/app/dashboard/organizations/page.tsx`
- `/src/components/users-list.tsx`
- `/src/app/dashboard/permissions/users/page.tsx`
- `/src/components/merchants-list.tsx`
- `/src/app/dashboard/users/create/page.tsx`
- `/src/app/dashboard/users/page.tsx`
- `/src/components/forms/create-org-user-form.tsx`

All now use consistent loading states from `/src/components/ui/loading-state.tsx`.