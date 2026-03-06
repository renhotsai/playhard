'use client'

import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import type {
  RoleSelectionStepProps,
  RoleOption,
  RoleType,
  RoleCategory
} from '@/types/hierarchical-roles'

/**
 * RoleSelectionStep Component
 * 
 * Displays available roles for the selected category with role titles like "Role Selection - {category}".
 * Shows role cards with icons, titles, descriptions, and badges.
 * Supports search functionality when enabled.
 */
export const RoleSelectionStep = memo(function RoleSelectionStep({
  roles,
  category,
  selectedRole = null,
  onSelect,
  disabled = false,
  loading = false,
  error = null,
  searchQuery = '',
  onSearchChange,
  showSearch = false,
  className,
  'data-testid': dataTestId = 'role-selection-step',
  ...props
}: RoleSelectionStepProps) {
  // Show loading skeleton when loading
  if (loading) {
    return (
      <div
        className={cn(
          'space-y-6 loading',
          disabled && 'disabled',
          className
        )}
        data-testid={dataTestId}
        {...props}
      >
        <div data-testid="loading-indicator" className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        {/* Loading skeletons */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-3 p-4 border rounded-lg">
              <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show empty state when no roles
  if (!roles || roles.length === 0) {
    // Check if it's a search with no results
    if (showSearch && searchQuery) {
      return (
        <div
          className={cn(
            'space-y-6',
            disabled && 'disabled',
            error && 'error',
            className
          )}
          data-testid={dataTestId}
          {...props}
        >
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              disabled={disabled || loading}
              className="pl-10"
            />
          </div>

          <div data-testid="no-results" className="text-center py-8 text-muted-foreground">
            <p>No roles found matching "{searchQuery}"</p>
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'text-center py-8',
          disabled && 'disabled',
          className
        )}
        data-testid={dataTestId}
        {...props}
      >
        <div data-testid="empty-state" className="text-muted-foreground">
          <p>No roles available for this category</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-6',
        disabled && 'disabled opacity-50 pointer-events-none',
        error && 'error',
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      {/* Error message */}
      {error && (
        <div
          data-testid="error-message"
          className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Search input */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="search-input"
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            disabled={disabled || loading}
            className="pl-10"
          />
        </div>
      )}

      {/* Role selection */}
      <RadioGroup
        value={selectedRole || ''}
        disabled={disabled || loading}
        aria-label={`Select ${category} role`}
        className="space-y-4"
      >
        {roles.map((role) => {
          const isSelected = selectedRole === role.id
          const IconComponent = role.icon

          return (
            <Label
              key={role.id}
              htmlFor={role.id}
              data-testid={`role-option-${role.id}`}
              className={cn(
                'flex items-start space-x-3 p-4 border rounded-lg transition-all duration-200 cursor-pointer',
                'hover:border-primary/50 hover:bg-primary/5',
                'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
                isSelected && 'border-primary bg-primary/5',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RadioGroupItem
                value={role.id}
                id={role.id}
                data-testid={`radio-${role.id}`}
                checked={isSelected}
                disabled={disabled || loading}
                className="mt-1"
                aria-labelledby={`role-label-${role.id}`}
                aria-checked={isSelected}
                aria-disabled={disabled || loading}
                onChange={() => {}} // Suppress React warning
                onClick={() => {
                  if (!disabled && !loading) {
                    onSelect(role.id)
                  }
                }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {IconComponent && (
                      <div className="flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        id={`role-label-${role.id}`}
                        data-testid={`role-label-${role.id}`}
                        className="text-sm font-medium"
                      >
                        {role.title}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={role.badgeVariant}
                    className="flex-shrink-0 ml-2"
                  >
                    {role.badge}
                  </Badge>
                </div>
                
                {/* Role requirements indicator */}
                {role.requiresOrganization && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Requires organization selection
                  </div>
                )}
              </div>
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
})