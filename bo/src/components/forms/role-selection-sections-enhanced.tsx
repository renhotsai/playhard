'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type RoleSelectionSectionsPropsEnhanced,
  type RoleType,
  type RoleSection,
  DEFAULT_ROLE_SECTIONS,
  isOrganizationRole,
  getRoleSectionType,
  requiresOrganization
} from '@/types/role-sections'

// Mock organization data - in a real app this would come from an API
const mockOrganizations = [
  { id: '1', name: 'Acme Gaming Studio', description: 'Premium gaming experiences' },
  { id: '2', name: 'Mystery Manor Inc', description: 'Interactive mystery games' },
  { id: '3', name: 'Escape Room Central', description: 'Multi-location escape rooms' },
]

interface OrganizationSelectProps {
  value: string | null
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

function OrganizationSelect({ value, onChange, error, disabled }: OrganizationSelectProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Organization <span className="text-destructive">*</span>
      </Label>
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={cn(
          'w-full',
          error && 'border-destructive focus-visible:ring-destructive/20'
        )}>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select an organization..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="p-2">
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            mockOrganizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.description}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

interface RoleOptionProps {
  role: {
    id: RoleType
    label: string
    description: string
    badge?: {
      text: string
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
    }
  }
  selected: boolean
  onSelect: (roleId: RoleType) => void
  disabled?: boolean
}

function RoleOption({ role, selected, onSelect, disabled }: RoleOptionProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(role.id)
    }
  }

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
        selected && 'bg-accent border-primary ring-1 ring-primary/20',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:bg-accent/50 hover:border-accent-foreground/20'
      )}
      onClick={handleClick}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      <RadioGroupItem
        value={role.id}
        checked={selected}
        disabled={disabled}
        className="mt-0.5"
      />
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <Label className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            !disabled && 'cursor-pointer'
          )}>
            {role.label}
          </Label>
          
          {role.badge && (
            <Badge variant={role.badge.variant}>
              {role.badge.text}
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {role.description}
        </p>
      </div>
    </div>
  )
}

export function RoleSelectionSections({
  selectedRole,
  selectedOrganization,
  onRoleChange,
  onSubmit,
  validationErrors,
  disabled = false,
  className,
  'data-testid': testId = 'role-selection-sections-enhanced'
}: RoleSelectionSectionsPropsEnhanced) {
  const [isLoading, setIsLoading] = useState(false)

  // Handle role selection
  const handleRoleSelect = (roleType: RoleType) => {
    if (disabled) return

    setIsLoading(true)
    
    try {
      const section = getRoleSectionType(roleType)
      const requiresOrg = requiresOrganization(roleType)
      
      onRoleChange({
        roleType,
        section,
        requiresOrganization: requiresOrg
      })
    } catch (error) {
      console.error('Error handling role selection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle organization selection
  const handleOrganizationSelect = (organizationId: string) => {
    if (disabled || !selectedRole) return
    
    // You would typically call a callback here to update the parent form state
    // For now, we'll just log it since the interface doesn't include org change callback
    console.log('Organization selected:', organizationId)
  }

  // Show organization selector when organization role is selected
  const showOrganizationSelect = selectedRole && isOrganizationRole(selectedRole)

  // Group sections for rendering
  const sections = useMemo(() => DEFAULT_ROLE_SECTIONS, [])

  return (
    <div className={cn('space-y-6', className)} data-testid={testId}>
      <RadioGroup
        value={selectedRole || undefined}
        onValueChange={handleRoleSelect}
        disabled={disabled || isLoading}
        className="space-y-8"
        aria-label="Select user role type"
      >
        {sections.map((sectionConfig, index) => (
          <React.Fragment key={sectionConfig.section}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle 
                  className="text-lg font-semibold"
                  id={`${sectionConfig.section}-section-heading`}
                >
                  {sectionConfig.title}
                </CardTitle>
                {sectionConfig.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {sectionConfig.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent>
                <div
                  role="group"
                  aria-labelledby={`${sectionConfig.section}-section-heading`}
                  className="space-y-3"
                >
                  {sectionConfig.roles.map((role) => (
                    <RoleOption
                      key={role.id}
                      role={role}
                      selected={selectedRole === role.id}
                      onSelect={handleRoleSelect}
                      disabled={disabled || isLoading}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {index < sections.length - 1 && (
              <div className="border-t my-6" />
            )}
          </React.Fragment>
        ))}
      </RadioGroup>

      {/* Conditional Organization Selection */}
      {showOrganizationSelect && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Organization Assignment
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select the organization this user will be assigned to
            </p>
          </CardHeader>
          <CardContent>
            <OrganizationSelect
              value={selectedOrganization}
              onChange={handleOrganizationSelect}
              error={validationErrors?.organizationId}
              disabled={disabled || isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {validationErrors?.roleType && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationErrors.roleType}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
          <span>Processing role selection...</span>
        </div>
      )}
    </div>
  )
}