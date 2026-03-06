'use client';

/**
 * Admin User Creation Page
 * 
 * Provides an interface for system admins to create new users with hierarchical role selection.
 * Integrates CreateUserForm component with TanStack Query for server state management.
 * 
 * Features:
 * - Next.js 15 App Router page component
 * - Breadcrumb navigation
 * - Form submission with API integration
 * - Error handling and loading states
 * - Success/error toast notifications
 * - Navigation back to users list on success
 */

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Components
import { CreateUserForm } from '@/components/forms/create-user-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

// Hooks and utilities
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementKeys } from '@/hooks/use-user-management';

// Types
import type { CreateUserFormData } from '@/types/form-types';
import type { RoleType } from '@/types/hierarchical-roles';

/**
 * Transform hierarchical form data to API format
 */
function transformFormDataToApiRequest(formData: CreateUserFormData): {
  email: string;
  name: string;
  userType: 'system_admin' | 'organization_user';
  organizationId?: string;
  organizationRole?: 'owner' | 'admin' | 'supervisor' | 'employee';
} {
  const { name, email, roleData } = formData;
  
  // Map role types to API format
  const roleTypeMapping: Record<RoleType, {
    userType: 'system_admin' | 'organization_user';
    organizationRole?: 'owner' | 'admin' | 'supervisor' | 'employee';
  }> = {
    // System roles - all map to system_admin userType
    'super_admin': { userType: 'system_admin' },
    'platform_manager': { userType: 'system_admin' },
    'support_agent': { userType: 'system_admin' },
    'developer': { userType: 'system_admin' },
    // Organization roles
    'organization_owner': { userType: 'organization_user', organizationRole: 'owner' },
    'organization_admin': { userType: 'organization_user', organizationRole: 'admin' },
    'game_master': { userType: 'organization_user', organizationRole: 'supervisor' },
    'game_staff': { userType: 'organization_user', organizationRole: 'employee' },
    'game_player': { userType: 'organization_user', organizationRole: 'employee' }
  };

  const mapping = roleTypeMapping[roleData.selectedRole as RoleType];
  
  if (!mapping) {
    throw new Error('Invalid role type selected');
  }

  const apiRequest = {
    email: email.trim(),
    name: name.trim(),
    userType: mapping.userType
  };

  // Add organization details for organization users
  if (mapping.userType === 'organization_user') {
    return {
      ...apiRequest,
      organizationId: roleData.selectedOrganization || undefined,
      organizationRole: mapping.organizationRole
    };
  }

  return apiRequest;
}

/**
 * Custom hook for creating users with the hierarchical form data
 */
function useCreateUserWithHierarchicalData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (apiRequest: {
      email: string;
      name: string;
      userType: 'system_admin' | 'organization_user';
      organizationId?: string;
      organizationRole?: 'owner' | 'admin' | 'supervisor' | 'employee';
    }) => {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequest),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || error.error || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all user lists to refresh data
      queryClient.invalidateQueries({ queryKey: userManagementKeys.systemUsers() });
    },
  });
}

/**
 * Admin User Creation Page Component
 */
export default function CreateUserPage() {
  const router = useRouter();
  const createUserMutation = useCreateUserWithHierarchicalData();

  // Handle form submission
  const handleSubmit = useCallback(async (formData: CreateUserFormData) => {
    try {
      // Transform form data to API format
      const apiRequest = transformFormDataToApiRequest(formData);
      
      // Submit to API
      const result = await createUserMutation.mutateAsync(apiRequest);
      
      if (result.success) {
        // Show success toast
        const userType = apiRequest.userType === 'system_admin' ? 'System Admin' : 'Organization User';
        toast.success(
          `${userType} created successfully`,
          {
            description: result.message || 'Authentication email has been sent.',
            duration: 5000
          }
        );
        
        // Navigate back to users list
        router.push('/dashboard/admin/users');
      } else {
        // Handle API error response
        throw new Error(result.error?.message || 'Failed to create user');
      }
    } catch (error) {
      // Handle submission error
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(
        'Failed to create user',
        {
          description: errorMessage,
          duration: 7000
        }
      );
      
      // Log error for debugging
      console.error('User creation error:', error);
    }
  }, [createUserMutation, router]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    router.push('/dashboard/admin/users');
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/admin/users">Users</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Create</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/admin/users">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Users
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Plus className="h-8 w-8" />
            Create New User
          </h1>
          <p className="text-muted-foreground">
            Create a new user account and assign their role and permissions in the system.
          </p>
        </div>
        
        {/* Quick Stats */}
        <Card className="w-48">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Create system admins or organization users with appropriate roles and permissions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <CreateUserForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={createUserMutation.isPending}
            disabled={createUserMutation.isPending}
            error={createUserMutation.error?.message || null}
            data-testid="create-user-page-form"
          />
        </div>
      </div>

      {/* Help Text */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">User Creation Guidelines</CardTitle>
          <CardDescription>
            Important information about creating users in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-sm mb-2">System Administrators</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full access to all system features</li>
                <li>• Can manage all organizations and users</li>
                <li>• Receive magic link authentication email</li>
                <li>• Cannot be deleted by other admins</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Organization Users</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Must be assigned to an organization</li>
                <li>• Role determines permissions within organization</li>
                <li>• Receive invitation email to join organization</li>
                <li>• Can be managed by organization owners</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Authentication Process</h4>
            <p className="text-sm text-muted-foreground">
              All newly created users receive an email with authentication instructions. 
              System admins get a magic link for immediate access, while organization users 
              receive an invitation link to join their assigned organization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}