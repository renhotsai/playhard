'use client';

/**
 * Organization Members List Page
 * For organization admins to manage their organization members
 * Fully implements Prisma Types First Principle
 */

import { useState } from 'react';
import { Plus, Search, Users, Building2, Crown, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useOrganizationMembers, useOrganizationTeams } from '@/hooks/use-user-management';
import type { OrganizationMemberFilters } from '@/types/user-management';
import { hasOrganizationAdminAccess } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function OrganizationMembersPage() {
  const { data: session } = useSession();
  const organizationId = session?.activeOrganizationId;
  
  const [filters, setFilters] = useState<OrganizationMemberFilters>({
    role: undefined,
    teamId: undefined,
    search: ''
  });

  // Fetch members and teams using TanStack Query with Prisma types
  const { 
    data: members = [], 
    isLoading: membersLoading, 
    error: membersError,
    refetch: refetchMembers
  } = useOrganizationMembers(organizationId || '', filters);

  const { 
    data: teams = [], 
    isLoading: teamsLoading 
  } = useOrganizationTeams(organizationId || '');

  // Check if user has admin access
  const userMembership = session?.user ? 
    members.find(m => m.user.id === session.user.id) : null;
  
  const hasAdminAccess = userMembership ? 
    hasOrganizationAdminAccess(userMembership.role) : false;

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle role filter change
  const handleRoleChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      role: value === 'all' ? undefined : value as 'owner' | 'admin' | 'member'
    }));
  };

  // Handle team filter change
  const handleTeamChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      teamId: value === 'all' ? undefined : value
    }));
  };

  // Get role badge variant using Prisma enum values
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary'; 
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">No Organization Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select an organization to view members
          </p>
        </div>
      </div>
    );
  }

  if (membersLoading || teamsLoading) {
    return <LoadingState message="Loading organization members..." />;
  }

  if (membersError) {
    return (
      <ErrorState 
        message="Failed to load organization members"
        onRetry={refetchMembers}
      />
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You need admin access to view organization members
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">組織成員</h1>
          <p className="text-muted-foreground">
            管理組織成員和團隊分配
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/organizations/members/invite">
            <Plus className="mr-2 h-4 w-4" />
            邀請成員
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總成員數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理員</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(member => member.role === 'owner' || member.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">團隊數</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">篩選條件</CardTitle>
          <CardDescription>按角色、團隊或搜尋條件篩選成員</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜尋成員..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role Filter */}
            <Select value={filters.role || 'all'} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="所有角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="owner">擁有者</SelectItem>
                <SelectItem value="admin">管理員</SelectItem>
                <SelectItem value="member">成員</SelectItem>
              </SelectContent>
            </Select>

            {/* Team Filter */}
            <Select value={filters.teamId || 'all'} onValueChange={handleTeamChange}>
              <SelectTrigger>
                <SelectValue placeholder="所有團隊" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有團隊</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>成員列表 ({members.length})</CardTitle>
          <CardDescription>組織成員及其團隊分配</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState 
              icon={Users}
              title="暫無成員"
              description="尚未找到符合條件的成員"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>成員</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>團隊</TableHead>
                    <TableHead>加入時間</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.user.email}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role === 'owner' ? '擁有者' :
                           member.role === 'admin' ? '管理員' : '成員'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {member.teammembers.length === 0 ? (
                            <span className="text-sm text-muted-foreground">無團隊</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {member.teammembers.map((teamMember) => (
                                <Badge 
                                  key={teamMember.team.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {teamMember.team.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(member.createdAt).toLocaleDateString('zh-TW')}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/organizations/members/${member.id}`}>
                            查看
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}