'use client'

import React, { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { RoleOption } from './role-option'
import {
  type RoleSectionGroupProps,
  ROLE_SECTION_ARIA
} from '@/types/role-sections'

interface RoleSectionGroupLoadingProps {
  sectionTitle: string;
  roleCount?: number;
  testId?: string;
}

function RoleSectionGroupLoading({ 
  sectionTitle, 
  roleCount = 3,
  testId 
}: RoleSectionGroupLoadingProps) {
  return (
    <Card 
      className="w-full"
      data-testid={`${testId}-loading`}
    >
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3" aria-live="polite" aria-label={`Loading ${sectionTitle} roles`}>
          {Array.from({ length: roleCount }, (_, index) => (
            <div 
              key={`skeleton-${index}`}
              className="flex items-center gap-3 p-3 border rounded-md"
            >
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const RoleSectionGroupComponent = memo(function RoleSectionGroup({
  config,
  selectedValue,
  onRoleSelect,
  disabled = false,
  isLoading = false,
  className,
  'data-testid': testId
}: RoleSectionGroupProps & { isLoading?: boolean }) {
  const sectionId = useMemo(() => `${config.section}-section-heading`, [config.section])

  const roleOptions = useMemo(() => 
    config.roles.map((role) => (
      <RoleOption
        key={role.id}
        role={role}
        selected={selectedValue === role.id}
        onSelect={onRoleSelect}
        disabled={disabled}
        data-testid={`role-option-${role.id}`}
      />
    )), 
    [config.roles, selectedValue, onRoleSelect, disabled]
  )

  if (isLoading) {
    return (
      <RoleSectionGroupLoading 
        sectionTitle={config.title}
        roleCount={config.roles.length}
        testId={testId}
      />
    )
  }

  return (
    <Card 
      className={cn('w-full', className)}
      data-testid={testId}
    >
      <CardHeader>
        <CardTitle 
          id={sectionId}
          className="text-lg font-semibold"
          data-testid={`section-title-${config.section}`}
        >
          {config.title}
        </CardTitle>
        {config.description && (
          <p 
            id={`${config.section}-section-info`}
            className="text-sm text-muted-foreground mt-1"
            aria-label={`${config.title} section description`}
          >
            {config.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div
          role={ROLE_SECTION_ARIA.sectionGroup}
          aria-labelledby={sectionId}
          aria-describedby={config.description ? `${config.section}-section-info` : undefined}
          aria-roledescription={`${config.title} role options`}
          className="space-y-3"
        >
          {roleOptions}
        </div>
      </CardContent>
    </Card>
  )
})

// Performance optimized export with memo comparison
export const RoleSectionGroup = memo(RoleSectionGroupComponent, (prevProps, nextProps) => {
  return (
    prevProps.config.section === nextProps.config.section &&
    prevProps.selectedValue === nextProps.selectedValue &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.config.roles.length === nextProps.config.roles.length &&
    prevProps.className === nextProps.className
  )
})