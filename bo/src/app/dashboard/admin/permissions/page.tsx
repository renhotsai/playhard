"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionMatrix as PermissionMatrixComponent } from "@/components/permissions";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";
import { Users, Shield, Building } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
}

interface Team {
  id: string;
  name: string;
  organizationId: string;
}

interface Organization {
  id: string;
  name: string;
  slug?: string;
}

interface PermissionMatrix {
  resource: string;
  permissions: Record<string, boolean>;
  all: boolean;
}

export default function PermissionsPage() {
  const { data: session, isPending: isLoading } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // User permissions state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<PermissionMatrix[]>([]);
  
  // Team permissions state
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [teamPermissions, setTeamPermissions] = useState<PermissionMatrix[]>([]);
  
  // Organization limits state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [orgLimits, setOrgLimits] = useState<PermissionMatrix[]>([]);

  // Check authorization
  useEffect(() => {
    if (!isLoading && (!session?.user || session.user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
  }, [session, isLoading, router]);

  // Load initial data
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      loadUsers();
      loadTeams();
      loadOrganizations();
    }
  }, [session]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('載入用戶失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('載入團隊失敗');
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('載入組織失敗');
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/permissions/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions || []);
      } else {
        toast.error('載入用戶權限失敗');
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
      toast.error('載入用戶權限失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamPermissions = async (teamId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/permissions/team/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTeamPermissions(data.permissions || []);
      } else {
        toast.error('載入團隊權限失敗');
      }
    } catch (error) {
      console.error('Error loading team permissions:', error);
      toast.error('載入團隊權限失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadOrgLimits = async (orgId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${orgId}/permission-limits`);
      if (response.ok) {
        const data = await response.json();
        setOrgLimits(data.permissionLimits || []);
      } else {
        toast.error('載入組織權限限制失敗');
      }
    } catch (error) {
      console.error('Error loading org limits:', error);
      toast.error('載入組織權限限制失敗');
    } finally {
      setLoading(false);
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      const permissions = userPermissions.flatMap(matrix =>
        Object.entries(matrix.permissions)
          .filter(([action]) => action !== 'all')
          .map(([action, granted]) => ({
            resource: matrix.resource,
            action,
            granted
          }))
      );

      const response = await fetch(`/api/permissions/user/${selectedUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        toast.success('用戶權限已更新');
      } else {
        toast.error('更新用戶權限失敗');
      }
    } catch (error) {
      console.error('Error saving user permissions:', error);
      toast.error('更新用戶權限失敗');
    } finally {
      setSaving(false);
    }
  };

  const saveTeamPermissions = async () => {
    if (!selectedTeam) return;
    
    try {
      setSaving(true);
      const permissions = teamPermissions.flatMap(matrix =>
        Object.entries(matrix.permissions)
          .filter(([action]) => action !== 'all')
          .map(([action, granted]) => ({
            resource: matrix.resource,
            action,
            granted
          }))
      );

      const response = await fetch(`/api/permissions/team/${selectedTeam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        toast.success('團隊權限已更新');
      } else {
        toast.error('更新團隊權限失敗');
      }
    } catch (error) {
      console.error('Error saving team permissions:', error);
      toast.error('更新團隊權限失敗');
    } finally {
      setSaving(false);
    }
  };

  const saveOrgLimits = async () => {
    if (!selectedOrg) return;
    
    try {
      setSaving(true);
      const limits = orgLimits.flatMap(matrix =>
        Object.entries(matrix.permissions)
          .filter(([action]) => action !== 'all')
          .map(([action, allowed]) => ({
            resource: matrix.resource,
            action,
            allowed
          }))
      );

      const response = await fetch(`/api/organizations/${selectedOrg}/permission-limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits })
      });

      if (response.ok) {
        toast.success('組織權限限制已更新');
      } else {
        toast.error('更新組織權限限制失敗');
      }
    } catch (error) {
      console.error('Error saving org limits:', error);
      toast.error('更新組織權限限制失敗');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="載入權限管理頁面..." />;
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">權限管理</h1>
        <p className="text-muted-foreground">
          管理用戶、團隊權限以及組織權限限制
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            用戶權限
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            團隊權限
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            組織限制
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>用戶權限管理</CardTitle>
              <CardDescription>
                設置特定用戶的權限。用戶將擁有直接權限和團隊權限的合併。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">選擇用戶</Label>
                <Select
                  value={selectedUser}
                  onValueChange={(value) => {
                    setSelectedUser(value);
                    if (value) loadUserPermissions(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇要管理權限的用戶" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="space-y-4">
                  <PermissionMatrixComponent
                    permissions={userPermissions}
                    onChange={setUserPermissions}
                    onSave={saveUserPermissions}
                    loading={loading}
                    disabled={saving}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>團隊權限管理</CardTitle>
              <CardDescription>
                設置團隊權限。團隊成員將自動繼承團隊權限。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-select">選擇團隊</Label>
                <Select
                  value={selectedTeam}
                  onValueChange={(value) => {
                    setSelectedTeam(value);
                    if (value) loadTeamPermissions(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇要管理權限的團隊" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTeam && (
                <div className="space-y-4">
                  <PermissionMatrixComponent
                    permissions={teamPermissions}
                    onChange={setTeamPermissions}
                    onSave={saveTeamPermissions}
                    loading={loading}
                    disabled={saving}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>組織權限限制</CardTitle>
              <CardDescription>
                設置組織內可用的權限範圍。這是硬邊界，組織內用戶和團隊權限不能超過此限制。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-select">選擇組織</Label>
                <Select
                  value={selectedOrg}
                  onValueChange={(value) => {
                    setSelectedOrg(value);
                    if (value) loadOrgLimits(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇要設置權限限制的組織" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrg && (
                <div className="space-y-4">
                  <PermissionMatrixComponent
                    permissions={orgLimits}
                    onChange={setOrgLimits}
                    onSave={saveOrgLimits}
                    loading={loading}
                    disabled={saving}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}