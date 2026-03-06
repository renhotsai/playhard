"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UnifiedPermissionMatrix } from "./unified-permission-matrix"
import { PermissionMatrix, type PermissionMatrix as PermissionMatrixType } from "./permission-matrix"
import { 
  useActiveOrgCanRead, 
  useActiveOrgCanCreate, 
  useActiveOrgCanUpdate, 
  useActiveOrgCanDelete,
  useActiveOrgPermission,
  usePermissionChecks
} from "@/hooks/use-unified-permissions"
import { authClient } from "@/lib/auth-client"

/**
 * Demo component showing unified permission system integration
 * Demonstrates how existing checkbox UI works with the unified system
 */
export function UnifiedPermissionDemo() {
  const { data: session } = authClient.useSession()
  const { data: activeOrganization } = authClient.useActiveOrganization()
  
  // Example of using unified permission hooks
  const canReadUsers = useActiveOrgCanRead('user')
  const canCreateUsers = useActiveOrgCanCreate('user')
  const canUpdateUsers = useActiveOrgCanUpdate('user')
  const canDeleteUsers = useActiveOrgCanDelete('user')
  
  const canReadStores = useActiveOrgCanRead('store')
  const canCreateStores = useActiveOrgCanCreate('store')
  
  // Example of detailed permission check
  const { data: storeCreatePermission } = useActiveOrgPermission('store', 'create')
  
  // Legacy compatibility hook
  const legacyPermissions = usePermissionChecks(activeOrganization?.id)

  // State for traditional permission matrix (for comparison)
  const [traditionalPermissions, setTraditionalPermissions] = React.useState<PermissionMatrixType[]>([
    {
      resource: "user",
      permissions: { create: true, update: false, delete: false, read: true },
      all: false,
    },
    {
      resource: "team", 
      permissions: { create: false, update: true, delete: false, read: true },
      all: false,
    },
    {
      resource: "store",
      permissions: { create: false, update: false, delete: false, read: true },
      all: false,
    },
  ])

  const handleTraditionalSave = async () => {
    console.log("Saving traditional permissions:", traditionalPermissions)
    alert("傳統權限設定已儲存！")
  }

  const handleUnifiedPermissionChange = (resource: any, action: any, granted: boolean) => {
    console.log(`Permission changed: ${resource}.${action} = ${granted}`)
  }

  const handleUnifiedSave = async () => {
    console.log("Saving unified permissions...")
    // Here you would call your permission API
    alert("統一權限設定已儲存！")
  }

  if (!session?.user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">請先登入以查看權限系統示例</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">統一權限系統示例</h1>
        <p className="text-muted-foreground">
          展示統一權限系統如何與現有的checkbox權限UI完美整合
        </p>
      </div>

      {/* Current User Context */}
      <Card>
        <CardHeader>
          <CardTitle>當前用戶資訊</CardTitle>
          <CardDescription>權限檢查的上下文資訊</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">用戶ID: {session.user.id}</Badge>
            <Badge variant="outline">系統角色: {session.user.role || '無'}</Badge>
            {activeOrganization && (
              <>
                <Badge variant="secondary">組織: {activeOrganization.name}</Badge>
                <Badge variant="secondary">組織ID: {activeOrganization.id}</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission Hook Examples */}
      <Card>
        <CardHeader>
          <CardTitle>權限Hook示例</CardTitle>
          <CardDescription>使用統一權限hooks進行權限檢查</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">用戶管理</h4>
              <div className="space-y-1">
                <Badge variant={canReadUsers ? "default" : "secondary"}>
                  讀取: {canReadUsers ? '✓' : '✗'}
                </Badge>
                <Badge variant={canCreateUsers ? "default" : "secondary"}>
                  創建: {canCreateUsers ? '✓' : '✗'}
                </Badge>
                <Badge variant={canUpdateUsers ? "default" : "secondary"}>
                  更新: {canUpdateUsers ? '✓' : '✗'}
                </Badge>
                <Badge variant={canDeleteUsers ? "default" : "secondary"}>
                  刪除: {canDeleteUsers ? '✓' : '✗'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">門店管理</h4>
              <div className="space-y-1">
                <Badge variant={canReadStores ? "default" : "secondary"}>
                  讀取: {canReadStores ? '✓' : '✗'}
                </Badge>
                <Badge variant={canCreateStores ? "default" : "secondary"}>
                  創建: {canCreateStores ? '✓' : '✗'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">詳細權限資訊</h4>
              {storeCreatePermission && (
                <div className="space-y-1">
                  <Badge variant={storeCreatePermission.granted ? "default" : "destructive"}>
                    門店創建: {storeCreatePermission.granted ? '允許' : '拒絕'}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    原因: {storeCreatePermission.reason}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    詳情: {storeCreatePermission.details}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">向後兼容</h4>
              <div className="space-y-1">
                <Badge variant={legacyPermissions.canViewUsers ? "default" : "secondary"}>
                  查看用戶: {legacyPermissions.canViewUsers ? '✓' : '✗'}
                </Badge>
                <Badge variant={legacyPermissions.canManageStores ? "default" : "secondary"}>
                  管理門店: {legacyPermissions.canManageStores ? '✓' : '✗'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Traditional Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>傳統權限矩陣</CardTitle>
          <CardDescription>現有的checkbox權限管理介面</CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionMatrix
            permissions={traditionalPermissions}
            onChange={setTraditionalPermissions}
            onSave={handleTraditionalSave}
            className="max-w-4xl"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Unified Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>統一權限矩陣</CardTitle>
          <CardDescription>
            整合統一權限系統的enhanced checkbox介面，顯示權限來源和層級資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedPermissionMatrix
            subjectType="user"
            subjectId={session.user.id}
            organizationId={activeOrganization?.id}
            onPermissionChange={handleUnifiedPermissionChange}
            onSave={handleUnifiedSave}
            className="max-w-5xl"
          />
        </CardContent>
      </Card>

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>整合優勢</CardTitle>
          <CardDescription>統一權限系統帶來的改進</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ 優勢</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 三層權限架構（系統管理員 → 組織角色 → 細粒度權限）</li>
                <li>• 詳細的權限來源追蹤</li>
                <li>• 向後兼容現有checkbox UI</li>
                <li>• Better Auth無縫整合</li>
                <li>• 即時權限狀態顯示</li>
                <li>• 支援批量權限檢查</li>
                <li>• 權限變更預覽</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🔧 技術特點</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• React Query快取優化</li>
                <li>• TypeScript類型安全</li>
                <li>• 組件化設計</li>
                <li>• 錯誤處理機制</li>
                <li>• 權限變更本地預覽</li>
                <li>• 支援團隊權限繼承</li>
                <li>• 組織權限限制功能</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>使用範例</CardTitle>
          <CardDescription>如何在React組件中使用統一權限系統</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">簡單的布林值檢查</h4>
              <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`import { useActiveOrgCanRead, useActiveOrgCanCreate } from '@/hooks/use-unified-permissions';

function StoreManagement() {
  const canReadStores = useActiveOrgCanRead('store');
  const canCreateStores = useActiveOrgCanCreate('store');
  
  return (
    <div>
      {canReadStores && <StoreList />}
      {canCreateStores && <CreateStoreButton />}
    </div>
  );
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">詳細權限檢查</h4>
              <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`import { usePermission } from '@/hooks/use-unified-permissions';

function DetailedPermissionCheck() {
  const { data: permission } = usePermission('store', 'update', organizationId);
  
  return (
    <div>
      {permission?.granted ? (
        <EditButton />
      ) : (
        <div>無權限: {permission?.reason}</div>
      )}
    </div>
  );
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}