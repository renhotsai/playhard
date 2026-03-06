'use client'

import React, { memo, useCallback } from 'react'
import { RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  type RoleOptionProps
} from '@/types/role-sections'

const RoleOptionComponent = memo(function RoleOption({
  role,
  selected,
  onSelect,
  disabled = false,
  className,
  'data-testid': testId
}: RoleOptionProps) {
  const inputId = `role-option-${role.id}`

  const handleSelect = useCallback(() => {
    if (!disabled && onSelect) {
      onSelect(role.id)
    }
  }, [disabled, onSelect, role.id])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Enhanced keyboard navigation for accessibility
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      handleSelect()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      // Allow arrow key navigation to be handled by parent RadioGroup
      return
    }
  }, [handleSelect])

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
        selected && 'bg-accent border-primary ring-1 ring-primary/20',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:bg-accent/50 hover:border-accent-foreground/20',
        className
      )}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      data-testid={testId}
      role="radio"
      aria-checked={selected}
      aria-labelledby={`${inputId}-label`}
      aria-describedby={`${inputId}-description ${role.section}-section-info`}
      aria-disabled={disabled}
      aria-required="true"
    >
      <RadioGroupItem
        value={role.id}
        id={inputId}
        checked={selected}
        disabled={disabled}
        className="mt-0.5"
      />
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={inputId}
            id={`${inputId}-label`}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              !disabled && 'cursor-pointer'
            )}
          >
            <div className="flex items-center space-x-2">
              {role.icon && (
                <role.icon className="h-4 w-4" />
              )}
              <span>{role.label}</span>
            </div>
          </Label>
          
          {role.badge && (
            <Badge variant={role.badge.variant}>
              {role.badge.text}
            </Badge>
          )}
        </div>
        
        <p
          id={`${inputId}-description`}
          className="text-xs text-muted-foreground"
        >
          {role.description}
        </p>
      </div>
    </div>
  )
})

// Performance optimized export with memo comparison
export const RoleOption = memo(RoleOptionComponent, (prevProps, nextProps) => {
  return (
    prevProps.role.id === nextProps.role.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className &&
    prevProps['data-testid'] === nextProps['data-testid']
  )
})