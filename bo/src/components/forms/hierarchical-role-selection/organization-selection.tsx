'use client'

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Building2, Users, AlertCircle } from 'lucide-react'
import type { OrganizationOption } from '@/types/hierarchical-roles'

interface OrganizationSelectionProps {
  organizations?: OrganizationOption[]
  selectedOrganization?: string | null
  onSelect: (organizationId: string | null) => void
  disabled?: boolean
  loading?: boolean
  error?: string | null
  required?: boolean
  searchable?: boolean
  className?: string
  'data-testid'?: string
}

/**
 * OrganizationSelection Component
 * 
 * Displays a dropdown for selecting an organization when required by the selected role.
 * Supports loading, disabled, error states, and search functionality.
 */
export function OrganizationSelection({
  organizations = [],
  selectedOrganization = null,
  onSelect,
  disabled = false,
  loading = false,
  error = null,
  required = false,
  searchable = false,
  className,
  'data-testid': dataTestId = 'organization-selection',
  ...props
}: OrganizationSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter organizations based on search query
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery) return organizations
    return organizations.filter(org =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [organizations, searchQuery])

  // Show loading skeleton when loading
  if (loading) {
    return (
      <div
        className={cn('space-y-2', className)}
        data-testid={dataTestId}
        {...props}
      >
        <div data-testid="skeleton" className="space-y-2">
          <div className="text-sm">Loading organizations...</div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  // Show empty state when no organizations available
  if (organizations.length === 0) {
    return (
      <div
        className={cn('space-y-4', disabled && 'disabled', className)}
        data-testid={dataTestId}
        role="group"
        {...props}
      >
        <Label data-testid="label" htmlFor="organization-select">
          Organization{required && ' *'}
        </Label>
        
        <div data-testid="empty-state" className="space-y-3">
          <div className="text-sm text-muted-foreground">
            No organizations available
          </div>
          <div className="text-xs text-muted-foreground">
            Contact system administrator to create organizations.
          </div>
        </div>

        <Select disabled={true}>
          <SelectTrigger data-testid="select-trigger" className="disabled">
            <SelectValue placeholder="No organizations available" />
          </SelectTrigger>
        </Select>

        <div data-testid="select-root" className="disabled" />
      </div>
    )
  }

  const formatOrganizationDisplay = (org: OrganizationOption) => {
    const memberCount = org.memberCount ?? 0
    return `${org.name} (${memberCount} members)`
  }

  const handleSelectionChange = (value: string) => {
    if (!disabled && !loading) {
      onSelect(value || null)
    }
  }

  return (
    <div
      className={cn(
        'space-y-4',
        disabled && 'disabled',
        className
      )}
      data-testid={dataTestId}
      role="group"
      {...props}
    >
      {/* Form Label */}
      <Label 
        data-testid="label" 
        htmlFor="organization-select"
        className="text-sm font-medium"
      >
        Organization{required && <span className="text-destructive"> *</span>}
      </Label>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        Select the organization this user will belong to.
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" data-testid="alert" data-variant="destructive">
          <AlertCircle data-testid="alert-circle-icon" className="h-4 w-4" />
          <AlertDescription data-testid="alert-description">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Input - only show when searchable and many organizations */}
      {searchable && (
        <Input
          data-testid="search-input"
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2"
        />
      )}

      {/* Organization Select */}
      <div className="space-y-2">
        <Select
          value={selectedOrganization || ''}
          onValueChange={handleSelectionChange}
          disabled={disabled || loading}
        >
          <div data-testid="select-root" className={disabled ? 'disabled' : ''}>
            <SelectTrigger
              id="organization-select"
              data-testid="select-trigger"
              className={cn(
                'w-full',
                error && 'border-destructive focus:ring-destructive'
              )}
              aria-label="Select organization"
              aria-invalid={!!error}
              aria-describedby={error ? 'organization-error' : undefined}
            >
              <SelectValue placeholder="Select organization..." />
            </SelectTrigger>
          </div>
          
          <SelectContent data-testid="select-content">
            {filteredOrganizations.map((org) => (
              <SelectItem
                key={org.id}
                value={org.id}
                data-testid={`select-item-${org.id}`}
                disabled={org.disabled}
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>{formatOrganizationDisplay(org)}</span>
                  {org.memberCount !== undefined && (
                    <Users className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}