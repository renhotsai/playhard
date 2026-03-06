# Permission Matrix Component

A React component built with shadcn/ui for managing checkbox-based permissions in a table format.

## Features

- **Checkbox-based Interface**: Clean table layout with resource rows and permission columns
- **Smart Permission Logic**: 
  - "All" checkbox toggles all permissions for a resource
  - Read dependency: Checking Create/Update/Delete automatically checks Read
  - Auto-updates "All" state based on individual permissions
- **Chinese Localization**: Resource and action labels in Traditional Chinese
- **Loading States**: Built-in loading and disabled state handling
- **TypeScript Support**: Full type safety with proper interfaces
- **shadcn/ui Integration**: Uses Table, Checkbox, and Button components

## Usage

### Basic Usage

```tsx
import { PermissionMatrix, type PermissionMatrixType } from "@/components/permissions"

function MyPermissionPage() {
  const [permissions, setPermissions] = useState<PermissionMatrixType[]>([
    {
      resource: "user",
      permissions: { create: true, update: false, delete: false, read: true },
      all: false,
    },
    // ... more resources
  ])

  const handleSave = async () => {
    // Save permissions to API
    console.log("Saving:", permissions)
  }

  return (
    <PermissionMatrix
      permissions={permissions}
      onChange={setPermissions}
      onSave={handleSave}
    />
  )
}
```

### With Loading and Disabled States

```tsx
<PermissionMatrix
  permissions={permissions}
  onChange={setPermissions}
  onSave={handleSave}
  loading={isLoading}
  disabled={isReadOnly}
  className="max-w-4xl"
/>
```

## Props Interface

```typescript
interface PermissionMatrixProps {
  permissions: PermissionMatrix[]
  onChange: (permissions: PermissionMatrix[]) => void
  onSave?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

interface PermissionMatrix {
  resource: string
  permissions: Record<string, boolean>
  all: boolean
}
```

## Supported Resources

- `user` - 用戶管理 (User Management)
- `team` - 團隊管理 (Team Management) 
- `organization` - 組織管理 (Organization Management)
- `report` - 報表管理 (Report Management)
- `store` - 門店管理 (Store Management)
- `game` - 遊戲管理 (Game Management)

## Supported Actions

- `all` - All (toggles all permissions)
- `create` - Create
- `update` - Update  
- `delete` - Delete
- `read` - Read

## Permission Logic

1. **All Column**: When checked, enables all CRUD permissions for that resource
2. **Read Dependency**: When Create, Update, or Delete is checked, Read is automatically enabled
3. **Auto-Update All**: The "All" checkbox reflects whether all individual permissions are enabled

## Demo

Visit `/dashboard/permissions-demo` to see the component in action with interactive controls.

## Files

- `permission-matrix.tsx` - Main component
- `permission-matrix-demo.tsx` - Interactive demo component  
- `index.ts` - Exports and type definitions
- `README.md` - This documentation

## Styling

The component uses shadcn/ui components and follows the project's design system:

- Table with proper spacing and borders
- Centered checkboxes with accessible labels
- Responsive design with proper overflow handling
- Loading states with spinner and disabled styling
- Consistent button styling for save action

## Integration

The component is designed to integrate with the project's new checkbox-based permission system, replacing the complex role-based approach with a simpler table interface for better usability.