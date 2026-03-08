"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { BookOpen, Plus, Search, ArrowUpDown, Edit, Trash2 } from "lucide-react";

interface Script {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  isActive: boolean;
  monthlyRecommended: boolean;
  createdAt: string;
}

const QUERY_KEY = ["bo", "scripts"];

async function fetchScripts(): Promise<Script[]> {
  const res = await fetch("/api/scripts");
  if (!res.ok) throw new Error("Failed to fetch scripts");
  return res.json();
}

async function deleteScript(id: string): Promise<void> {
  const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete script");
}

export default function ScriptsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchScripts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
  });

  const columns: ColumnDef<Script>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          劇本名稱 <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "分類",
      cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
    },
    {
      accessorKey: "difficulty",
      header: "難度",
      cell: ({ row }) => {
        const colors: Record<string, string> = {
          入門: "bg-green-100 text-green-800",
          普通: "bg-blue-100 text-blue-800",
          困難: "bg-orange-100 text-orange-800",
          地獄: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              colors[row.original.difficulty] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            {row.original.difficulty}
          </span>
        );
      },
    },
    {
      id: "players",
      header: "人數",
      cell: ({ row }) =>
        `${row.original.minPlayers}–${row.original.maxPlayers} 人`,
    },
    {
      accessorKey: "duration",
      header: "時長",
      cell: ({ row }) => `${row.original.duration} 分鐘`,
    },
    {
      accessorKey: "isActive",
      header: "狀態",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-500 text-white">上架</Badge>
        ) : (
          <Badge variant="secondary">下架</Badge>
        ),
    },
    {
      accessorKey: "monthlyRecommended",
      header: "每月推薦",
      cell: ({ row }) =>
        row.original.monthlyRecommended ? (
          <Badge className="bg-orange-500 text-white">推薦</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/scripts/${row.original.id}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: scripts,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">劇本管理</h1>
          <Badge variant="secondary">{scripts.length} 個劇本</Badge>
        </div>
        <Button onClick={() => router.push("/dashboard/scripts/create")}>
          <Plus className="mr-2 h-4 w-4" />
          新增劇本
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋劇本..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-xs"
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
                      尚無劇本，點擊「新增劇本」開始建立
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.value, cell.getContext()) ??
                            flexRender(cell.column.columnDef.cell, cell.getContext())}
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            確定要刪除這個劇本嗎？此操作無法復原，相關時段和預約資料也會一併刪除。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
