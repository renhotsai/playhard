"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.invitationId as string;

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        // First check if user is authenticated
        const sessionResult = await authClient.getSession();
        
        if (!sessionResult || !sessionResult.data) {
          // User needs to authenticate first
          // Better Auth will handle this via magic link
          router.push(`/login?invitation=${invitationId}`);
          return;
        }

        const session = sessionResult.data;

        // User is authenticated, accept the invitation
        const { error } = await authClient.organization.acceptInvitation({
          invitationId: invitationId,
        });

        if (error) {
          console.error('Failed to accept invitation:', error);
          router.push(`/set-username?invitation=${invitationId}&error=invitation-failed`);
          return;
        }

        // Process any pending team assignments
        try {
          await fetch('/api/invitations/process-teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitationId })
          });
        } catch (teamError) {
          console.error('Failed to process team assignments:', teamError);
          // Continue flow even if team assignment fails
        }

        // Check if user needs to set username
        if (!session.user.username) {
          router.push(`/set-username?invitation=${invitationId}`);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Invitation acceptance error:', error);
        router.push(`/set-username?invitation=${invitationId}&error=unknown`);
      }
    };

    if (invitationId) {
      acceptInvitation();
    }
  }, [invitationId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processing invitation...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    </div>
  );
}