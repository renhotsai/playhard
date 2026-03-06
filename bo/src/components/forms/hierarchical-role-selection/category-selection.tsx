'use client'

import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Building2 } from 'lucide-react'
import type {
  CategorySelectionProps,
  CategoryOption,
  RoleCategory
} from '@/types/hierarchical-roles'

/**
 * CategorySelection Component
 * 
 * Displays available role categories (System/Organization) as selectable cards.
 * Supports loading, disabled, and error states with full accessibility.
 */
export const CategorySelection = memo(function CategorySelection({
  categories,
  selectedCategory = null,
  onSelect,
  disabled = false,
  loading = false,
  error = null,
  className,
  'data-testid': dataTestId = 'category-selection',
  ...props
}: CategorySelectionProps) {
  

  // Show empty state when no categories
  if (!categories || categories.length === 0) {
    return (
      <div
        className={cn(
          'text-center py-8',
          disabled && 'disabled',
          className
        )}
        data-testid={dataTestId}
        role="group"
        aria-label="Select role category"
        {...props}
      >
        <div data-testid="empty-state" className="text-muted-foreground">
          <p>No categories available</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-4',
        loading && 'loading',
        disabled && 'disabled opacity-50 pointer-events-none',
        error && 'error',
        className
      )}
      data-testid={dataTestId}
      role="group"
      aria-label="Select role category"
      {...props}
    >
      {/* Loading indicator */}
      {loading && (
        <div data-testid="loading-indicator" className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
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

      {/* Category cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id
          const IconComponent = category.icon
          const isDisabled = disabled || loading

          return (
            <Card
              key={category.id}
              data-testid="card"
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
              )}
            >
              {/* Main clickable area with category-specific test ID and all attributes */}
              <div
                data-testid={`category-${category.id}`}
                className={cn(
                  'w-full h-full',
                  isSelected && 'selected',
                  isDisabled && 'disabled'
                )}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-label={`Select ${category.title} category`}
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    onSelect(category.id)
                  }
                }}
                onKeyDown={(e) => {
                  if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onSelect(category.id)
                  }
                }}
              >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {IconComponent && (
                      <div className="flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                  </div>
                  {category.badge && (
                    <Badge
                      variant={category.badgeVariant || 'default'}
                      className="flex-shrink-0"
                    >
                      {category.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  {category.description}
                </CardDescription>
              </CardHeader>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-3 w-3 bg-primary rounded-full"></div>
                </div>
              )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
})