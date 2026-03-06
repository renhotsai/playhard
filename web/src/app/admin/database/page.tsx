"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    scriptsMigrated?: number;
    timestamp?: string;
    [key: string]: unknown;
  };
}

export default function DatabaseAdminPage() {
  const [isCreatingTables, setIsCreatingTables] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [results, setResults] = useState<{
    tables?: MigrationResult;
    data?: MigrationResult;
  }>({});

  const handleCreateTables = async () => {
    setIsCreatingTables(true);
    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      setResults(prev => ({
        ...prev,
        tables: {
          success: response.ok,
          message: result.message || result.error,
          details: result
        }
      }));
      
    } catch (error) {
      setResults(prev => ({
        ...prev,
        tables: {
          success: false,
          message: '創建表格時發生錯誤',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      }));
    } finally {
      setIsCreatingTables(false);
    }
  };

  const handleMigrateData = async () => {
    setIsMigrating(true);
    try {
      const response = await fetch('/api/migrate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      setResults(prev => ({
        ...prev,
        data: {
          success: response.ok,
          message: result.message || result.error,
          details: result
        }
      }));
      
    } catch (error) {
      setResults(prev => ({
        ...prev,
        data: {
          success: false,
          message: '遷移資料時發生錯誤',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      }));
    } finally {
      setIsMigrating(false);
    }
  };

  const getStatusIcon = (result?: MigrationResult) => {
    if (!result) return <Database className="h-4 w-4" />;
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (result?: MigrationResult) => {
    if (!result) return <Badge variant="outline">待執行</Badge>;
    return result.success ? 
      <Badge className="bg-green-100 text-green-800">成功</Badge> : 
      <Badge className="bg-red-100 text-red-800">失敗</Badge>;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">資料庫管理</h1>
          <p className="text-xl text-muted-foreground">
            初始化 Supabase 資料庫並遷移 Mock Data
          </p>
        </div>

        {/* Environment Status */}
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>當前模式:</strong> {process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' ? 'Supabase 資料庫' : 'Mock Data 模式'}
            {process.env.NEXT_PUBLIC_USE_SUPABASE !== 'true' && (
              <div className="mt-2 text-sm">
                ⚠️ 請在 .env.local 中設定 <code>NEXT_PUBLIC_USE_SUPABASE=true</code> 以啟用資料庫功能
              </div>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* Step 1: Create Tables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(results.tables)}
                步驟 1: 創建資料表
              </CardTitle>
              <CardDescription>
                在 Supabase 中創建 scripts、time_slots、bookings 資料表
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>狀態:</span>
                  {getStatusBadge(results.tables)}
                </div>
                <Button 
                  onClick={handleCreateTables} 
                  disabled={isCreatingTables}
                  variant={results.tables?.success ? "outline" : "default"}
                >
                  {isCreatingTables ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      創建中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {results.tables ? "重新創建表格" : "創建資料表"}
                    </>
                  )}
                </Button>
              </div>

              {results.tables && (
                <Alert className={results.tables.success ? "" : "border-destructive"}>
                  <AlertDescription>
                    <strong>{results.tables.success ? "✅" : "❌"}</strong> {results.tables.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Migrate Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(results.data)}
                步驟 2: 遷移資料
              </CardTitle>
              <CardDescription>
                將 Mock Data 中的所有劇本和時段資料遷移到 Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>狀態:</span>
                  {getStatusBadge(results.data)}
                </div>
                <Button 
                  onClick={handleMigrateData} 
                  disabled={isMigrating || !results.tables?.success}
                  variant={results.data?.success ? "outline" : "default"}
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      遷移中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {results.data ? "重新遷移資料" : "開始遷移"}
                    </>
                  )}
                </Button>
              </div>

              {results.data && (
                <Alert className={results.data.success ? "" : "border-destructive"}>
                  <AlertDescription>
                    <strong>{results.data.success ? "✅" : "❌"}</strong> {results.data.message}
                    {results.data.success && results.data.details && (
                      <div className="mt-2 text-sm">
                        • 劇本: {results.data.details.scriptsMigrated} 筆
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Final Instructions */}
          {results.tables?.success && results.data?.success && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">🎉 遷移完成！</CardTitle>
                <CardDescription className="text-green-700">
                  資料庫設置已完成，您現在可以使用完整的 CRUD 功能
                </CardDescription>
              </CardHeader>
              <CardContent className="text-green-800">
                <div className="space-y-2 text-sm">
                  <p>✅ 資料表創建成功</p>
                  <p>✅ 資料遷移完成</p>
                  <p>✅ 現在可以前往 <a href="/admin/scripts" className="underline font-medium">劇本管理頁面</a> 測試功能</p>
                  <p className="mt-4 p-3 bg-green-100 rounded border">
                    <strong>下一步:</strong> 確認 .env.local 中 <code>NEXT_PUBLIC_USE_SUPABASE=true</code> 已設置
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}