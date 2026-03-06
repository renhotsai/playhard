"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Crown, 
  Shield, 
  Eye, 
  Users, 
  UserCheck, 
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Edit
} from "lucide-react";
import { LoadingCard } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

interface User {
  id: string;
  name: string | null;
  email: string;
  username?: string | null;
  role?: string | null;
  createdAt: string | Date;
  emailVerified: boolean;
  organizationCount?: number;
  organizations?: Array<{
    id: string;
    name: string;
    role: string;
    joinedAt: Date;
  }>;
}


// Removed fetchUsers function - now using custom hook

const columnHelper = createColumnHelper<User>();

interface UsersListProps {
  showEditButton?: boolean;
  editButtonText?: string;
  onEdit?: (userId: string) => void;
}

export function UsersList({ 
  showEditButton = false, 
  editButtonText = "編輯", 
  onEdit 
}: UsersListProps = {}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  // Fetch users data directly with useQuery
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.system.users.all(),
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  const users = usersData?.users || [];

  const getRoleIcon = useCallback((role?: string | null) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'owner':
        return <Shield className="h-4 w-4" />;
      case 'supervisor':
        return <Eye className="h-4 w-4" />;
      case 'employee':
        return <Users className="h-4 w-4" />;
      case 'user':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  }, []);

  const getRoleBadge = useCallback((role?: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'owner':
        return <Badge variant="secondary">Owner</Badge>;
      case 'supervisor':
        return <Badge variant="default">Supervisor</Badge>;
      case 'employee':
        return <Badge variant="outline">Employee</Badge>;
      case 'user':
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  }, []);

  // Memoize columns for better performance
  const columns = useMemo(() => {
    const baseColumns = [
    columnHelper.display({
      id: 'avatar',
      header: '',
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://avatar.vercel.sh/${row.original.email}`} />
          <AvatarFallback>
            {row.original.name?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label={`Sort by name ${column.getIsSorted() === "asc" ? "descending" : "ascending"}`}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.username && (
            <div className="text-sm text-muted-foreground">@{row.original.username}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label={`Sort by email ${column.getIsSorted() === "asc" ? "descending" : "ascending"}`}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      ),
    }),
    columnHelper.accessor('role', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label={`Sort by role ${column.getIsSorted() === "asc" ? "descending" : "ascending"}`}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getRoleIcon(row.original.role)}
          {getRoleBadge(row.original.role)}
        </div>
      ),
    }),
    columnHelper.accessor('emailVerified', {
      header: 'Status',
      cell: ({ row }) => (
        row.original.emailVerified ? (
          <Badge variant="outline" className="text-xs">Verified</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">Pending</Badge>
        )
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label={`Sort by created date ${column.getIsSorted() === "asc" ? "descending" : "ascending"}`}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('zh-TW'),
    }),
  ];

    // Add actions column if edit button is enabled
    if (showEditButton && onEdit) {
      baseColumns.push(
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original.id)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            <span className="sr-only">Edit user {row.original.name || 'Unknown'}</span>
            {editButtonText}
          </Button>
        ),
        enableSorting: false,
      })
    );
    }

    return baseColumns;
  }, [showEditButton, onEdit, editButtonText, getRoleIcon, getRoleBadge]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: true,
  });

  if (isLoading) {
    return <LoadingCard message="Loading user data..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load users"
        message="Unable to fetch user data"
        onRetry={() => refetch()}
        retryLabel="Retry"
      />
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No users found"
        description="No user data is available at the moment."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          className="max-w-sm"
          aria-label="Search users by name, email, or role"
          aria-describedby="search-desc"
        />
        <p className="sr-only" id="search-desc">
          Type to filter users by name, email, or role
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table role="table" aria-label="Users list with sortable columns">
          <TableHeader role="rowgroup">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} role="row">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium" role="columnheader" scope="col">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody role="rowgroup">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  role="row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} role="cell">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow role="row">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                  role="cell"
                  aria-live="polite"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground" role="status" aria-live="polite">
          {table.getSelectedRowModel().rows.length > 0 && (
            <span className="mr-2">
              {table.getSelectedRowModel().rows.length} of{" "}
            </span>
          )}
          Total {table.getFilteredRowModel().rows.length} users
          {table.getFilteredRowModel().rows.length !== users.length && (
            <span className="text-muted-foreground/70">
              {" "}(filtered from {users.length})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}