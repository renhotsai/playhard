'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { HierarchicalRoleForm, useHierarchicalRoleForm } from './hierarchical-role-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationKeys } from '@/lib/query-keys'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

// ============================================================================
// API Functions
// ============================================================================

async function createUserWithRole(data: {
  name: string
  email: string
  description?: string
  roleSelection: {
    selectedCategory: 'system' | 'organization' | null
    selectedRole: string | null
    selectedOrganization: string | null
    currentStep: 'category' | 'role'
  }
}) {
  const { roleSelection, ...userData } = data
  
  // For system admin creation
  if (roleSelection.selectedCategory === 'system') {
    const response = await fetch('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        name: userData.name,
        // System admins don't need organization
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create system admin')
    }
    
    return response.json()
  }
  
  // For organization member creation
  if (roleSelection.selectedCategory === 'organization' && roleSelection.selectedOrganization) {
    // First create the user via Better Auth
    const userResult = await authClient.signUp.email({
      email: userData.email,
      name: userData.name,
      password: Math.random().toString(36), // Temporary password, user will set via magic link
    })
    
    if (!userResult.data) {
      throw new Error('Failed to create user account')
    }
    
    // Then invite them to the organization with the selected role
    const inviteResult = await authClient.organization.inviteMember({
      organizationId: roleSelection.selectedOrganization,
      email: userData.email,
      role: mapRoleTypeToMemberRole(roleSelection.selectedRole),
    })
    
    return {
      user: userResult.data,
      invitation: inviteResult.data
    }
  }
  
  throw new Error('Invalid role selection configuration')
}

/**
 * Map hierarchical role types to Better Auth member roles
 */
function mapRoleTypeToMemberRole(roleType: string | null): 'owner' | 'admin' | 'member' {
  switch (roleType) {
    case 'organization_owner':
      return 'owner'
    case 'organization_admin':
      return 'admin'
    case 'game_master':
    case 'game_staff':
    case 'game_player':
      return 'member'
    default:
      return 'member'
  }
}

// ============================================================================
// Main Component
// ============================================================================

interface CreateUserWithHierarchicalRoleProps {
  /** Optional organization ID to pre-select */
  organizationId?: string
  /** Optional role category to pre-select */
  defaultCategory?: 'system' | 'organization'
  /** Callback when user is successfully created */
  onSuccess?: () => void
  /** Callback when user cancels creation */
  onCancel?: () => void
}

export function CreateUserWithHierarchicalRole({
  organizationId,
  defaultCategory,
  onSuccess,
  onCancel
}: CreateUserWithHierarchicalRoleProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: createUserWithRole,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: organizationKeys.all() })
      
      // Show success message
      if (data.invitation) {
        toast.success('User invited to organization successfully!')
      } else {
        toast.success('System admin created successfully!')
      }
      
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/users')
      }
    },
    onError: (error) => {
      console.error('Failed to create user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
    }
  })
  
  // Form state management
  const { isSubmitting, handleSubmit, defaultValues } = useHierarchicalRoleForm({
    defaultValues: {
      name: '',
      email: '',
      description: '',
      roleSelection: {
        selectedCategory: defaultCategory || null,
        selectedRole: null,
        selectedOrganization: organizationId || null,
        currentStep: 'category' as const
      }
    },
    onSubmit: createUserMutation.mutateAsync
  })
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <HierarchicalRoleForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={onCancel || (() => router.back())}
        isSubmitting={isSubmitting || createUserMutation.isPending}
        title="Create User"
        submitText="Create User"
      />
    </div>
  )
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Create user for specific organization
 */
export function CreateOrganizationMember({ organizationId }: { organizationId: string }) {
  return (
    <CreateUserWithHierarchicalRole 
      organizationId={organizationId}
      defaultCategory="organization"
    />
  )
}

/**
 * Example 2: Create system admin
 */
export function CreateSystemAdmin() {
  return (
    <CreateUserWithHierarchicalRole 
      defaultCategory="system"
    />
  )
}

/**
 * Example 3: Generic user creation with all options
 */
export function CreateUserPage() {
  const router = useRouter()
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
        <p className="text-muted-foreground mt-2">
          Create a new user account and assign appropriate role permissions
        </p>
      </div>
      
      <CreateUserWithHierarchicalRole 
        onSuccess={() => {
          router.push('/dashboard/users')
        }}
        onCancel={() => {
          router.back()
        }}
      />
    </div>
  )
}

export default CreateUserWithHierarchicalRole