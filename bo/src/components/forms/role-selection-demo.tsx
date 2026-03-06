'use client'

import React, { useState } from 'react'
import { RoleSelectionSections } from './role-selection-sections'
import {
  type RoleType,
  type RoleSection,
  type CreateUserFormData,
  isOrganizationRole
} from '@/types/role-sections'

/**
 * Demo Component: Original Interface Usage
 * 
 * Shows how to use the RoleSelectionSections component with the original
 * simple interface (value + onValueChange pattern).
 */
export function RoleSelectionOriginalDemo() {
  const [selectedRole, setSelectedRole] = useState<RoleType | undefined>()
  const [error, setError] = useState<string>()

  const handleRoleChange = (value: RoleType) => {
    setSelectedRole(value)
    setError(undefined)
    
    console.log('Role selected (original interface):', {
      role: value,
      isSystemRole: value === 'system_admin',
      isOrganizationRole: isOrganizationRole(value)
    })
  }

  const handleSubmit = () => {
    if (!selectedRole) {
      setError('Please select a role type')
      return
    }
    
    console.log('Form submitted with role:', selectedRole)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Original Interface Demo</h2>
        <p className="text-muted-foreground mb-6">
          Simple value/onValueChange pattern for basic role selection.
        </p>
      </div>

      <RoleSelectionSections
        value={selectedRole}
        onValueChange={handleRoleChange}
        error={error}
        disabled={false}
      />

      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Submit
        </button>
        <button
          onClick={() => {
            setSelectedRole(undefined)
            setError(undefined)
          }}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Clear
        </button>
      </div>

      {selectedRole && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <h3 className="font-semibold">Selected Role:</h3>
          <p className="text-sm text-muted-foreground">{selectedRole}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Type: {isOrganizationRole(selectedRole) ? 'Organization Role' : 'System Role'}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Demo Component: Enhanced Interface Usage
 * 
 * Shows how to use the RoleSelectionSections component with the enhanced
 * interface that includes organization selection and detailed callbacks.
 */
export function RoleSelectionEnhancedDemo() {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    roleType?: string
    organizationId?: string
  }>({})

  const handleRoleChange = (selection: {
    roleType: RoleType | null
    section: RoleSection
    requiresOrganization: boolean
  }) => {
    setSelectedRole(selection.roleType)
    setValidationErrors({})
    
    // Clear organization if switching to system role
    if (!selection.requiresOrganization) {
      setSelectedOrganization(null)
    }
    
    console.log('Role changed (enhanced interface):', {
      role: selection.roleType,
      section: selection.section,
      requiresOrganization: selection.requiresOrganization
    })
  }

  const handleSubmit = (data: CreateUserFormData) => {
    console.log('Form submitted with data:', data)
    
    // Simulate form submission
    const errors: { roleType?: string; organizationId?: string } = {}
    
    if (!selectedRole) {
      errors.roleType = 'Role selection is required'
    }
    
    if (selectedRole && isOrganizationRole(selectedRole) && !selectedOrganization) {
      errors.organizationId = 'Organization selection is required for organization roles'
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    // Success
    alert('User created successfully!')
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Enhanced Interface Demo</h2>
        <p className="text-muted-foreground mb-6">
          Advanced interface with organization selection and detailed validation callbacks.
        </p>
      </div>

      <RoleSelectionSections
        selectedRole={selectedRole}
        selectedOrganization={selectedOrganization}
        onRoleChange={handleRoleChange}
        onSubmit={handleSubmit}
        validationErrors={validationErrors}
        disabled={false}
      />

      <div className="flex gap-4 pt-4">
        <button
          onClick={() => {
            if (!selectedRole) {
              setValidationErrors({ roleType: 'Please select a role type' })
              return
            }
            if (selectedRole && isOrganizationRole(selectedRole) && !selectedOrganization) {
              setValidationErrors({ organizationId: 'Please select an organization' })
              return
            }
            
            handleSubmit({
              email: 'demo@example.com',
              name: 'Demo User',
              userType: selectedRole === 'system_admin' ? 'system_admin' : 'organization_user',
              organizationId: selectedOrganization || undefined,
              organizationRole: selectedRole === 'system_admin' ? undefined : 'owner'
            })
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Create User
        </button>
        <button
          onClick={() => {
            setSelectedRole(null)
            setSelectedOrganization(null)
            setValidationErrors({})
          }}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Clear
        </button>
      </div>

      {selectedRole && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <h3 className="font-semibold">Selected Configuration:</h3>
          <p className="text-sm text-muted-foreground">Role: {selectedRole}</p>
          <p className="text-sm text-muted-foreground">
            Type: {isOrganizationRole(selectedRole) ? 'Organization Role' : 'System Role'}
          </p>
          {selectedOrganization && (
            <p className="text-sm text-muted-foreground">Organization ID: {selectedOrganization}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Organization Required: {selectedRole && isOrganizationRole(selectedRole) ? 'Yes' : 'No'}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Combined Demo showing both interfaces
 */
export function RoleSelectionCombinedDemo() {
  const [activeDemo, setActiveDemo] = useState<'original' | 'enhanced'>('original')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          RoleSelectionSections Component Demo
        </h1>
        
        <div className="flex justify-center mb-8 gap-4">
          <button
            onClick={() => setActiveDemo('original')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeDemo === 'original'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Original Interface
          </button>
          <button
            onClick={() => setActiveDemo('enhanced')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeDemo === 'enhanced'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Enhanced Interface
          </button>
        </div>

        {activeDemo === 'original' ? (
          <RoleSelectionOriginalDemo />
        ) : (
          <RoleSelectionEnhancedDemo />
        )}
      </div>
    </div>
  )
}