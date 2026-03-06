"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

// Type definitions
export interface PermissionMatrix {
  resource: string
  permissions: Record<string, boolean>
  all: boolean
}

export interface PermissionMatrixProps {
  permissions: PermissionMatrix[]
  onChange: (permissions: PermissionMatrix[]) => void
  onSave?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

// Resource and action definitions  
const RESOURCES = {
  users: "Users",
  teams: "Teams", 
  organizations: "Organizations",
  scripts: "Scripts",
  sessions: "Sessions",
  reports: "Reports",
  stores: "Stores",
  games: "Games",
} as const

const ACTIONS = {
  all: "All",
  create: "Create",
  update: "Update", 
  delete: "Delete",
  read: "Read",
} as const

const ACTION_ORDER = ["all", "create", "update", "delete", "read"] as const

type ResourceKey = keyof typeof RESOURCES
type ActionKey = keyof typeof ACTIONS

export function PermissionMatrix({
  permissions,
  onChange,
  onSave,
  disabled = false,
  loading = false,
  className,
}: PermissionMatrixProps) {
  
  // Helper function to check if all permissions are selected for a resource
  const calculateAllState = (resourcePermissions: Record<string, boolean>): boolean => {
    const actionKeys = ACTION_ORDER.filter(action => action !== "all")
    return actionKeys.every(action => resourcePermissions[action] === true)
  }

  // Helper function to update read permission when other permissions change
  const updateReadDependency = (
    resourcePermissions: Record<string, boolean>,
    action: string,
    checked: boolean
  ): Record<string, boolean> => {
    const updated = { ...resourcePermissions, [action]: checked }
    
    // If any CRUD action is checked, automatically check read
    if (checked && ["create", "update", "delete"].includes(action)) {
      updated.read = true
    }
    
    return updated
  }

  // Handle individual permission change
  const handlePermissionChange = (resourceIndex: number, action: string, checked: boolean) => {
    if (disabled || loading) return

    const newPermissions = [...permissions]
    const resource = newPermissions[resourceIndex]
    
    if (action === "all") {
      // Toggle all permissions
      const actionKeys = ACTION_ORDER.filter(a => a !== "all")
      const updatedPermissions: Record<string, boolean> = {}
      
      actionKeys.forEach(a => {
        updatedPermissions[a] = checked
      })
      
      resource.permissions = updatedPermissions
      resource.all = checked
    } else {
      // Update individual permission with read dependency
      resource.permissions = updateReadDependency(resource.permissions, action, checked)
      
      // Update "all" state based on individual permissions
      resource.all = calculateAllState(resource.permissions)
    }
    
    onChange(newPermissions)
  }

  // Initialize permissions if needed
  React.useEffect(() => {
    const resourceKeys = Object.keys(RESOURCES) as ResourceKey[]
    const hasAllResources = resourceKeys.every(resourceKey => 
      permissions.some(p => p.resource === resourceKey)
    )
    
    if (!hasAllResources) {
      const initialPermissions: PermissionMatrix[] = resourceKeys.map(resourceKey => {
        const existing = permissions.find(p => p.resource === resourceKey)
        if (existing) return existing
        
        const defaultPermissions: Record<string, boolean> = {}
        ACTION_ORDER.filter(a => a !== "all").forEach(action => {
          defaultPermissions[action] = false
        })
        
        return {
          resource: resourceKey,
          permissions: defaultPermissions,
          all: false,
        }
      })
      
      onChange(initialPermissions)
    }
  }, [permissions, onChange])

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <LoadingState message="Loading permissions..." />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] font-semibold">Resource</TableHead>
              {ACTION_ORDER.map((action) => (
                <TableHead key={action} className="text-center font-semibold min-w-[80px]">
                  {ACTIONS[action as ActionKey]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission, index) => {
              const resourceLabel = RESOURCES[permission.resource as ResourceKey] || permission.resource
              
              return (
                <TableRow key={permission.resource}>
                  <TableCell className="font-medium">
                    {resourceLabel}
                  </TableCell>
                  {ACTION_ORDER.map((action) => {
                    const isChecked = action === "all" 
                      ? permission.all 
                      : permission.permissions[action] || false
                    
                    return (
                      <TableCell key={action} className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(index, action, checked === true)
                            }
                            disabled={disabled}
                            aria-label={`${resourceLabel} ${ACTIONS[action as ActionKey]} permission`}
                          />
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      {onSave && (
        <div className="flex justify-end">
          <Button 
            onClick={onSave}
            disabled={disabled || loading}
            className="min-w-[100px]"
          >
            {loading ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      )}
    </div>
  )
}

// Export types and constants for external use
export { RESOURCES, ACTIONS, ACTION_ORDER }
export type { ResourceKey, ActionKey }