"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { useScripts, useCreateScript, useUpdateScript, useDeleteScript } from "@/hooks/use-scripts";
import { Script } from "@/data/scripts";
import { ScriptEditDialog } from "@/components/script-edit-dialog";
import { Search, Plus, Edit, Trash2, Eye, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminScriptsPage() {
  const { data: scripts = [], isLoading, error } = useScripts();
  const createScriptMutation = useCreateScript();
  const updateScriptMutation = useUpdateScript();
  const deleteScriptMutation = useDeleteScript();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);

  const handleViewScript = (script: Script) => {
    setSelectedScript(script);
    setIsViewDialogOpen(true);
  };

  const handleEditScript = (script: Script) => {
    setEditingScript(script);
    setIsEditDialogOpen(true);
  };

  const handleNewScript = () => {
    setEditingScript(null);
    setIsEditDialogOpen(true);
  };

  const handleSaveScript = async (script: Script) => {
    try {
      if (script.id && editingScript) {
        // Update existing script
        await updateScriptMutation.mutateAsync(script);
      } else {
        // Create new script
        const { id: _id, ...scriptData } = script;
        await createScriptMutation.mutateAsync(scriptData);
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert('儲存失敗，請稍後再試');
    }
  };

  const handleDeleteScript = useCallback(async (script: Script) => {
    if (window.confirm(`確定要刪除劇本「${script.title}」嗎？`)) {
      try {
        await deleteScriptMutation.mutateAsync(script.id);
      } catch (error) {
        console.error('Error deleting script:', error);
        alert('刪除失敗，請稍後再試');
      }
    }
  }, [deleteScriptMutation]);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case '簡單': return 'bg-green-100 text-green-800';
      case '中等': return 'bg-yellow-100 text-yellow-800';
      case '困難': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      '奇幻冒險': 'bg-purple-100 text-purple-800',
      '恐怖懸疑': 'bg-red-100 text-red-800',
      '科幻推理': 'bg-blue-100 text-blue-800',
      '懸疑恐怖': 'bg-orange-100 text-orange-800',
      '現代商業': 'bg-green-100 text-green-800',
      '冒險探險': 'bg-yellow-100 text-yellow-800',
      '末世生存': 'bg-gray-100 text-gray-800',
      '武俠江湖': 'bg-red-100 text-red-800',
      '科幻太空': 'bg-indigo-100 text-indigo-800',
      '民國懸疑': 'bg-amber-100 text-amber-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Define table columns with TanStack Table
  const columns = useMemo<ColumnDef<Script>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              劇本標題
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const script = row.original;
          return (
            <div>
              <div className="font-semibold">{script.title}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">
                {script.description}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              類別
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          return (
            <Badge className={getCategoryColor(row.getValue("category"))}>
              {row.getValue("category")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "players",
        header: "人數",
      },
      {
        accessorKey: "duration",
        header: "時長",
      },
      {
        accessorKey: "difficulty",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              難度
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const difficulty = row.getValue("difficulty") as string;
          return difficulty ? (
            <Badge className={getDifficultyColor(difficulty)}>
              {difficulty}
            </Badge>
          ) : null;
        },
      },
      {
        accessorKey: "monthlyRecommended",
        header: "月推薦",
        cell: ({ row }) => {
          return row.getValue("monthlyRecommended") ? (
            <Badge variant="secondary">✨ 推薦</Badge>
          ) : null;
        },
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => {
          const script = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewScript(script)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleEditScript(script)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive"
                onClick={() => handleDeleteScript(script)}
                disabled={deleteScriptMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteScriptMutation.isPending, handleDeleteScript]
  );

  const table = useReactTable({
    data: scripts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">劇本管理</h1>
          <p className="text-xl text-muted-foreground">
            管理所有劇本資訊，包含新增、編輯、刪除功能
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>劇本列表</span>
              <Button className="gap-2" onClick={handleNewScript}>
                <Plus className="h-4 w-4" />
                新增劇本
              </Button>
            </CardTitle>
            <CardDescription>
              {isLoading ? "載入中..." : `共 ${table.getFilteredRowModel().rows.length} 個劇本`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Controls */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋劇本標題、類別或難度..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive">載入劇本資料時發生錯誤</p>
              </div>
            )}

            {/* TanStack Table */}
            {!isLoading && !error && (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
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
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            沒有符合條件的劇本
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    顯示第 {table.getState().pagination.pageIndex + 1} 頁，共 {table.getPageCount()} 頁
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一頁
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      下一頁
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* View Script Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedScript?.title}</DialogTitle>
              <DialogDescription>劇本詳細資訊</DialogDescription>
            </DialogHeader>
            
            {selectedScript && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">基本資訊</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>類別：</strong>{selectedScript.category}</div>
                      <div><strong>人數：</strong>{selectedScript.players}</div>
                      <div><strong>時長：</strong>{selectedScript.duration}</div>
                      <div><strong>難度：</strong>{selectedScript.difficulty || '未設定'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">狀態</h4>
                    <div className="space-y-2">
                      <div>
                        {selectedScript.monthlyRecommended ? (
                          <Badge variant="secondary">✨ 月推薦劇本</Badge>
                        ) : (
                          <Badge variant="outline">一般劇本</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">劇本描述</h4>
                  <p className="text-sm leading-relaxed">{selectedScript.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">遊戲特色</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedScript.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">劇本圖片</h4>
                  <div className="text-sm text-muted-foreground">
                    {selectedScript.image}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit/Create Script Dialog */}
        <ScriptEditDialog
          script={editingScript}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveScript}
        />
      </div>
    </div>
  );
}