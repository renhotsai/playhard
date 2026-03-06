"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelect } from "@/components/ui/role-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { validators } from "@/lib/form-validators";
import type { OrganizationRole } from "@/lib/roles";

// Updated type definition for create user data with new role system
type CreateUserData = {
  name: string;
  email: string;
  role: OrganizationRole; // Now using the organized role types
  organizationId?: string;
  organizationName?: string;
};

type CreateUserInput = {
  name: string;
  email: string;
  role: OrganizationRole;
  organizationOption?: 'existing' | 'new';
  organizationId?: string;
  organizationName?: string;
};

interface CreateUserFormWithRoleSelectProps {
  onSuccess?: () => void;
}

/**
 * Updated Create User Form with new RoleSelect component
 * 
 * This demonstrates how to integrate the new RoleSelect component into
 * your existing create user form while maintaining all the existing
 * functionality for organization management.
 */
export function CreateUserFormWithRoleSelect({ onSuccess }: CreateUserFormWithRoleSelectProps) {
  const queryClient = useQueryClient();

  // Fetch organizations for select dropdown
  const { data: organizationsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: async () => {
      const response = await fetch('/api/organizations', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.system.users.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });

      // If organization was created, invalidate organizations list
      if (data.organization) {
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all() });
      }

      toast.success('User created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
      
      const errorMessage = error.message || 'Failed to create user';
      let displayMessage = errorMessage;
      
      if (errorMessage.includes('USER_EXISTS')) {
        displayMessage = 'User already exists with this email address. Please use a different email.';
      } else if (errorMessage.includes('INVALID_EMAIL')) {
        displayMessage = 'Please provide a valid email address.';
      } else if (errorMessage.includes('ORG_CREATION_FAILED')) {
        displayMessage = 'Failed to create organization. Please check the organization name and try again.';
      } else if (errorMessage.includes('PARTIAL_CREATION')) {
        displayMessage = 'User was created but organization setup failed. Please check the user list and set up organization manually.';
      }
      
      toast.error(displayMessage);
    },
  });

  // Initialize form
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "" as OrganizationRole,
      organizationOption: "existing" as 'existing' | 'new',
      organizationId: "",
      organizationName: "",
    } as CreateUserInput,
    validators: {
      // Form-level validation for cross-field dependencies
      onSubmit: ({ value }) => {
        // Role validation
        if (!value.role) {
          return {
            form: "Please select a role",
            fields: {
              role: "Role is required"
            }
          };
        }

        // Organization requirements based on role
        const requiresOrganization = ['owner', 'admin', 'gm', 'staff'].includes(value.role);
        
        if (requiresOrganization) {
          if (value.role === 'owner') {
            // Owner can create new org or join existing
            if (value.organizationOption === 'existing' && !value.organizationId) {
              return {
                form: "Must select an organization when joining existing organization",
                fields: {
                  organizationId: "Must select an organization"
                }
              };
            }
            if (value.organizationOption === 'new' && !value.organizationName) {
              return {
                form: "Must enter organization name when creating new organization",
                fields: {
                  organizationName: "Must enter organization name"
                }
              };
            }
          } else {
            // Other roles must join existing organization
            if (!value.organizationId) {
              return {
                form: "This role requires selecting an organization",
                fields: {
                  organizationId: "Must select an organization"
                }
              };
            }
          }
        }
        
        return undefined;
      }
    },
    onSubmit: async ({ value }) => {
      // Transform to CreateUserData format
      const createUserData: CreateUserData = {
        name: value.name,
        email: value.email,
        role: value.role,
        organizationId: value.organizationId,
        organizationName: value.organizationName,
      };
      
      createUserMutation.mutate(createUserData, {
        onSuccess: () => {
          form.reset();
          if (onSuccess) {
            onSuccess();
          }
        }
      });
    },
  });

  return (
    <form 
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-6 max-w-2xl"
      role="form"
      aria-label="Create new user form"
      noValidate
    >
      {/* Name Field */}
      <form.Field
        name="name"
        validators={{
          onBlur: ({ value }) => validators.name(value),
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter user's full name"
              aria-describedby={field.state.meta.errors.length > 0 ? "name-error" : undefined}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-required="true"
              data-testid="name-input"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive" id="name-error" role="alert">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Email Field */}
      <form.Field
        name="email"
        validators={{
          onBlur: ({ value }) => validators.email(value),
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter email address"
              aria-describedby={field.state.meta.errors.length > 0 ? "email-error" : undefined}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-required="true"
              data-testid="email-input"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive" id="email-error" role="alert">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Role Selection with New Component */}
      <form.Field
        name="role"
        validators={{
          onChange: ({ value }) => !value ? "Please select a role" : undefined,
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <RoleSelect
              value={field.state.value}
              onValueChange={(value) => {
                field.handleChange(value);
                
                // Reset organization fields when role changes
                form.setFieldValue('organizationId', '');
                form.setFieldValue('organizationName', '');
                
                // Set default organization option for owners
                if (value === 'owner') {
                  form.setFieldValue('organizationOption', 'new');
                } else {
                  form.setFieldValue('organizationOption', 'existing');
                }
              }}
              placeholder="Select a role for this user"
              aria-describedby={field.state.meta.errors.length > 0 ? "role-error" : "role-desc"}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-required="true"
              data-testid="role-select"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive" id="role-error" role="alert">
                {field.state.meta.errors[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground" id="role-desc">
              Choose the appropriate role based on the user's responsibilities
            </p>
          </div>
        )}
      </form.Field>

      {/* Organization Logic - Show when role requires organization */}
      <form.Subscribe
        selector={(state) => [state.values.role]}
      >
        {([selectedRole]) => {
          const requiresOrganization = selectedRole && ['owner', 'admin', 'gm', 'staff'].includes(selectedRole);
          
          if (!requiresOrganization) return null;

          return (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Organization Setup</h4>
              <p className="text-sm text-muted-foreground">
                This role requires organization membership. Choose how to handle organization assignment.
              </p>
              
              {/* Show organization options for owners */}
              {selectedRole === 'owner' && (
                <form.Field
                  name="organizationOption"
                  validators={{
                    onChange: ({ value }) => !value ? "Please select organization option" : undefined,
                  }}
                >
                  {(field) => (
                    <div className="space-y-3">
                      <Label>Organization Options *</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="existing"
                            checked={field.state.value === 'existing'}
                            onChange={() => {
                              field.handleChange('existing');
                              form.setFieldValue('organizationName', '');
                            }}
                            className="radio"
                          />
                          <span>Join existing organization</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="new"
                            checked={field.state.value === 'new'}
                            onChange={() => {
                              field.handleChange('new');
                              form.setFieldValue('organizationId', '');
                            }}
                            className="radio"
                          />
                          <span>Create new organization</span>
                        </label>
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive" role="alert">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              )}

              {/* Organization selection/creation fields based on choice */}
              {/* ... rest of organization fields similar to your existing form ... */}
            </div>
          );
        }}
      </form.Subscribe>

      {/* Submit Button */}
      <form.Subscribe
        selector={(state) => [state.canSubmit]}
      >
        {([canSubmit]) => (
          <Button 
            type="submit" 
            disabled={!canSubmit || createUserMutation.isPending}
            className="w-full"
            data-testid="submit-button"
          >
            {createUserMutation.isPending ? 'Creating user...' : 'Create User'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}