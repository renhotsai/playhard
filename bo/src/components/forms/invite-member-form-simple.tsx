"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { useInviteOrganizationMember, useOrganizationTeams } from "@/hooks/use-member-invitation";

// Form data type matching your API expectations
type InviteMemberFormData = {
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  teamIds?: string[];
};

// Simple validation functions
const validateName = (value: string) => {
  if (!value || value.trim().length < 2) return "Name must be at least 2 characters";
  if (value.trim().length > 100) return "Name cannot exceed 100 characters";
  return undefined;
};

const validateEmail = (value: string) => {
  if (!value || value.trim().length === 0) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) return "Please enter a valid email address";
  if (value.trim().length > 255) return "Email cannot exceed 255 characters";
  return undefined;
};

const validateRole = (value: string) => {
  if (!value) return "Please select a role";
  if (!["owner", "admin", "member"].includes(value)) return "Invalid role selected";
  return undefined;
};

interface InviteMemberFormSimpleProps {
  organizationId: string;
  onSuccess?: (data: { name: string; email: string; role: string }) => void;
  className?: string;
}

export function InviteMemberFormSimple({ 
  organizationId, 
  onSuccess, 
  className 
}: InviteMemberFormSimpleProps) {
  const { data: session } = useSession();
  
  // Use the custom hooks
  const inviteMemberMutation = useInviteOrganizationMember(organizationId);
  const { data: teamsData, isLoading: isTeamsLoading } = useQuery(
    useOrganizationTeams(organizationId)
  );

  // Initialize TanStack Form with simple validation
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "member" as const,
      teamIds: [] as string[],
    } satisfies InviteMemberFormData,
    onSubmit: async ({ value }) => {
      try {
        await inviteMemberMutation.mutateAsync(value);
        
        // Call success callback
        if (onSuccess) {
          onSuccess({
            name: value.name,
            email: value.email,
            role: value.role,
          });
        }

        // Reset form on success
        form.reset();
      } catch (error) {
        // Error handling is done in the mutation hook
        console.error('Form submission error:', error);
      }
    },
  });

  const availableTeams = teamsData?.teams || [];

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className={`space-y-4 max-w-md ${className}`}
    >
      {/* Name Field */}
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => validateName(value),
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Enter member's full name"
              disabled={inviteMemberMutation.isPending}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      {/* Email Field */}
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => validateEmail(value),
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Enter member's email address"
              disabled={inviteMemberMutation.isPending}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              An invitation email will be sent to this address
            </p>
          </div>
        )}
      />

      {/* Role Field */}
      <form.Field
        name="role"
        validators={{
          onChange: ({ value }) => validateRole(value),
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor="role">Organization Role *</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as "owner" | "admin" | "member")}
              disabled={inviteMemberMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member - Basic access</SelectItem>
                <SelectItem value="admin">Admin - Advanced permissions</SelectItem>
                <SelectItem value="owner">Owner - Full control</SelectItem>
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      {/* Team Assignment Field (Optional) */}
      {availableTeams.length > 0 && (
        <form.Field
          name="teamIds"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor="teams">Team Assignment (Optional)</Label>
              <Select
                value={field.state.value?.[0] || ""}
                onValueChange={(value) => {
                  if (value) {
                    field.handleChange([value]);
                  } else {
                    field.handleChange([]);
                  }
                }}
                disabled={inviteMemberMutation.isPending || isTeamsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isTeamsLoading ? "Loading teams..." : "Select a team (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No team assignment</SelectItem>
                  {availableTeams.map((team: any) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        />
      )}

      {/* Submit Button */}
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isFormSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isFormSubmitting || inviteMemberMutation.isPending}
            className="w-full"
          >
            {isFormSubmitting || inviteMemberMutation.isPending
              ? 'Sending Invitation...'
              : 'Send Invitation'}
          </Button>
        )}
      />
    </form>
  );
}