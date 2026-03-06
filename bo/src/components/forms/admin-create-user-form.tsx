"use client";

import React from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { OrganizationSelector } from "@/components/forms/organization-selector";
import { RoleSelectionSections } from "@/components/forms/role-selection-sections";
import { 
  User, 
  Mail, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { 
  validators, 
  asyncValidators, 
  murderMysteryValidators,
  tanstackFormUtils 
} from "@/lib/form-validators";
import { 
  type RoleType,
  isOrganizationRole,
  getRoleDefinition,
  getRoleSpecificSuccessMessage
} from "@/types/role-sections";
import { validateRoleSelection } from "@/lib/role-section-utils";

// Form data type definition
export interface CreateUserFormData {
  name: string;
  email: string;
  roleType: RoleType;
  organizationId?: string;
}

// API submission data type
interface CreateUserSubmissionData {
  name: string;
  email: string;
  roleType: RoleType;
  organizationId?: string;
}

interface AdminCreateUserFormProps {
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Comprehensive Admin Create User Form using TanStack Form v5
 * 
 * Features:
 * - Field-level validation with existing validators
 * - Async email validation for uniqueness
 * - Cross-field conditional validation
 * - Real-time form summary
 * - Role-based conditional display logic
 * - Optimistic updates and error handling
 * - Full TypeScript integration
 * - Accessibility support
 */
export function AdminCreateUserForm({ 
  onSuccess, 
  onCancel, 
  className 
}: AdminCreateUserFormProps) {
  const queryClient = useQueryClient();

  // Create user mutation with optimistic updates
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserSubmissionData) => {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries for optimistic updates
      queryClient.invalidateQueries({ queryKey: queryKeys.system.users.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      
      if (data.organization) {
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all() });
      }

      // Generate role-specific success message
      const userName = data.user?.name || 'User';
      const organizationName = data.organization?.name;
      const roleType = data.user?.roleType || data.roleType;
      
      const successMessage = getRoleSpecificSuccessMessage(
        roleType, 
        userName, 
        organizationName
      );

      toast.success(successMessage.title, {
        description: successMessage.description
      });

      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('[AdminCreateUserForm] Failed to create user:', error);
      
      // Enhanced error message handling
      const errorMessage = error.message || 'Failed to create user';
      let displayMessage = errorMessage;
      
      if (errorMessage.includes('EMAIL_EXISTS') || errorMessage.includes('USER_EXISTS')) {
        displayMessage = 'A user with this email address already exists. Please use a different email.';
      } else if (errorMessage.includes('INVALID_EMAIL')) {
        displayMessage = 'Please provide a valid email address.';
      } else if (errorMessage.includes('ORGANIZATION_NOT_FOUND')) {
        displayMessage = 'The selected organization could not be found. Please try again.';
      } else if (errorMessage.includes('INVALID_ROLE')) {
        displayMessage = 'The selected role is not valid for this user type.';
      } else if (errorMessage.includes('PERMISSION_DENIED')) {
        displayMessage = 'You do not have permission to create users with this role.';
      }
      
      toast.error('Failed to create user', {
        description: displayMessage
      });
    },
  });

  // Initialize TanStack Form with comprehensive validation
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      roleType: "" as RoleType,
      organizationId: "",
    } satisfies CreateUserFormData,
    
    validators: {
      // Form-level validation for cross-field dependencies
      onSubmit: ({ value }) => {
        const errors: Record<string, string> = {};
        
        // Validate basic fields
        const nameError = validators.name(value.name);
        if (nameError) errors.name = nameError;
        
        const emailError = validators.email(value.email);
        if (emailError) errors.email = emailError;
        
        // Validate role type
        if (!value.roleType) {
          errors.roleType = "Role selection is required";
        } else {
          const roleValidation = validateRoleSelection(value.roleType);
          if (!roleValidation.isValid) {
            errors.roleType = roleValidation.errors[0];
          }
        }
        
        // Validate organization fields for organization roles
        if (isOrganizationRole(value.roleType)) {
          const orgIdError = murderMysteryValidators.organizationId(
            value.organizationId || '', 
            true
          );
          if (orgIdError) errors.organizationId = orgIdError;
        }
        
        if (Object.keys(errors).length > 0) {
          return {
            form: "Please fix the validation errors below",
            fields: errors
          };
        }
        
        return undefined;
      }
    },
    
    onSubmit: async ({ value }) => {
      // Transform form data for API submission
      const submissionData: CreateUserSubmissionData = {
        name: value.name.trim(),
        email: value.email.trim().toLowerCase(),
        roleType: value.roleType,
        ...(isOrganizationRole(value.roleType) && {
          organizationId: value.organizationId,
        })
      };
      
      await createUserMutation.mutateAsync(submissionData);
      form.reset();
    },
  });

  // Helper function to determine if organization fields should be shown
  const shouldShowOrganizationFields = (roleType: string) => {
    return roleType ? isOrganizationRole(roleType as RoleType) : false;
  };

  return (
    <div className={className}>
      <form 
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
        className="space-y-6"
        role="form"
        aria-label="Create new user form"
        noValidate
      >
        {/* Form Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Create New User
            </CardTitle>
            <CardDescription>
              Add a new user to the system with appropriate role and organization assignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              {/* Name Field */}
              <form.Field
                name="name"
                validators={{
                  onBlur: ({ value }) => validators.name(value),
                  onChange: ({ value }) => validators.name(value),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter user's full name"
                      aria-describedby={field.state.meta.errors.length > 0 ? "name-error" : "name-help"}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-required="true"
                      data-testid="name-input"
                      disabled={createUserMutation.isPending}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive flex items-center gap-1" id="name-error" role="alert">
                        <AlertCircle className="h-3 w-3" />
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                    {field.state.meta.errors.length === 0 && (
                      <p className="text-xs text-muted-foreground" id="name-help">
                        The user's display name in the system
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Email Field with Async Validation */}
              <form.Field
                name="email"
                validators={{
                  onBlur: ({ value }) => validators.email(value),
                  onChangeAsync: tanstackFormUtils.createAsyncValidator(
                    async (value: string) => {
                      if (!value || !validators.email(value)) {
                        return asyncValidators.uniqueEmail(value);
                      }
                      return undefined;
                    },
                    500
                  ),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter email address"
                        aria-describedby={field.state.meta.errors.length > 0 ? "email-error" : "email-help"}
                        aria-invalid={field.state.meta.errors.length > 0}
                        aria-required="true"
                        data-testid="email-input"
                        disabled={createUserMutation.isPending}
                      />
                      {field.state.meta.isValidating && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive flex items-center gap-1" id="email-error" role="alert">
                        <AlertCircle className="h-3 w-3" />
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                    {field.state.meta.errors.length === 0 && (
                      <p className="text-xs text-muted-foreground" id="email-help">
                        Must be a unique, valid email address
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            <Separator />

            {/* Role Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Role Selection</h3>
              
              <form.Field
                name="roleType"
                validators={{
                  onChange: ({ value }) => {
                    // Don't validate empty values - let user select first
                    if (!value) return undefined;
                    const validation = validateRoleSelection(value as RoleType);
                    return validation.isValid ? undefined : validation.errors[0];
                  },
                }}
              >
                {(field) => (
                  <RoleSelectionSections
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(value);
                      
                      // Reset organization fields when role type changes
                      form.setFieldValue('organizationId', '');
                    }}
                    disabled={createUserMutation.isPending}
                    error={field.state.meta.errors[0]}
                    data-testid="role-selection-sections"
                  />
                )}
              </form.Field>
            </div>

            {/* Conditional Organization Section */}
            <form.Subscribe
              selector={(state) => [state.values.roleType]}
            >
              {([roleType]) => {
                if (!shouldShowOrganizationFields(roleType)) return null;

                return (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <h3 className="text-lg font-medium">Organization Assignment</h3>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Organization users require both an organization and a role within that organization.
                        </AlertDescription>
                      </Alert>

                      {/* Organization Selection */}
                      <form.Field
                        name="organizationId"
                        validators={{
                          onChange: ({ value, formApi }) => {
                            const formData = formApi.getFieldValue('') as CreateUserFormData;
                            return murderMysteryValidators.organizationId(
                              value, 
                              shouldShowOrganizationFields(formData.roleType)
                            );
                          },
                        }}
                      >
                        {(field) => (
                          <OrganizationSelector
                            value={field.state.value}
                            onValueChange={(value) => field.handleChange(value)}
                            required={true}
                            label="Organization"
                            placeholder="Select organization"
                            helpText="Choose the organization this user will belong to"
                            error={field.state.meta.errors[0]}
                            disabled={createUserMutation.isPending}
                            data-testid="organization-selector"
                            aria-describedby={field.state.meta.errors.length > 0 ? "organization-error" : undefined}
                            aria-invalid={field.state.meta.errors.length > 0}
                          />
                        )}
                      </form.Field>

                    </div>
                  </>
                );
              }}
            </form.Subscribe>

            {/* Form Summary */}
            <form.Subscribe
              selector={(state) => [
                state.values.name,
                state.values.email,
                state.values.roleType,
                state.canSubmit,
                state.isValid
              ]}
            >
              {([name, email, roleType, canSubmit, isValid]) => {
                if (!name && !email && !roleType) return null;

                return (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Summary</h3>
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {name && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  <strong>Name:</strong> {name}
                                </span>
                              </div>
                            )}
                            {email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  <strong>Email:</strong> {email}
                                </span>
                              </div>
                            )}
                            {roleType && (() => {
                              const roleDefinition = getRoleDefinition(roleType);
                              if (!roleDefinition) return null;
                              
                              return (
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    <strong>Role:</strong> 
                                    <Badge 
                                      variant={roleDefinition.badge?.variant || 'secondary'}
                                      className="ml-2"
                                    >
                                      {roleDefinition.badge?.text || roleDefinition.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {roleDefinition.description}
                                    </span>
                                  </span>
                                </div>
                              );
                            })()}
                            
                            {/* Validation Status */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              {isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                              )}
                              <span className="text-sm text-muted-foreground">
                                {isValid ? 'Ready to create user' : 'Please complete all required fields'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                );
              }}
            </form.Subscribe>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createUserMutation.isPending}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          )}
          
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button 
                type="submit" 
                disabled={!canSubmit || createUserMutation.isPending}
                data-testid="submit-button"
                className="min-w-[120px]"
              >
                {createUserMutation.isPending || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}