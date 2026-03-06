"use client";

import React from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelect, useRoleInfo } from "@/components/ui/role-select";
import type { OrganizationRole } from "@/lib/roles";
import { validators } from "@/lib/form-validators";

/**
 * Demo Form Component showing RoleSelect integration
 * 
 * This demonstrates how to integrate the RoleSelect component with TanStack Form
 * and shows the proper patterns for validation, error handling, and accessibility.
 */

type CreateUserFormData = {
  name: string;
  email: string;
  role: OrganizationRole;
};

interface RoleSelectDemoProps {
  onSubmit?: (data: CreateUserFormData) => void;
}

export function RoleSelectDemo({ onSubmit }: RoleSelectDemoProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "" as OrganizationRole,
    } as CreateUserFormData,
    validators: {
      // Form-level validation
      onSubmit: ({ value }) => {
        if (!value.role) {
          return {
            form: "Please select a role",
            fields: {
              role: "Role is required"
            }
          };
        }
        return undefined;
      }
    },
    onSubmit: async ({ value }) => {
      console.log("Form submitted with data:", value);
      onSubmit?.(value);
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Role Selection Demo</h2>
        <p className="text-muted-foreground">
          Demo showing the RoleSelect component integrated with TanStack Form
        </p>
      </div>

      <form 
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
        className="space-y-6"
        role="form"
        aria-label="Create user with role selection"
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

        {/* Role Selection Field */}
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
                onValueChange={(value) => field.handleChange(value)}
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

        {/* Selected Role Info Display */}
        <form.Subscribe
          selector={(state) => [state.values.role]}
        >
          {([selectedRole]) => {
            const roleInfo = useRoleInfo(selectedRole);
            
            if (!roleInfo) return null;
            
            return (
              <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
                <h4 className="font-medium">Selected Role Details</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Role:</span> {roleInfo.displayName}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span> {roleInfo.categoryLabel}
                  </p>
                  <p>
                    <span className="font-medium">Description:</span> {roleInfo.description}
                  </p>
                </div>
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
              disabled={!canSubmit}
              className="w-full"
              data-testid="submit-button"
            >
              Create User
            </Button>
          )}
        </form.Subscribe>
      </form>

      {/* Form State Debug (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <form.Subscribe>
          {(state) => (
            <details className="mt-8 p-4 border rounded-lg bg-muted/30">
              <summary className="cursor-pointer font-medium">
                Form State (Development Debug)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(state.values, null, 2)}
              </pre>
            </details>
          )}
        </form.Subscribe>
      )}
    </div>
  );
}