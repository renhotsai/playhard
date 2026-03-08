"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

const CATEGORIES = ["懸疑", "恐怖", "奇幻", "情感", "歷史", "現代"];
const DIFFICULTIES = ["入門", "普通", "困難", "地獄"];

interface CreateScriptPayload {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  imageUrl: string | null;
  isActive: boolean;
  monthlyRecommended: boolean;
}

async function createScript(data: CreateScriptPayload) {
  const res = await fetch("/api/scripts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create script");
  return res.json();
}

export default function CreateScriptPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createScript,
    onSuccess: (script) => {
      queryClient.invalidateQueries({ queryKey: ["bo", "scripts"] });
      router.push(`/dashboard/scripts/${script.id}`);
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      difficulty: "",
      minPlayers: 2,
      maxPlayers: 6,
      duration: 120,
      imageUrl: "",
      isActive: true,
      monthlyRecommended: false,
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        ...value,
        imageUrl: value.imageUrl || null,
      });
    },
  });

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/scripts")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">新增劇本</h1>
      </div>

      <Card className="max-w-2xl">
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
                  <Label>劇本名稱 *</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="輸入劇本名稱"
                    required
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
                    placeholder="劇本簡介"
                  />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="category">
                {(field) => (
                  <div className="space-y-1">
                    <Label>分類 *</Label>
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
                    <Label>難度 *</Label>
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

            {createMutation.isError && (
              <p className="text-sm text-destructive">建立失敗，請再試一次</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "建立中..." : "建立劇本"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/scripts")}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
