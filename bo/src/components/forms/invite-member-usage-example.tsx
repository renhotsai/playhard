"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteMemberForm } from "./invite-member-form";
import { InviteMemberFormSimple } from "./invite-member-form-simple";
import { UserPlus, Users } from "lucide-react";
import { useSession } from "@/lib/auth-client";

/**
 * Example usage of the InviteMemberForm components
 * This demonstrates different usage patterns and integration approaches
 */
export function InviteMemberUsageExample() {
  const { data: session } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Example organization ID - in real app, get from context or props
  const organizationId = session?.user?.activeOrganization?.id || "example-org-id";

  const handleSuccess = (data: { name: string; email: string; role: string }) => {
    console.log("Member invited successfully:", data);
    setIsDialogOpen(false);
    // You could also show a success toast, redirect, or update UI here
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Usage Example 1: Full Featured Form in a Dialog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Full Featured Form (Dialog)
          </CardTitle>
          <CardDescription>
            Complete form with team multi-select, rich UI, and dialog wrapper
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member (Full)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Invite Organization Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization with team assignment options.
                </DialogDescription>
              </DialogHeader>
              <InviteMemberForm
                organizationId={organizationId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                className="border-none shadow-none"
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Usage Example 2: Simple Form Inline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Simple Form (Inline)
          </CardTitle>
          <CardDescription>
            Streamlined form for basic member invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberFormSimple
            organizationId={organizationId}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to integrate these forms in your components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h4 className="text-sm font-medium mb-2">Basic Usage:</h4>
            <pre className="text-sm overflow-x-auto">
{`import { InviteMemberFormSimple } from "@/components/forms/invite-member-form-simple";

function MyComponent() {
  const organizationId = "your-org-id";
  
  const handleSuccess = (data) => {
    console.log("Member invited:", data);
    // Handle success (close modal, show toast, etc.)
  };

  return (
    <InviteMemberFormSimple
      organizationId={organizationId}
      onSuccess={handleSuccess}
    />
  );
}`}
            </pre>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h4 className="text-sm font-medium mb-2">Full Featured Usage:</h4>
            <pre className="text-sm overflow-x-auto">
{`import { InviteMemberForm } from "@/components/forms/invite-member-form";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const organizationId = "your-org-id";
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <InviteMemberForm
          organizationId={organizationId}
          onSuccess={(data) => {
            console.log("Success:", data);
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}`}
            </pre>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h4 className="text-sm font-medium mb-2">Custom Hook Usage:</h4>
            <pre className="text-sm overflow-x-auto">
{`import { useInviteOrganizationMember } from "@/hooks/use-member-invitation";

function MyComponent() {
  const inviteMutation = useInviteOrganizationMember("org-id");
  
  const handleInvite = async () => {
    try {
      await inviteMutation.mutateAsync({
        name: "John Doe",
        email: "john@example.com",
        role: "member",
        teamIds: ["team-1", "team-2"]
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };
  
  return (
    <Button 
      onClick={handleInvite}
      disabled={inviteMutation.isPending}
    >
      {inviteMutation.isPending ? "Inviting..." : "Invite Member"}
    </Button>
  );
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InviteMemberUsageExample;