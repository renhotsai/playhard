# Unified Permission System Guide

## 概述

統一權限系統整合了 Better Auth 的基礎認證和你的自定義細粒度權限，提供三層權限檢查架構。

## 三層權限架構

### 第一層：系統管理員 (Better Auth Admin Plugin)
- **系統管理員** (`user.role = 'admin'`) 繞過所有其他權限檢查
- 具有對所有資源的完整存取權限
- 適用於平台級管理操作

### 第二層：組織角色 (Better Auth Organization Plugin)  
- **組織擁有者** (`member.role = 'owner'`) 
- **組織管理員** (`member.role = 'admin'`)
- **組織成員** (`member.role = 'member'`)
- 提供基於組織角色的增強權限

### 第三層：細粒度權限 (Custom Permission Service)
- Checkbox-based 權限管理
- 資源級別的 CRUD 權限 (user, team, organization, store, game, report)
- 支援團隊權限繼承
- 組織權限限制功能

## 使用方式

### 在 React 組件中使用

```typescript
import { 
  useActiveOrgCanRead, 
  useActiveOrgCanCreate,
  usePermission,
  useResourcePermissions 
} from '@/hooks/use-unified-permissions';

function StoreManagement() {
  // 簡單的布林值檢查
  const canReadStores = useActiveOrgCanRead('store');
  const canCreateStores = useActiveOrgCanCreate('store');
  
  // 詳細的權限檢查 (包含原因)
  const { data: updatePermission } = usePermission('store', 'update', organizationId);
  
  // 取得資源的所有權限 (適合權限矩陣 UI)
  const { data: storePermissions } = useResourcePermissions('store', organizationId);

  return (
    <div>
      {canReadStores && <StoreList />}
      {canCreateStores && <CreateStoreButton />}
      {updatePermission?.granted && <EditStoreButton />}
      
      {/* 顯示權限原因 */}
      {updatePermission && (
        <div>
          權限狀態: {updatePermission.granted ? '允許' : '拒絕'}
          原因: {updatePermission.reason}
          詳情: {updatePermission.details}
        </div>
      )}
    </div>
  );
}
```

### 在 API 路由中使用

```typescript
import { unifiedPermissionService, type PermissionContext } from '@/lib/permissions/unified-permissions';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  const context: PermissionContext = {
    userId: session.user.id,
    organizationId: request.organizationId
  };

  // 檢查權限
  const permission = await unifiedPermissionService.hasPermission(
    context,
    'store',
    'create'
  );

  if (!permission.granted) {
    return NextResponse.json({
      error: 'Permission denied',
      reason: permission.reason,
      details: permission.details
    }, { status: 403 });
  }

  // 執行操作...
}
```

### 批量權限檢查

```typescript
// 一次檢查多個權限
const { data: permissions } = usePermissions([
  { resource: 'store', action: 'create' },
  { resource: 'store', action: 'update' },
  { resource: 'user', action: 'read' }
], organizationId);

// 在 API 中
const permissions = await unifiedPermissionService.hasPermissions(context, [
  { resource: 'store', action: 'create' },
  { resource: 'store', action: 'update' }
]);
```

## 權限檢查邏輯

統一權限系統按照以下順序檢查權限：

1. **系統管理員檢查** - 如果是系統管理員，直接允許
2. **組織角色檢查** - 檢查組織級別的增強權限
3. **細粒度權限檢查** - 檢查自定義的 checkbox 權限
4. **拒絕** - 如果所有層級都未授權

## 權限原因說明

- `system_admin` - 系統管理員權限
- `organization_role` - 組織角色權限  
- `fine_grained` - 細粒度權限
- `denied` - 無權限

## 相容性

### 向後相容
統一權限系統提供了 `usePermissionChecks()` hook 來保持與現有代碼的相容性：

```typescript
// 舊的使用方式仍然有效
const permissions = usePermissionChecks(organizationId);
const canViewUsers = permissions.canViewUsers; // 仍然可用
```

### 逐步遷移
你可以逐步將現有代碼遷移到新的統一系統：

1. 新組件使用 `useActiveOrgCanRead()` 等新 hooks
2. 現有組件繼續使用 `usePermissionChecks()`
3. 慢慢將現有組件更新為新的 hooks

## 與現有 UI 的整合

你的 checkbox-based 權限管理 UI 可以繼續正常使用：

- **PermissionMatrix 組件** - 繼續管理細粒度權限
- **Admin permissions 頁面** - 繼續提供權限管理介面
- **組織限制功能** - 繼續限制組織級別的權限範圍

統一權限系統會自動整合這些設定，無需修改現有 UI。

## 效能考量

- **系統管理員快速路徑** - 避免不必要的資料庫查詢
- **權限快取** - 使用 TanStack Query 快取權限檢查結果
- **批量檢查** - 減少多個權限檢查的開銷
- **惰性載入** - 只在需要時進行權限檢查

## 除錯與監控

統一權限系統提供詳細的除錯資訊：

```typescript
// 在開發環境中，可以檢查權限原因
const result = await unifiedPermissionService.hasPermission(context, 'store', 'read');
console.log('Permission result:', {
  granted: result.granted,
  reason: result.reason,
  details: result.details
});
```

## 範例：完整的組件實現

```typescript
import { useActiveOrgResourcePermissions } from '@/hooks/use-unified-permissions';

function StorePermissionMatrix() {
  const { data: permissions, isLoading } = useActiveOrgResourcePermissions('store');
  
  if (isLoading) return <div>載入權限中...</div>;
  
  return (
    <div className="permission-matrix">
      <h3>門店權限</h3>
      <div className="grid grid-cols-4 gap-4">
        <PermissionCard 
          action="讀取"
          granted={permissions?.read?.granted}
          reason={permissions?.read?.reason}
        />
        <PermissionCard 
          action="創建"
          granted={permissions?.create?.granted}
          reason={permissions?.create?.reason}
        />
        <PermissionCard 
          action="更新"
          granted={permissions?.update?.granted}
          reason={permissions?.update?.reason}
        />
        <PermissionCard 
          action="刪除"
          granted={permissions?.delete?.granted}
          reason={permissions?.delete?.reason}
        />
      </div>
    </div>
  );
}

function PermissionCard({ action, granted, reason }: {
  action: string;
  granted?: boolean;
  reason?: string;
}) {
  return (
    <div className={`p-4 rounded ${granted ? 'bg-green-100' : 'bg-red-100'}`}>
      <div className="font-semibold">{action}</div>
      <div className={granted ? 'text-green-600' : 'text-red-600'}>
        {granted ? '✓ 允許' : '✗ 拒絕'}
      </div>
      <div className="text-sm text-gray-600">{reason}</div>
    </div>
  );
}
```

## 最佳實踐

1. **在組件中優先使用 Active Organization hooks** - `useActiveOrgCanRead()` 等
2. **在 API 中使用完整的 PermissionContext** - 包含 userId 和 organizationId
3. **善用批量檢查** - 當需要檢查多個權限時
4. **保持 UI 顯示權限原因** - 幫助用戶理解為什麼被拒絕
5. **使用權限快取** - 避免重複的權限檢查
6. **逐步遷移** - 新功能使用統一系統，現有功能保持不變

這個統一權限系統讓你能夠充分利用 Better Auth 的強大功能，同時保持你優秀的 checkbox-based 權限管理 UI，提供最佳的開發體驗和用戶體驗。