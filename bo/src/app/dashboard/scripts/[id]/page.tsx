"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface Script {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  features: string[];
  imageUrl: string | null;
  color: string | null;
  isActive: boolean;
  monthlyRecommended: boolean;
}

interface TimeSlot {
  id: string;
  scriptId: string;
  startTime: string;
  endTime: string;
  label: string;
  isActive: boolean;
}

const CATEGORIES = ["懸疑", "恐怖", "奇幻", "情感", "歷史", "現代"];
const DIFFICULTIES = ["入門", "普通", "困難", "地獄"];

async function fetchScript(id: string): Promise<Script> {
  const res = await fetch(`/api/scripts/${id}`);
  if (!res.ok) throw new Error("Failed to fetch script");
  return res.json();
}

async function updateScript(id: string, data: Partial<Script>): Promise<Script> {
  const res = await fetch(`/api/scripts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update script");
  return res.json();
}

async function fetchTimeSlots(scriptId: string): Promise<TimeSlot[]> {
  const res = await fetch(`/api/scripts/${scriptId}/time-slots`);
  if (!res.ok) throw new Error("Failed to fetch time slots");
  return res.json();
}

async function createTimeSlot(
  scriptId: string,
  data: { startTime: string; endTime: string; label: string }
): Promise<TimeSlot> {
  const res = await fetch(`/api/scripts/${scriptId}/time-slots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create time slot");
  return res.json();
}

async function deleteTimeSlot(scriptId: string, slotId: string): Promise<void> {
  const res = await fetch(`/api/scripts/${scriptId}/time-slots/${slotId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete time slot");
}

export default function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const scriptQueryKey = ["bo", "scripts", id];
  const slotsQueryKey = ["bo", "scripts", id, "time-slots"];

  const [showAddSlot, setShowAddSlot] = useState(false);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: script, isLoading } = useQuery({
    queryKey: scriptQueryKey,
    queryFn: () => fetchScript(id),
  });

  const { data: timeSlots = [] } = useQuery({
    queryKey: slotsQueryKey,
    queryFn: () => fetchTimeSlots(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Script>) => updateScript(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scriptQueryKey });
      queryClient.invalidateQueries({ queryKey: ["bo", "scripts"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const createSlotMutation = useMutation({
    mutationFn: (data: { startTime: string; endTime: string; label: string }) =>
      createTimeSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotsQueryKey });
      setShowAddSlot(false);
      slotForm.reset();
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => deleteTimeSlot(id, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotsQueryKey });
      setDeleteSlotId(null);
    },
  });

  const form = useForm({
    defaultValues: {
      title: script?.title ?? "",
      description: script?.description ?? "",
      category: script?.category ?? "",
      difficulty: script?.difficulty ?? "",
      minPlayers: script?.minPlayers ?? 2,
      maxPlayers: script?.maxPlayers ?? 6,
      duration: script?.duration ?? 120,
      imageUrl: script?.imageUrl ?? "",
      isActive: script?.isActive ?? true,
      monthlyRecommended: script?.monthlyRecommended ?? false,
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        ...value,
        imageUrl: value.imageUrl || null,
      });
    },
  });

  const slotForm = useForm({
    defaultValues: { startTime: "", endTime: "", label: "" },
    onSubmit: async ({ value }) => {
      await createSlotMutation.mutateAsync(value);
    },
  });

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">載入中...</div>;
  }

  if (!script) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        找不到劇本
        <Button variant="link" onClick={() => router.push("/dashboard/scripts")}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/scripts")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">{script.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Script edit form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>劇本資料</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
                className="space-y-4"
              >
                <form.Field name="title">
                  {(field) => (
                    <div className="space-y-1">
                      <Label>劇本名稱</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <div className="space-y-1">
                      <Label>簡介</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="category">
                    {(field) => (
                      <div className="space-y-1">
                        <Label>分類</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇分類" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="difficulty">
                    {(field) => (
                      <div className="space-y-1">
                        <Label>難度</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇難度" />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <form.Field name="minPlayers">
                    {(field) => (
                      <div className="space-y-1">
                        <Label>最少人數</Label>
                        <Input
                          type="number"
                          min={1}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="maxPlayers">
                    {(field) => (
                      <div className="space-y-1">
                        <Label>最多人數</Label>
                        <Input
                          type="number"
                          min={1}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="duration">
                    {(field) => (
                      <div className="space-y-1">
                        <Label>時長（分鐘）</Label>
                        <Input
                          type="number"
                          min={30}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name="imageUrl">
                  {(field) => (
                    <div className="space-y-1">
                      <Label>圖片網址</Label>
                      <Input
                        value={field.state.value}
                        placeholder="https://..."
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="flex items-center gap-6">
                  <form.Field name="isActive">
                    {(field) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.state.value}
                          onCheckedChange={field.handleChange}
                        />
                        <Label>上架中</Label>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="monthlyRecommended">
                    {(field) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.state.value}
                          onCheckedChange={field.handleChange}
                        />
                        <Label>每月推薦</Label>
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "儲存中..." : "儲存"}
                  </Button>
                  {saveSuccess && (
                    <span className="text-sm text-green-600">已儲存 ✓</span>
                  )}
                  {updateMutation.isError && (
                    <span className="text-sm text-destructive">儲存失敗</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Time slots management */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>場次時段</CardTitle>
              <Button size="sm" onClick={() => setShowAddSlot(true)}>
                <Plus className="h-4 w-4 mr-1" />
                新增
              </Button>
            </CardHeader>
            <CardContent>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  尚無時段
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>標籤</TableHead>
                      <TableHead>時間</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeSlots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">{slot.label}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {slot.startTime}–{slot.endTime}
                        </TableCell>
                        <TableCell>
                          {slot.isActive ? (
                            <Badge className="bg-green-500 text-white text-xs">啟用</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">停用</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                            onClick={() => setDeleteSlotId(slot.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add time slot dialog */}
      <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增時段</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              slotForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <slotForm.Field name="label">
              {(field) => (
                <div className="space-y-1">
                  <Label>標籤（如：下午場）</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="下午場"
                  />
                </div>
              )}
            </slotForm.Field>

            <div className="grid grid-cols-2 gap-4">
              <slotForm.Field name="startTime">
                {(field) => (
                  <div className="space-y-1">
                    <Label>開始時間</Label>
                    <Input
                      type="time"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </slotForm.Field>

              <slotForm.Field name="endTime">
                {(field) => (
                  <div className="space-y-1">
                    <Label>結束時間</Label>
                    <Input
                      type="time"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </slotForm.Field>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowAddSlot(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createSlotMutation.isPending}>
                {createSlotMutation.isPending ? "新增中..." : "新增時段"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete slot confirmation dialog */}
      <Dialog open={!!deleteSlotId} onOpenChange={() => setDeleteSlotId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除時段</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">確定要刪除這個時段嗎？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSlotId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleteSlotMutation.isPending}
              onClick={() => deleteSlotId && deleteSlotMutation.mutate(deleteSlotId)}
            >
              {deleteSlotMutation.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
