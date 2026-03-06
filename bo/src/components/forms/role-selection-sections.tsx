'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RadioGroup } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Building2 } from 'lucide-react'
import { RoleSelectionLoading, RoleOptionSkeleton, OrganizationSelectSkeleton } from '@/components/ui/loading-state'
import { cn } from '@/lib/utils'
import { RoleSectionGroup } from './role-section-group'
import { queryKeys } from '@/lib/query-keys'
import {
  type RoleSelectionSectionsProps,
  type RoleSelectionSectionsPropsEnhanced,
  type RoleType,
  type CreateUserFormData,
  DEFAULT_ROLE_SECTIONS,
  ROLE_SECTION_TEST_IDS,
  ROLE_SECTION_ARIA,
  isOrganizationRole,
  isSystemRole,
  getRoleSectionType,
  requiresOrganization
} from '@/types/role-sections'

// Organization type from API
interface Organization {
  id: string;
  name: string;
  slug: string;
  memberCount?: number;
}

interface OrganizationSelectProps {
  value: string | null
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

function OrganizationSelect({ value, onChange, error, disabled }: OrganizationSelectProps) {
  // Fetch organizations using TanStack Query
  const { data: organizationsData, isLoading } = useQuery({
    queryKey: queryKeys.organizations.all(),
    queryFn: async () => {
      const response = await fetch('/api/organizations');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const result = await response.json();
      return result.data as Organization[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const organizations = organizationsData || [];

  // Show skeleton while loading
  if (isLoading) {
    return <OrganizationSelectSkeleton />;
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Organization <span className="text-destructive">*</span>
      </Label>
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
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
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground">
                  {org.memberCount ? `${org.memberCount} members` : 'No members'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

// Function overloads for different interfaces
export function RoleSelectionSections(props: RoleSelectionSectionsProps): JSX.Element;
export function RoleSelectionSections(props: RoleSelectionSectionsPropsEnhanced): JSX.Element;
export function RoleSelectionSections(props: RoleSelectionSectionsProps | RoleSelectionSectionsPropsEnhanced) {
  // Type guard to determine which interface is being used
  const isEnhancedProps = (p: any): p is RoleSelectionSectionsPropsEnhanced => {
    return 'selectedRole' in p && 'onRoleChange' in p
  }

  if (isEnhancedProps(props)) {
    return <RoleSelectionSectionsEnhanced {...props} />
  } else {
    return <RoleSelectionSectionsOriginal {...props} />
  }
}

// Enhanced component implementation
function RoleSelectionSectionsEnhanced({
  selectedRole,
  selectedOrganization,
  onRoleChange,
  onOrganizationChange,
  onSubmit,
  validationErrors,
  disabled = false,
  className,
  'data-testid': testId = 'role-selection-sections-enhanced'
}: RoleSelectionSectionsPropsEnhanced) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [sectionErrors, setSectionErrors] = React.useState<{
    system?: string;
    organization?: string;
    general?: string;
  }>({})

  // Handle role selection with enhanced error handling
  const handleRoleSelect = (roleType: RoleType) => {
    if (disabled) return

    // Clear previous section errors
    setSectionErrors({})
    setIsLoading(true)
    
    try {
      // Validate role type
      if (!roleType) {
        setSectionErrors({ general: 'Please select a valid role' })
        setIsLoading(false)
        return
      }

      const section = getRoleSectionType(roleType)
      const requiresOrg = requiresOrganization(roleType)
      
      // Section-specific validation
      if (section === 'system' && selectedRole && !isSystemRole(selectedRole) && isSystemRole(roleType)) {
        // Switching from organization to system role
        setSectionErrors({ 
          system: 'Switching to system role will clear organization assignment' 
        })
      } else if (section === 'organization' && selectedRole && isSystemRole(selectedRole) && !isSystemRole(roleType)) {
        // Switching from system to organization role
        setSectionErrors({ 
          organization: 'Organization role selected - you will need to choose an organization' 
        })
      }
      
      onRoleChange({
        roleType,
        section,
        requiresOrganization: requiresOrg
      })
    } catch (error) {
      console.error('Error handling role selection:', error)
      setSectionErrors({ 
        general: 'Failed to process role selection. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle organization selection with validation
  const handleOrganizationSelect = (organizationId: string) => {
    if (disabled || !selectedRole) return
    
    // Clear organization-related errors
    setSectionErrors(prev => ({ ...prev, organization: undefined }))
    
    try {
      // Validate organization selection
      if (!organizationId) {
        setSectionErrors(prev => ({ 
          ...prev, 
          organization: 'Please select an organization for this role' 
        }))
        return
      }

      // Call the parent callback to update form state
      if (onOrganizationChange) {
        onOrganizationChange(organizationId)
      }
    } catch (error) {
      console.error('Error handling organization selection:', error)
      setSectionErrors(prev => ({ 
        ...prev, 
        organization: 'Failed to select organization. Please try again.' 
      }))
    }
  }

  // Show organization selector when organization role is selected
  const showOrganizationSelect = selectedRole && isOrganizationRole(selectedRole)

  // Show skeleton loading state while processing role selection
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)} data-testid={`${testId}-loading`}>
        <RoleSelectionLoading />
        {showOrganizationSelect && <OrganizationSelectSkeleton />}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)} data-testid={testId}>
      <RadioGroup
        value={selectedRole || undefined}
        onValueChange={handleRoleSelect}
        disabled={disabled}
        className="space-y-8"
        aria-label="Select user role type - choose between System Roles or Organization Roles"
        aria-describedby="role-selection-instructions"
        data-testid="radio-group"
      >
        {/* Screen reader instructions */}
        <div 
          id="role-selection-instructions" 
          className="sr-only"
          aria-live="polite"
        >
          Use arrow keys to navigate between role options. Press Enter or Space to select a role. 
          System roles provide global access, while organization roles are limited to specific organizations.
        </div>
        {DEFAULT_ROLE_SECTIONS.map((sectionConfig, index) => (
          <React.Fragment key={sectionConfig.section}>
            <Card className="w-full" data-testid="card">
              <CardHeader data-testid="card-header">
                <CardTitle 
                  className="text-lg font-semibold"
                  id={`${sectionConfig.section}-section-heading`}
                  data-testid={ROLE_SECTION_TEST_IDS.sectionTitle(sectionConfig.section)}
                  role="heading"
                  aria-level={3}
                >
                  {sectionConfig.title}
                </CardTitle>
                {sectionConfig.description && (
                  <p 
                    className="text-sm text-muted-foreground mt-1" 
                    data-testid="card-description"
                    id={`${sectionConfig.section}-section-description`}
                    aria-label={`Section description: ${sectionConfig.description}`}
                  >
                    {sectionConfig.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent data-testid="card-content">
                <div
                  role="radiogroup"
                  aria-labelledby={`${sectionConfig.section}-section-heading`}
                  aria-describedby={`${sectionConfig.section}-section-description`}
                  className="space-y-3"
                  data-testid={ROLE_SECTION_TEST_IDS[`${sectionConfig.section}Section` as keyof typeof ROLE_SECTION_TEST_IDS]}
                  onKeyDown={(e) => {
                    // Handle arrow key navigation within section
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault()
                      const roleElements = e.currentTarget.querySelectorAll('[role="radio"]:not([aria-disabled="true"])')
                      const currentIndex = Array.from(roleElements).findIndex(el => el === e.target)
                      
                      if (currentIndex !== -1) {
                        const nextIndex = e.key === 'ArrowDown' 
                          ? (currentIndex + 1) % roleElements.length
                          : (currentIndex - 1 + roleElements.length) % roleElements.length
                        
                        const nextElement = roleElements[nextIndex] as HTMLElement
                        nextElement?.focus()
                      }
                    }
                  }}
                >
                  {sectionConfig.roles.map((role) => (
                    <RoleOptionEnhanced
                      key={role.id}
                      role={role}
                      selected={selectedRole === role.id}
                      onSelect={handleRoleSelect}
                      disabled={disabled}
                      data-testid={ROLE_SECTION_TEST_IDS.roleOption(role.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {index < DEFAULT_ROLE_SECTIONS.length - 1 && (
              <div className="border-t my-6" />
            )}
          </React.Fragment>
        ))}
      </RadioGroup>

      {/* Conditional Organization Selection */}
      {showOrganizationSelect && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle 
              className="text-lg font-semibold"
              id="organization-assignment-heading"
              role="heading"
              aria-level={3}
            >
              Organization Assignment
            </CardTitle>
            <p 
              className="text-sm text-muted-foreground"
              id="organization-assignment-description"
              aria-label="Organization selection instructions"
            >
              Select the organization this user will be assigned to
            </p>
          </CardHeader>
          <CardContent>
            <div 
              role="group"
              aria-labelledby="organization-assignment-heading"
              aria-describedby="organization-assignment-description"
            >
              <OrganizationSelect
                value={selectedOrganization}
                onChange={handleOrganizationSelect}
                error={validationErrors?.organizationId}
                disabled={disabled || isLoading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Section-specific Error Display */}
      {(validationErrors || Object.keys(sectionErrors).length > 0) && (
        <div className="space-y-3">
          {/* General validation errors */}
          {validationErrors?.roleType && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription data-testid={ROLE_SECTION_TEST_IDS.errorMessage}>
                <span className="font-medium">Role Selection Error:</span> {validationErrors.roleType}
              </AlertDescription>
            </Alert>
          )}
          
          {validationErrors?.selectedSection && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Section Error:</span> {validationErrors.selectedSection}
              </AlertDescription>
            </Alert>
          )}

          {/* Section-specific errors */}
          {sectionErrors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Error:</span> {sectionErrors.general}
              </AlertDescription>
            </Alert>
          )}

          {sectionErrors.system && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">System Role:</span> {sectionErrors.system}
              </AlertDescription>
            </Alert>
          )}

          {sectionErrors.organization && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Organization Role:</span> {sectionErrors.organization}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Inline Loading State for Actions */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border border-dashed">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing role selection...</span>
        </div>
      )}
    </div>
  )
}

// Enhanced role option component with accessibility improvements
interface RoleOptionEnhancedProps {
  role: any
  selected: boolean
  onSelect: (roleId: RoleType) => void
  disabled?: boolean
  'data-testid'?: string
}

function RoleOptionEnhanced({ role, selected, onSelect, disabled, 'data-testid': testId }: RoleOptionEnhancedProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(role.id)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    
    // Handle Enter and Space key activation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(role.id)
    }
  }

  const roleOptionId = `role-option-${role.id}`
  const descriptionId = `${roleOptionId}-description`
  const badgeId = role.badge ? `${roleOptionId}-badge` : undefined

  return (
    <div
      id={roleOptionId}
      className={cn(
        'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
        selected && 'bg-accent border-primary ring-1 ring-primary/20',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:bg-accent/50 hover:border-accent-foreground/20'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-labelledby={`${roleOptionId}-label`}
      aria-describedby={cn(
        descriptionId,
        badgeId && ` ${badgeId}`
      )}
      tabIndex={disabled ? -1 : 0}
      data-testid={testId}
    >
      <input
        type="radio"
        value={role.id}
        checked={selected}
        disabled={disabled}
        onChange={handleClick}
        className="mt-0.5"
        aria-hidden="true" // Hide from screen readers as the parent div handles the radio semantics
        tabIndex={-1} // Remove from tab order
      />
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <Label 
            id={`${roleOptionId}-label`}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              !disabled && 'cursor-pointer'
            )}
          >
            {role.label}
          </Label>
          
          {role.badge && (
            <span 
              id={badgeId}
              className={`badge badge-${role.badge.variant}`}
              data-testid="badge"
              data-variant={role.badge.variant}
              aria-label={`Role type: ${role.badge.text}`}
            >
              {role.badge.text}
            </span>
          )}
        </div>
        
        <p 
          id={descriptionId}
          className="text-xs text-muted-foreground"
          aria-label={`Role description: ${role.description}`}
        >
          {role.description}
        </p>
      </div>
    </div>
  )
}

// Original component implementation (for backwards compatibility)
function RoleSelectionSectionsOriginal({
  value,
  onValueChange,
  disabled = false,
  error,
  sections = DEFAULT_ROLE_SECTIONS,
  className,
  'data-testid': testId = ROLE_SECTION_TEST_IDS.container
}: RoleSelectionSectionsProps) {
  const [loading, setLoading] = React.useState(false);

  // Enhanced validation with detailed error messages
  const validateSelection = React.useCallback((selectedValue: string) => {
    if (!selectedValue) {
      return "Please select a role type to continue";
    }
    
    const roleSection = sections.find(section => 
      section.roles.some(role => role.id === selectedValue)
    );
    
    if (!roleSection) {
      return "Invalid role selection. Please choose from available options";
    }
    
    return null;
  }, [sections]);

  // Handle role selection with validation
  const handleRoleSelect = React.useCallback((selectedValue: string) => {
    if (disabled) return;
    
    setLoading(true);
    const validationError = validateSelection(selectedValue);
    
    if (validationError) {
      console.warn(`Role selection validation failed: ${validationError}`);
      setLoading(false);
      return;
    }
    
    try {
      onValueChange(selectedValue as RoleType);
    } catch (error) {
      console.error('Error handling role selection:', error);
    } finally {
      setLoading(false);
    }
  }, [disabled, validateSelection, onValueChange]);

  return (
    <div
      className={cn('space-y-6', className)}
      data-testid={testId}
    >
      <RadioGroup
        value={value}
        onValueChange={handleRoleSelect}
        disabled={disabled || loading}
        className="space-y-8"
        role={ROLE_SECTION_ARIA.roleSelection}
        aria-label={ROLE_SECTION_ARIA.roleSelectionLabel}
        aria-describedby={error ? `${testId}-error` : undefined}
      >
        {sections.map((sectionConfig, index) => (
          <React.Fragment key={sectionConfig.section}>
            <RoleSectionGroup
              config={sectionConfig}
              selectedValue={value}
              onRoleSelect={handleRoleSelect}
              disabled={disabled || loading}
              isLoading={loading}
              data-testid={ROLE_SECTION_TEST_IDS[`${sectionConfig.section}Section` as keyof typeof ROLE_SECTION_TEST_IDS]}
            />
            {index < sections.length - 1 && (
              <Separator className="my-6" />
            )}
          </React.Fragment>
        ))}
      </RadioGroup>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription
            id={`${testId}-error`}
            data-testid={ROLE_SECTION_TEST_IDS.errorMessage}
            role="alert"
            aria-live="polite"
          >
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {loading && (
        <div 
          className="flex items-center gap-2 text-sm text-muted-foreground mt-2"
          data-testid={`${testId}-loading`}
          aria-live="polite"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Processing role selection...</span>
        </div>
      )}
    </div>
  )
}