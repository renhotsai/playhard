"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus } from "lucide-react";
import { LoadingOverlay, LoadingCard } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSystemAdmin } from "@/lib/permissions";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import type { OrganizationWithCounts } from "@/lib/types";


export default function OrganizationsPage() {
	const { data: session, isPending } = authClient.useSession();
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const router = useRouter();
	const isAdmin = isSystemAdmin(session?.user.role || '');

	// Redirect non-admin users to their active organization details
	useEffect(() => {
		if (!isPending && session && !isAdmin) {
			if (activeOrganization?.id) {
				router.push(`/dashboard/organizations/${activeOrganization.id}`);
			} else {
				router.push('/dashboard');
			}
		}
	}, [isPending, session, isAdmin, activeOrganization, router]);

	// Admin users: fetch all organizations
	const { data: organizationsData, isLoading, error } = useQuery({
		queryKey: queryKeys.organizations.list(),
		queryFn: async (): Promise<OrganizationWithCounts[]> => {
			const response = await fetch('/api/admin/organizations');
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch organizations: ${response.status} ${errorText}`);
			}
			const data = await response.json();
			return data.organizations as OrganizationWithCounts[];
		},
		enabled: !isPending && isAdmin,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});

	// Show loading while checking permissions
	if (isPending) {
		return <LoadingOverlay message="Checking permissions..." />;
	}

	// Don't render content for non-admin users (they will be redirected)
	if (!isAdmin) {
		return null;
	}

	return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
	              All Organizations
              </h2>
            </div>
            <p className="text-muted-foreground">
              Manage all organizations and their settings
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/dashboard/organizations/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizations List</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <LoadingCard message="Loading organizations..." />
          ) : error ? (
            <ErrorState 
              title="Failed to load organizations"
              message={error instanceof Error ? error.message : 'An unexpected error occurred'}
            />
          ) : organizationsData && organizationsData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizationsData.map((org) => (
                <Card key={org.id} className="border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{org.name}</CardTitle>
                      <Badge variant="outline">
                        {org._count?.members || 0} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(org.createdAt).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/organizations/${org.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/organizations/${org.id}/members`}>
                          Members
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Building2}
              title="No organizations found"
              description="Create the first organization to get started."
              action={{
                label: "Create Organization",
                onClick: () => router.push('/dashboard/organizations/create')
              }}
            />
          )}
        </CardContent>
      </Card>
      
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>System Administrator:</strong> You have full access to view all organizations,
          manage their settings, and access their member information.
        </p>
      </div>
    </div>
  );
}