"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";


export function SetUsernameForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for invitation ID in URL
  useEffect(() => {
    const invitationId = searchParams.get('invitation');
    
    if (invitationId) {
      setPendingInvitation(invitationId);
      console.log('[SET-USERNAME] Found pending invitation:', invitationId);
    }
  }, [searchParams]);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        console.log('[SET-USERNAME] Starting account setup with:', { 
          username: value.username, 
          hasPendingInvitation: !!pendingInvitation
        });

        // Step 1: Verify current session before attempting updates
        console.log('[SET-USERNAME] Checking session status...');
        const session = await authClient.getSession();
        
        console.log('[SET-USERNAME] Session response:', {
          hasData: !!session.data,
          hasUser: !!session.data?.user,
          sessionData: session.data,
          sessionError: session.error
        });
        
        if (!session.data?.user) {
          console.error('[SET-USERNAME] No valid session found');
          console.error('[SET-USERNAME] Session details:', JSON.stringify(session, null, 2));
          toast.error("Session expired. Please try logging in again.");
          router.push("/login");
          return;
        }

        console.log('[SET-USERNAME] Valid session found for user:', session.data.user.email);
        console.log('[SET-USERNAME] User details:', {
          id: session.data.user.id,
          email: session.data.user.email,
          name: session.data.user.name,
          username: session.data.user.username,
          role: session.data.user.role
        });

        // Step 1a: Create a server-side API to update username and password
        // Using server-side approach to avoid client-side serialization issues
        console.log('[SET-USERNAME] Creating server API request to update user');
        
        const updateResponse = await fetch('/api/auth/update-user-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: value.username,
            password: value.password || null, // Include password if provided
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({ error: 'Failed to update profile' }));
          console.error('[SET-USERNAME] Server update error:', errorData);
          toast.error(errorData.error || 'Failed to update profile');
          return;
        }

        const updateResult = await updateResponse.json();
        console.log('[SET-USERNAME] Profile updated successfully:', updateResult);

        // Password handling is now done in the server API above

        // Step 3: Accept organization invitation if exists
        if (pendingInvitation) {
          console.log('[SET-USERNAME] Accepting organization invitation:', pendingInvitation);
          try {
            const { error: inviteError } = await authClient.organization.acceptInvitation({
              invitationId: pendingInvitation,
            });

            if (inviteError) {
              console.error('[SET-USERNAME] Failed to accept invitation:', inviteError);
              toast.error("Failed to join organization: " + inviteError.message);
            } else {
              console.log('[SET-USERNAME] Successfully accepted organization invitation');
              toast.success("Account setup completed! Successfully joined organization!");
            }
          } catch (inviteErr) {
            console.error('[SET-USERNAME] Invitation acceptance error:', inviteErr);
            toast.error("Failed to join organization");
          }
        } else {
          toast.success("Account setup completed successfully!");
        }
        
        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error("Set username error:", err);
        toast.error(err instanceof Error ? err.message : "Failed to complete account setup");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Complete Your Account</CardTitle>
        <CardDescription>
          {pendingInvitation 
            ? "Set your username and create your password to join the organization."
            : "Set your username and create your password to access the system."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.length < 3) {
                  return 'Username must be at least 3 characters';
                }
                if (value.length > 30) {
                  return 'Username cannot exceed 30 characters';
                }
                // Allow alphanumeric, underscore, hyphen, Chinese characters
                if (!/^[a-zA-Z0-9_\u4e00-\u9fff-]+$/.test(value)) {
                  return 'Username can only contain letters, numbers, Chinese characters, underscores, and hyphens';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Choose a username (3-30 characters)"
                  disabled={isSubmitting}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Password fields - all users need to set password from temp password */}
          <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    if (value.length > 128) {
                      return 'Password cannot exceed 128 characters';
                    }
                    // Check for at least one letter and one number
                    if (!/(?=.*[a-zA-Z])/.test(value)) {
                      return 'Password must contain at least one letter';
                    }
                    if (!/(?=.*[0-9])/.test(value)) {
                      return 'Password must contain at least one number';
                    }
                    // Password strength is sufficient with letters and numbers
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Create a secure password (8+ chars, letters & numbers)"
                      disabled={isSubmitting}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                    {field.state.value && field.state.meta.errors.length === 0 && (
                      <p className="text-sm text-green-600">
                        ✓ Password meets requirements
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="confirmPassword"
                validators={{
                  onChange: ({ value, fieldApi }) => {
                    if (!value) {
                      return 'Please confirm your password';
                    }
                    const password = fieldApi.form.getFieldValue('password');
                    if (value !== password) {
                      return 'Passwords do not match';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Confirm your password"
                      disabled={isSubmitting}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                    {field.state.value && field.state.meta.errors.length === 0 && field.state.value.length > 0 && (
                      <p className="text-sm text-green-600">
                        ✓ Passwords match
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isFormSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting || isFormSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Setting up account...' : 
                  (pendingInvitation ? 'Set Password & Join Organization' : 'Set Password & Complete Setup')
                }
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}