"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/loading-state";
import { Users, UserCheck, Shield, Crown, Info, Building2 } from "lucide-react";

interface OrganizationRole {
  name: string;
  displayName: string;
  description: string;
  hierarchyLevel: number; // 1=Employee, 2=Supervisor, 3=Admin, 4=Owner
  permissions: string[];
  canManage: string[];
  isProtected: boolean;
  color: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
}

const organizationRoles: OrganizationRole[] = [
  {
    name: "owner",
    displayName: "Owner",
    description: "Organization owner with full administrative control and the ability to transfer ownership.",
    hierarchyLevel: 4,
    permissions: [
      "Full organization management",
      "Create/delete admin accounts", 
      "Financial operations access",
      "Organization settings control",
      "Member role assignment",
      "Team creation and management",
      "Transfer ownership rights"
    ],
    canManage: ["admin", "supervisor", "employee"],
    isProtected: true,
    color: "destructive",
    icon: <Crown className="h-4 w-4" />
  },
  {
    name: "admin", 
    displayName: "Admin",
    description: "Organization administrator with comprehensive management capabilities across teams and members.",
    hierarchyLevel: 3,
    permissions: [
      "Team management",
      "Member invitation/removal",
      "Resource access control", 
      "Analytics and reporting",
      "Role assignment (non-owner)",
      "Organization data access",
      "Payment and billing access"
    ],
    canManage: ["supervisor", "employee"],
    isProtected: false,
    color: "default",
    icon: <Shield className="h-4 w-4" />
  },
  {
    name: "supervisor",
    displayName: "Supervisor", 
    description: "Team supervisor with leadership capabilities and member management within assigned teams.",
    hierarchyLevel: 2,
    permissions: [
      "Team member management",
      "Team resource access",
      "Task assignment and monitoring", 
      "Team performance reporting",
      "Basic administrative functions",
      "Employee role assignment"
    ],
    canManage: ["employee"],
    isProtected: false,
    color: "secondary",
    icon: <UserCheck className="h-4 w-4" />
  },
  {
    name: "employee",
    displayName: "Employee",
    description: "Basic organization member with standard access to assigned resources and team participation.",
    hierarchyLevel: 1,
    permissions: [
      "Access assigned resources",
      "Participate in teams",
      "View organization information",
      "Use authorized features",
      "Submit reports and feedback",
      "Basic profile management"
    ],
    canManage: [],
    isProtected: false,
    color: "outline",
    icon: <Users className="h-4 w-4" />
  }
];

export default function OrganizationRolesPage() {
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
    return <LoadingState message="Loading organization roles..." />;
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Organization Roles</h1>
        <p className="text-muted-foreground mt-2">
          Organization-level roles that control access and permissions within each organization
        </p>
      </div>

      <div className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Organization roles are predefined and control access to features and resources within each organization. 
            These roles operate independently from system roles and are managed by organization owners and admins. 
            Role permissions are hierarchical - higher level roles inherit capabilities from lower levels.
          </AlertDescription>
        </Alert>

        {/* Organization Roles Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Role Definitions
            </CardTitle>
            <CardDescription>
              Overview of all organization roles, their capabilities, and management scope
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Key Permissions</TableHead>
                  <TableHead>Can Manage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizationRoles.map((role) => (
                  <TableRow key={role.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {role.icon}
                        <div>
                          <div className="font-medium">{role.displayName}</div>
                          <div className="text-sm text-muted-foreground">Level {role.hierarchyLevel}</div>
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
                        {role.canManage.length > 0 ? (
                          role.canManage.map((managedRole) => (
                            <Badge key={managedRole} variant="outline" className="text-xs mr-1">
                              {managedRole}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
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
            <CardTitle>Organization Role Hierarchy</CardTitle>
            <CardDescription>
              Organization roles are arranged hierarchically with higher levels having greater authority
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                <Crown className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100">Owner (Level 4)</h3>
                  <p className="text-sm text-red-700 dark:text-red-200">
                    Ultimate organizational control with ownership transfer rights
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
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Admin (Level 3)</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Comprehensive management of teams, members, and organization resources
                  </p>
                </div>
                <Badge variant="default">High</Badge>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-0.5 h-4 bg-border"></div>
              </div>
              
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <UserCheck className="h-6 w-6 text-yellow-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Supervisor (Level 2)</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Team leadership with member management and task oversight
                  </p>
                </div>
                <Badge variant="secondary">Medium</Badge>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-0.5 h-4 bg-border"></div>
              </div>
              
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-950/20">
                <Users className="h-6 w-6 text-gray-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Employee (Level 1)</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    Standard member access with basic organizational participation
                  </p>
                </div>
                <Badge variant="outline">Standard</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Scope */}
        <Card>
          <CardHeader>
            <CardTitle>Role Management Capabilities</CardTitle>
            <CardDescription>
              Which roles can manage and assign other roles within the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {organizationRoles.map((role) => (
                <Card key={role.name} className="border-l-4" style={{
                  borderLeftColor: role.color === "destructive" ? "rgb(239, 68, 68)" :
                    role.color === "default" ? "rgb(59, 130, 246)" :
                    role.color === "secondary" ? "rgb(234, 179, 8)" : "rgb(107, 114, 128)"
                }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {role.icon}
                      {role.displayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Can manage roles:</div>
                      {role.canManage.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {role.canManage.map((managedRole) => (
                            <Badge key={managedRole} variant="outline" className="text-xs">
                              {managedRole}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No role management permissions</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Permissions</CardTitle>
            <CardDescription>
              Complete list of permissions and capabilities for each organization role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {organizationRoles.map((role) => (
                <Card key={role.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {role.icon}
                      {role.displayName}
                      <Badge variant={role.color} className="ml-auto">
                        Level {role.hierarchyLevel}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Permissions:</h4>
                        <ul className="space-y-1">
                          {role.permissions.map((permission, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                              <span>{permission}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {role.canManage.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Can manage:</h4>
                          <div className="flex flex-wrap gap-1">
                            {role.canManage.map((managedRole) => (
                              <Badge key={managedRole} variant="outline" className="text-xs">
                                {managedRole}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {role.isProtected && (
                        <div className="pt-2 border-t">
                          <Badge variant="outline" className="text-xs">
                            🔒 Protected Role
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Special restrictions apply to this role
                          </p>
                        </div>
                      )}
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