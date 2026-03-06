'use client';

/**
 * System Admin Users List Page
 * Displays all system users with organization affiliations
 * Uses Prisma types and TanStack Query for data management
 */

import { useState } from 'react';
import { Plus, Search, Filter, Users, Building2, Trash2, AlertTriangle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useSystemUsers, useOrganizations, useDeleteUser } from '@/hooks/use-user-management';
import type { SystemUserFilters } from '@/types/user-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

export default function SystemUsersPage() {
  const [filters, setFilters] = useState<SystemUserFilters>({
    role: undefined,
    organizationId: undefined,
    search: ''
  });

  // Fetch users and organizations using TanStack Query
  const { 
    data: users = [], 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers
  } = useSystemUsers(filters);

  const { 
    data: organizations = [], 
    isLoading: orgsLoading 
  } = useOrganizations();

  // Delete user mutation
  const deleteUserMutation = useDeleteUser();

  // Get current session to prevent self-deletion
  const { data: session } = authClient.useSession();

  // Handle delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success(`User ${userName} has been successfully deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle role filter change
  const handleRoleChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      role: value === 'all' ? undefined : value as 'admin' | 'member'
    }));
  };

  // Handle organization filter change
  const handleOrganizationChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      organizationId: value === 'all' ? undefined : value
    }));
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'member': return 'secondary';
      default: return 'outline';
    }
  };

  // Get organization role badge variant
  const getOrgRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  if (usersLoading || orgsLoading) {
    return <LoadingState message="Loading users..." />;
  }

  if (usersError) {
    return (
      <ErrorState 
        message="Failed to load users"
        onRetry={refetchUsers}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
          <p className="text-muted-foreground">
            Manage all users across the system and their organization affiliations
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/admin/users/create">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization Members</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.members.length > 0).length}
            </div>
          </CardContent>
        </Card>
        
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter users by role, organization, or search term</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role Filter */}
            <Select value={filters.role || 'all'} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">System Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            {/* Organization Filter */}
            <Select value={filters.organizationId || 'all'} onValueChange={handleOrganizationChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} ({org._count.members} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>System-wide user list with organization affiliations</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState 
              icon={Users}
              title="No users found"
              description="No users match the current filters"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Organizations</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.username && (
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role === 'admin' ? 'System Admin' : 'Member'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {user.members.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No organizations</span>
                          ) : (
                            user.members.map((member) => (
                              <div key={member.id} className="flex items-center gap-2">
                                <span className="text-sm">{member.organization.name}</span>
                                <Badge 
                                  variant={getOrgRoleBadgeVariant(member.role)}
                                  className="text-xs"
                                >
                                  {member.role}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/admin/users/${user.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          {/* Only show delete button if it's not the current user */}
                          {user.id !== session?.user?.id ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={deleteUserMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  Delete User
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{user.name || user.email}</strong>? 
                                  This action cannot be undone and will:
                                  <br />
                                  • Remove the user from all organizations
                                  • Delete all their sessions
                                  • Permanently remove their account
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deleteUserMutation.isPending}
                                >
                                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          ) : null}
                        </div>
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