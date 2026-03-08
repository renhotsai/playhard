"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Search, ArrowUpDown, ChevronDown } from "lucide-react";

interface Booking {
  id: string;
  bookingRef: string;
  scriptId: string;
  timeSlotId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  bookingDate: string;
  playerCount: number;
  notes: string | null;
  status: string;
  createdAt: string;
  script?: { title: string };
  timeSlot?: { label: string; startTime: string; endTime: string };
}

type BookingStatus = "pending" | "confirmed" | "cancelled";

const STATUS_LABELS: Record<string, string> = {
  pending: "待確認",
  confirmed: "已確認",
  cancelled: "已取消",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const QUERY_KEY_BASE = ["bo", "bookings"];

async function fetchBookings(status?: string): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  const res = await fetch(`/api/bookings?${params}`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update booking");
  return res.json();
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "bookingDate", desc: true },
  ]);
  const [changeStatus, setChangeStatus] = useState<{
    id: string;
    current: string;
    ref: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>("confirmed");

  const queryKey = [...QUERY_KEY_BASE, statusFilter];

  const { data: bookings = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchBookings(statusFilter),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_BASE });
      setChangeStatus(null);
    },
  });

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: "bookingRef",
      header: "預約編號",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.bookingRef}</span>
      ),
    },
    {
      id: "script",
      header: "劇本",
      accessorFn: (row) => row.script?.title ?? row.scriptId,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.script?.title ?? row.original.scriptId}</span>
      ),
    },
    {
      id: "timeSlot",
      header: "場次",
      cell: ({ row }) =>
        row.original.timeSlot
          ? `${row.original.timeSlot.label} (${row.original.timeSlot.startTime}–${row.original.timeSlot.endTime})`
          : "—",
    },
    {
      accessorKey: "bookingDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          預約日期 <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) =>
        new Date(row.original.bookingDate).toLocaleDateString("zh-TW"),
    },
    {
      accessorKey: "customerName",
      header: "客戶姓名",
    },
    {
      accessorKey: "customerPhone",
      header: "電話",
    },
    {
      accessorKey: "playerCount",
      header: "人數",
      cell: ({ row }) => `${row.original.playerCount} 人`,
    },
    {
      accessorKey: "status",
      header: "狀態",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUS_COLORS[row.original.status] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setChangeStatus({
              id: row.original.id,
              current: row.original.status,
              ref: row.original.bookingRef,
            })
          }
        >
          <ChevronDown className="h-3 w-3 mr-1" />
          改狀態
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: bookings,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Summary counts
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">預約管理</h1>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2">
          {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "全部" : STATUS_LABELS[s]}
              <Badge variant="secondary" className="ml-1 text-xs">
                {counts[s]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋客戶姓名、電話或預約編號..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">載入中...</div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="py-12 text-center text-muted-foreground"
                    >
                      尚無預約記錄
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Change status dialog */}
      <Dialog open={!!changeStatus} onOpenChange={() => setChangeStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更改預約狀態</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            預約編號：<span className="font-mono">{changeStatus?.ref}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            目前狀態：{STATUS_LABELS[changeStatus?.current ?? ""] ?? changeStatus?.current}
          </p>
          <div className="space-y-2">
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as BookingStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeStatus(null)}>
              取消
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() =>
                changeStatus &&
                updateMutation.mutate({ id: changeStatus.id, status: newStatus })
              }
            >
              {updateMutation.isPending ? "更新中..." : "確認更改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
