"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Users, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useSession, useListOrganizations } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

// Zod schema for form validation
const inviteMemberSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email cannot exceed 255 characters")
    .trim(),
  role: z.enum(["owner", "admin", "member"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
  teamIds: z
    .array(z.string())
    .optional()
    .default([]),
});

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface InviteMemberFormProps {
  organizationId: string;
  onSuccess?: (data: { name: string; email: string; role: string }) => void;
  onCancel?: () => void;
  className?: string;
}

// Multi-select Team component
function TeamMultiSelect({
  selectedTeams,
  availableTeams,
  onTeamToggle,
  isLoading,
}: {
  selectedTeams: string[];
  availableTeams: Team[];
  onTeamToggle: (teamId: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse bg-muted h-10 rounded-md" />
        <div className="animate-pulse bg-muted h-8 rounded-md w-3/4" />
      </div>
    );
  }

  if (availableTeams.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-md">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        No teams available in this organization
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected teams display */}
      {selectedTeams.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTeams.map((teamId) => {
            const team = availableTeams.find((t) => t.id === teamId);
            return (
              team && (
                <Badge key={teamId} variant="secondary" className="text-xs">
                  {team.name}
                  <button
                    type="button"
                    onClick={() => onTeamToggle(teamId)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    aria-label={`Remove ${team.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            );
          })}
        </div>
      )}

      {/* Team selection checkboxes */}
      <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
        {availableTeams.map((team) => {
          const isSelected = selectedTeams.includes(team.id);
          return (
            <div
              key={team.id}
              className={cn(
                "flex items-start space-x-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                isSelected && "bg-muted"
              )}
              onClick={() => onTeamToggle(team.id)}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onTeamToggle(team.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {team.name}
                </div>
                {team.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {team.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InviteMemberForm({
  organizationId,
  onSuccess,
  onCancel,
  className,
}: InviteMemberFormProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch available teams for the organization
  const { data: teamsData, isLoading: isTeamsLoading } = useQuery({
    queryKey: queryKeys.teams.byOrganization(organizationId),
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/teams`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return response.json();
    },
    enabled: !!organizationId,
  });

  // Mutation for inviting members
  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteMemberFormData) => {
      const response = await fetch(`/api/organizations/${organizationId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to invite member');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId),
      });

      toast.success(`Successfully invited ${variables.name} to join the organization!`);
      
      if (onSuccess) {
        onSuccess({
          name: variables.name,
          email: variables.email,
          role: variables.role,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Initialize form with TanStack Form + Zod validation
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "member" as const,
      teamIds: [] as string[],
    } satisfies InviteMemberFormData,
    validatorAdapter: zodValidator,
    validators: {
      onChange: inviteMemberSchema,
    },
    onSubmit: async ({ value }) => {
      await inviteMemberMutation.mutateAsync(value);
    },
  });

  const availableTeams = teamsData?.teams || [];

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Invite Team Member</CardTitle>
        </div>
        <CardDescription>
          Send an invitation to join your organization. The invited user will receive an email with instructions to accept.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Name Field */}
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </Label>
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
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  An invitation email will be sent to this address
                </p>
              </div>
            )}
          />

          {/* Role Field */}
          <form.Field
            name="role"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Organization Role *
                </Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as InviteMemberFormData["role"])}
                  disabled={inviteMemberMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex flex-col items-start">
                        <span>Member</span>
                        <span className="text-xs text-muted-foreground">
                          Basic access and permissions
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col items-start">
                        <span>Admin</span>
                        <span className="text-xs text-muted-foreground">
                          Advanced permissions and team management
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="owner">
                      <div className="flex flex-col items-start">
                        <span>Owner</span>
                        <span className="text-xs text-muted-foreground">
                          Full organizational control
                        </span>
                      </div>
                    </SelectItem>
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

          {/* Team Assignment Field */}
          <form.Field
            name="teamIds"
            children={(field) => (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Team Assignment (Optional)
                </Label>
                <TeamMultiSelect
                  selectedTeams={field.state.value}
                  availableTeams={availableTeams}
                  onTeamToggle={(teamId) => {
                    const currentTeams = field.state.value;
                    const newTeams = currentTeams.includes(teamId)
                      ? currentTeams.filter((id) => id !== teamId)
                      : [...currentTeams, teamId];
                    field.handleChange(newTeams);
                  }}
                  isLoading={isTeamsLoading}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Select teams to assign the member to (can be changed later)
                </p>
              </div>
            )}
          />

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isFormSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isFormSubmitting || inviteMemberMutation.isPending}
                  className="flex-1 sm:flex-initial"
                >
                  {isFormSubmitting || inviteMemberMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              )}
            />
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={inviteMemberMutation.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}