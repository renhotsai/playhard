"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/loading-state";
import { Shield, Crown, Users, Info } from "lucide-react";

interface SystemRole {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isProtected: boolean;
  color: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
}

const systemRoles: SystemRole[] = [
  {
    name: "super_admin",
    displayName: "Super Admin",
    description: "Highest level system administrator with unrestricted access to all platform features and data.",
    permissions: [
      "Full system access",
      "Manage all organizations", 
      "Create/delete admin accounts",
      "System configuration",
      "Database operations",
      "Global analytics access"
    ],
    isProtected: true,
    color: "destructive",
    icon: <Crown className="h-4 w-4" />
  },
  {
    name: "admin", 
    displayName: "System Admin",
    description: "Standard system administrator with comprehensive management capabilities across organizations.",
    permissions: [
      "Manage organizations",
      "Create user accounts", 
      "View all user data",
      "Organization analytics",
      "User impersonation",
      "Permission management"
    ],
    isProtected: true,
    color: "default",
    icon: <Shield className="h-4 w-4" />
  },
  {
    name: "member",
    displayName: "Member", 
    description: "Default role for regular users with organization-specific access based on membership.",
    permissions: [
      "Organization membership access",
      "Team participation", 
      "Basic profile management",
      "Resource access per organization role"
    ],
    isProtected: false,
    color: "secondary",
    icon: <Users className="h-4 w-4" />
  }
];

export default function SystemRolesPage() {
  const { data: session, isPending: isLoading } = useSession();
  const router = useRouter();

  // Check authorization
  useEffect(() => {
    if (!isLoading && (!session?.user || session.user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return <LoadingState message="Loading system roles..." />;
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Roles</h1>
        <p className="text-muted-foreground mt-2">
          Predefined system-level roles that control platform access and capabilities
        </p>
      </div>

      <div className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            System roles are predefined and managed by the platform. These roles control access to administrative 
            features and determine what actions users can perform at the system level. Organization-specific 
            permissions are managed separately through the organization membership system.
          </AlertDescription>
        </Alert>

        {/* System Roles Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Role Definitions
            </CardTitle>
            <CardDescription>
              Overview of all system roles, their capabilities, and security levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Key Permissions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemRoles.map((role) => (
                  <TableRow key={role.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {role.icon}
                        <div>
                          <div className="font-medium">{role.displayName}</div>
                          <div className="text-sm text-muted-foreground">{role.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        {role.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <div key={index} className="text-sm">
                            • {permission}
                          </div>
                        ))}
                        {role.permissions.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{role.permissions.length - 3} more...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={role.color}>{role.displayName}</Badge>
                        {role.isProtected && (
                          <Badge variant="outline" className="text-xs">
                            Protected
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Role Hierarchy</CardTitle>
            <CardDescription>
              System roles are arranged in a hierarchical structure with different access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                <Crown className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100">Super Admin</h3>
                  <p className="text-sm text-red-700 dark:text-red-200">
                    Ultimate system control with unrestricted access
                  </p>
                </div>
                <Badge variant="destructive">Highest</Badge>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-0.5 h-4 bg-border"></div>
              </div>
              
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Shield className="h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">System Admin</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Standard administrative access for platform management
                  </p>
                </div>
                <Badge variant="default">High</Badge>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-0.5 h-4 bg-border"></div>
              </div>
              
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-950/20">
                <Users className="h-6 w-6 text-gray-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Member</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    Basic user role with organization-based permissions
                  </p>
                </div>
                <Badge variant="secondary">Standard</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permission Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Permissions</CardTitle>
            <CardDescription>
              Complete list of permissions and capabilities for each system role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {systemRoles.map((role) => (
                <Card key={role.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {role.icon}
                      {role.displayName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Permissions:</h4>
                      <ul className="space-y-1">
                        {role.permissions.map((permission, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{permission}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}