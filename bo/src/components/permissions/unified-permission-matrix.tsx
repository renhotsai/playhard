"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingState } from "@/components/ui/loading-state"
import { cn } from "@/lib/utils"
import { useResourcePermissions } from "@/hooks/use-unified-permissions"
import { type Resource, type Action } from "@/lib/permissions/permission-service"

// Enhanced permission matrix integrating unified permission system
export interface UnifiedPermissionMatrixProps {
  subjectType: 'user' | 'team'
  subjectId: string
  organizationId?: string
  onPermissionChange?: (resource: Resource, action: Action, granted: boolean) => void
  onSave?: () => void
  disabled?: boolean
  className?: string
}

const RESOURCES: Record<Resource, string> = {
  user: "用戶管理",
  team: "團隊管理", 
  organization: "組織管理",
  report: "報表管理",
  store: "門店管理",
  game: "遊戲管理",
}

const ACTIONS: Record<Action | 'all', string> = {
  all: "All",
  create: "Create",
  update: "Update", 
  delete: "Delete",
  read: "Read",
}

const ACTION_ORDER: (Action | 'all')[] = ["all", "create", "update", "delete", "read"]

export function UnifiedPermissionMatrix({
  subjectType,
  subjectId,
  organizationId,
  onPermissionChange,
  onSave,
  disabled = false,
  className,
}: UnifiedPermissionMatrixProps) {
  const [localPermissions, setLocalPermissions] = React.useState<Record<string, Record<Action, boolean>>>({})
  const [loading, setLoading] = React.useState(false)

  // Get effective permissions for each resource using unified system
  const userPermissions = useResourcePermissions('user', organizationId)
  const teamPermissions = useResourcePermissions('team', organizationId)
  const organizationPermissions = useResourcePermissions('organization', organizationId)
  const reportPermissions = useResourcePermissions('report', organizationId)
  const storePermissions = useResourcePermissions('store', organizationId)
  const gamePermissions = useResourcePermissions('game', organizationId)

  const resourcePermissions = {
    user: userPermissions.data,
    team: teamPermissions.data,
    organization: organizationPermissions.data,
    report: reportPermissions.data,
    store: storePermissions.data,
    game: gamePermissions.data,
  }

  const isLoading = userPermissions.isLoading || teamPermissions.isLoading || 
                   organizationPermissions.isLoading || reportPermissions.isLoading ||
                   storePermissions.isLoading || gamePermissions.isLoading

  // Helper function to check if all permissions are selected for a resource
  const calculateAllState = (resourcePerms: Record<Action, boolean>): boolean => {
    const actions: Action[] = ['create', 'update', 'delete', 'read']
    return actions.every(action => resourcePerms[action] === true)
  }

  // Handle permission change
  const handlePermissionChange = (resource: Resource, action: Action | 'all', checked: boolean) => {
    if (disabled || loading) return

    const newPermissions = { ...localPermissions }
    if (!newPermissions[resource]) {
      newPermissions[resource] = { create: false, update: false, delete: false, read: false }
    }

    if (action === 'all') {
      // Toggle all permissions
      const actions: Action[] = ['create', 'update', 'delete', 'read']
      actions.forEach(a => {
        newPermissions[resource][a] = checked
        onPermissionChange?.(resource, a, checked)
      })
    } else {
      // Update individual permission
      newPermissions[resource][action] = checked
      
      // Auto-enable read when other actions are enabled
      if (checked && ['create', 'update', 'delete'].includes(action)) {
        newPermissions[resource].read = true
        onPermissionChange?.(resource, 'read', true)
      }
      
      onPermissionChange?.(resource, action, checked)
    }

    setLocalPermissions(newPermissions)
  }

  // Get effective permission state (local override or unified system result)
  const getPermissionState = (resource: Resource, action: Action | 'all') => {
    const localResourcePerms = localPermissions[resource]
    const unifiedResourcePerms = resourcePermissions[resource]

    if (action === 'all') {
      if (localResourcePerms) {
        return calculateAllState(localResourcePerms)
      }
      return unifiedResourcePerms ? Object.values(unifiedResourcePerms).every(p => p.granted) : false
    }

    if (localResourcePerms) {
      return localResourcePerms[action as Action]
    }

    return unifiedResourcePerms?.[action as Action]?.granted ?? false
  }

  // Get permission reason (for display)
  const getPermissionReason = (resource: Resource, action: Action) => {
    if (localPermissions[resource]?.[action] !== undefined) {
      return 'local_override' // Local change not yet saved
    }
    return resourcePermissions[resource]?.[action]?.reason
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave?.()
      // Clear local overrides after successful save
      setLocalPermissions({})
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <LoadingState message="載入權限設定中..." />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Permission context info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">
          {subjectType === 'user' ? '用戶' : '團隊'}: {subjectId}
        </Badge>
        {organizationId && (
          <Badge variant="outline">
            組織: {organizationId}
          </Badge>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] font-semibold">資源</TableHead>
              {ACTION_ORDER.map((action) => (
                <TableHead key={action} className="text-center font-semibold min-w-[80px]">
                  {ACTIONS[action]}
                </TableHead>
              ))}
              <TableHead className="w-[120px] font-semibold">權限來源</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Object.keys(RESOURCES) as Resource[]).map((resource) => {
              const resourceLabel = RESOURCES[resource]
              
              return (
                <TableRow key={resource}>
                  <TableCell className="font-medium">
                    {resourceLabel}
                  </TableCell>
                  {ACTION_ORDER.map((action) => {
                    const isChecked = getPermissionState(resource, action)
                    const isLocalOverride = action !== 'all' && 
                      localPermissions[resource]?.[action as Action] !== undefined
                    
                    return (
                      <TableCell key={action} className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(resource, action, checked === true)
                            }
                            disabled={disabled || loading}
                            aria-label={`${resourceLabel} ${ACTIONS[action]} 權限`}
                            className={cn(
                              isLocalOverride && "ring-2 ring-blue-500/20"
                            )}
                          />
                        </div>
                      </TableCell>
                    )
                  })}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {(['read', 'create', 'update', 'delete'] as Action[]).map(action => {
                        const reason = getPermissionReason(resource, action)
                        const isGranted = getPermissionState(resource, action)
                        if (!isGranted) return null
                        
                        return (
                          <Badge 
                            key={action}
                            variant={reason === 'system_admin' ? 'default' : 
                                   reason === 'organization_role' ? 'secondary' :
                                   reason === 'fine_grained' ? 'outline' :
                                   reason === 'local_override' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {action}: {
                              reason === 'system_admin' ? '系統管理員' :
                              reason === 'organization_role' ? '組織角色' :
                              reason === 'fine_grained' ? '細粒度權限' :
                              reason === 'local_override' ? '待儲存' :
                              '未知'
                            }
                          </Badge>
                        )
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Show pending changes */}
      {Object.keys(localPermissions).length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm font-medium text-blue-900 mb-1">
            待儲存的變更:
          </div>
          <div className="text-xs text-blue-700">
            {Object.entries(localPermissions).map(([resource, perms]) => (
              <div key={resource}>
                {RESOURCES[resource as Resource]}: {
                  Object.entries(perms)
                    .filter(([_, granted]) => granted)
                    .map(([action, _]) => ACTIONS[action as Action])
                    .join(', ')
                }
              </div>
            ))}
          </div>
        </div>
      )}
      
      {onSave && (
        <div className="flex justify-end gap-2">
          {Object.keys(localPermissions).length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setLocalPermissions({})}
              disabled={disabled || loading}
            >
              取消變更
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={disabled || loading || Object.keys(localPermissions).length === 0}
            className="min-w-[100px]"
          >
            {loading ? "儲存中..." : "儲存設定"}
          </Button>
        </div>
      )}
    </div>
  )
}

// Export for use in other components
export { RESOURCES, ACTIONS, ACTION_ORDER }