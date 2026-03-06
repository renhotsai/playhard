"use client"

import * as React from "react"
import { PermissionMatrix, type PermissionMatrix as PermissionMatrixType } from "./permission-matrix"

/**
 * Demo component showing how to use the PermissionMatrix component
 * This is an example implementation for testing and reference
 */
export function PermissionMatrixDemo() {
  const [permissions, setPermissions] = React.useState<PermissionMatrixType[]>([
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
      resource: "organization",
      permissions: { create: true, update: true, delete: true, read: true },
      all: true,
    },
    {
      resource: "report",
      permissions: { create: false, update: false, delete: false, read: true },
      all: false,
    },
    {
      resource: "store",
      permissions: { create: false, update: false, delete: false, read: false },
      all: false,
    },
    {
      resource: "game",
      permissions: { create: false, update: false, delete: false, read: false },
      all: false,
    },
  ])

  const [loading, setLoading] = React.useState(false)
  const [disabled, setDisabled] = React.useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log("Saving permissions:", permissions)
      alert("權限設定已儲存！")
    } catch (error) {
      console.error("Error saving permissions:", error)
      alert("儲存失敗，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">權限管理</h2>
        <p className="text-muted-foreground">
          設定使用者或角色的系統權限。勾選「All」可快速選取該資源的所有權限。
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setDisabled(!disabled)}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          {disabled ? "啟用編輯" : "停用編輯"}
        </button>
        <button
          onClick={() => setLoading(!loading)}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          {loading ? "停止載入" : "模擬載入"}
        </button>
      </div>

      <PermissionMatrix
        permissions={permissions}
        onChange={setPermissions}
        onSave={handleSave}
        disabled={disabled}
        loading={loading}
        className="max-w-4xl"
      />

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">當前權限設定 (JSON):</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </div>
    </div>
  )
}