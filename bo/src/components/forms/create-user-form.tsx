"use client";

import React, { memo } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HierarchicalRoleSelection } from "@/components/forms/hierarchical-role-selection/hierarchical-role-selection";
import { validators } from "@/lib/form-validators";
import { cn } from "@/lib/utils";
import type { 
  CreateUserFormProps, 
  CreateUserFormData,
  FormValidationErrors 
} from "@/types/form-types";
import type { 
  RoleCategory, 
  RoleType, 
  SelectionStep, 
  HierarchicalValidationResult 
} from "@/types/hierarchical-roles";

/**
 * CreateUserForm Component
 * 
 * A comprehensive form for creating new users with hierarchical role selection.
 * Built with TanStack Form for state management and validation.
 * Integrates with HierarchicalRoleSelection for role assignment.
 * 
 * Features:
 * - Real-time form validation
 * - Hierarchical role selection
 * - Accessibility compliant
 * - Loading and error states
 * - Initial values support
 */
export const CreateUserForm = memo(function CreateUserForm({
  onSubmit,
  onCancel,
  loading = false,
  disabled = false,
  error = null,
  initialValues,
  className,
  'data-testid': dataTestId = 'create-user-form'
}: CreateUserFormProps) {
  // Form validation state
  const [roleValidation, setRoleValidation] = React.useState<HierarchicalValidationResult | null>(null);

  // Initialize TanStack Form
  const form = useForm({
    defaultValues: {
      name: initialValues?.name || "",
      email: initialValues?.email || "",
      roleData: {
        selectedCategory: initialValues?.roleData?.selectedCategory || null,
        selectedRole: initialValues?.roleData?.selectedRole || null,
        selectedOrganization: initialValues?.roleData?.selectedOrganization || null,
        currentStep: initialValues?.roleData?.currentStep || 'category' as SelectionStep
      }
    } as CreateUserFormData,
    validators: {
      // Form-level validation
      onChange: ({ value }) => {
        const errors: FormValidationErrors = {};
        
        // Validate name
        const nameError = validators.name(value.name);
        if (nameError) errors.name = nameError;
        
        // Validate email
        const emailError = validators.email(value.email);
        if (emailError) errors.email = emailError;
        
        // Validate role data
        if (!value.roleData?.selectedRole) {
          errors.roleData = "Please select a role";
        }
        
        return Object.keys(errors).length > 0 ? errors : undefined;
      }
    },
    onSubmit: async ({ value }) => {
      // Final validation before submission
      if (!value.roleData?.selectedRole) {
        throw new Error("Role selection is required");
      }
      
      onSubmit(value);
    }
  });

  // Handle role selection change
  const handleRoleDataChange = React.useCallback((roleData: {
    selectedCategory: RoleCategory | null;
    selectedRole: RoleType | null;
    selectedOrganization: string | null;
    currentStep: SelectionStep;
  }) => {
    form.setFieldValue('roleData', roleData);
  }, [form]);

  // Handle role validation change
  const handleRoleValidationChange = React.useCallback((validation: HierarchicalValidationResult) => {
    setRoleValidation(validation);
  }, []);

  // Handle cancel
  const handleCancel = React.useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  return (
    <div className={className} data-testid={dataTestId}>
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle data-testid="card-title">Create New User</CardTitle>
        <CardDescription data-testid="card-description">
          Create a new user account and assign their role and permissions
        </CardDescription>
      </CardHeader>

      <CardContent data-testid="card-content">
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-6"
          data-testid="form"
          noValidate
          aria-label="Create new user form"
        >
          {/* Form-level error */}
          {error && (
            <Alert variant="destructive" data-testid="alert" data-variant="destructive">
              <AlertDescription data-testid="alert-description">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => validators.name(value),
              onBlur: ({ value }) => validators.name(value),
            }}
          >
            {(field) => (
              <div className="space-y-2" data-testid="form-field-name">
                <div data-testid="form-item">
                  <label 
                    htmlFor="name" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    data-testid="form-label"
                  >
                    Full Name
                  </label>
                  <div data-testid="form-control">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter full name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      disabled={disabled || loading}
                      className={cn(
                        field.state.meta.errors.length > 0 && "border-destructive focus-visible:ring-destructive"
                      )}
                      data-testid="input"
                      aria-describedby={field.state.meta.errors.length > 0 ? "name-error" : undefined}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-required="true"
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <div 
                      id="name-error"
                      className="text-sm font-medium text-destructive" 
                      data-testid="form-message"
                      role="alert"
                    >
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form.Field>

          {/* Email Field */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => validators.email(value),
              onBlur: ({ value }) => validators.email(value),
            }}
          >
            {(field) => (
              <div className="space-y-2" data-testid="form-field-email">
                <div data-testid="form-item">
                  <label 
                    htmlFor="email" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    data-testid="form-label"
                  >
                    Email Address
                  </label>
                  <div data-testid="form-control">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      disabled={disabled || loading}
                      className={cn(
                        field.state.meta.errors.length > 0 && "border-destructive focus-visible:ring-destructive"
                      )}
                      data-testid="input"
                      aria-describedby={field.state.meta.errors.length > 0 ? "email-error" : undefined}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-required="true"
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <div 
                      id="email-error"
                      className="text-sm font-medium text-destructive" 
                      data-testid="form-message"
                      role="alert"
                    >
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form.Field>

          {/* Role Selection Field */}
          <form.Field
            name="roleData"
            validators={{
              onChange: ({ value }) => {
                if (!value?.selectedRole) {
                  return "Please select a role";
                }
                return undefined;
              }
            }}
          >
            {(field) => (
              <div className="space-y-2" data-testid="form-field-roleData">
                <div data-testid="form-item">
                  <label 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    data-testid="form-label"
                  >
                    Role Assignment
                  </label>
                  <div data-testid="form-control">
                    <HierarchicalRoleSelection
                      value={field.state.value}
                      onChange={handleRoleDataChange}
                      onValidationChange={handleRoleValidationChange}
                      disabled={disabled}
                      loading={loading}
                      error={field.state.meta.errors[0] || null}
                      showSearch={false}
                      showProgress={true}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <div 
                      className="text-sm font-medium text-destructive" 
                      data-testid="form-message"
                      role="alert"
                    >
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form.Field>
        </form>
      </CardContent>

      <CardFooter className="flex gap-3" data-testid="card-footer">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <>
              <Button
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  await form.handleSubmit();
                }}
                disabled={!canSubmit || isSubmitting || loading || disabled || !roleValidation?.isValid}
                className="flex-1"
                data-testid="button"
              >
                {loading || isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting || loading}
                  data-testid="button"
                >
                  Cancel
                </Button>
              )}
            </>
          )}
        </form.Subscribe>
      </CardFooter>
    </Card>
    </div>
  );
});