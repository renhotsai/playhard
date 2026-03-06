/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePermissions, usePermissionChecks } from '@/hooks/use-permissions'
import { isSystemAdmin } from '@/lib/permissions'

// Mock the auth client
const mockUseSession = jest.fn()
jest.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession()
}))

// Mock the permissions utility
jest.mock('@/lib/permissions', () => ({
  isSystemAdmin: jest.fn()
}))

const mockIsSystemAdmin = isSystemAdmin as jest.MockedFunction<typeof isSystemAdmin>

// Test wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePermissions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty permissions for unauthenticated user', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isLoading: false
    })

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.permissions).toEqual([])
    expect(result.current.isSystemAdmin).toBe(false)
  })

  it('should return loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isLoading: true
    })

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper()
    })

    expect(result.current.loading).toBe(true)
  })

  it('should return all permissions for system admin', async () => {
    const mockAdmin = {
      user: {
        id: 'admin-id',
        role: 'admin'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockAdmin,
      isLoading: false
    })
    mockIsSystemAdmin.mockReturnValue(true)

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isSystemAdmin).toBe(true)
    expect(result.current.permissions.length).toBeGreaterThan(0)
    
    // Check that all permissions are granted for system admin
    result.current.permissions.forEach(permission => {
      expect(permission.granted).toBe(true)
    })

    // Check that all resources are included
    const resources = result.current.permissions.map(p => p.resource)
    expect(resources).toContain('user')
    expect(resources).toContain('organization')
    expect(resources).toContain('permission')
    expect(resources).toContain('system_role')
    expect(resources).toContain('organization_role')
  })

  it('should return basic permissions for regular user', async () => {
    const mockUser = {
      user: {
        id: 'user-id',
        role: 'member'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockUser,
      isLoading: false
    })
    mockIsSystemAdmin.mockReturnValue(false)

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isSystemAdmin).toBe(false)
    expect(result.current.permissions.length).toBeGreaterThan(0)

    // Check that basic read permissions are granted
    const readPermissions = result.current.permissions.filter(p => 
      p.action === 'read' && ['user', 'organization', 'script'].includes(p.resource)
    )
    readPermissions.forEach(permission => {
      expect(permission.granted).toBe(true)
    })

    // Check that admin-only permissions are denied
    const adminPermissions = result.current.permissions.filter(p => 
      ['system_role', 'organization_role', 'permission'].includes(p.resource)
    )
    adminPermissions.forEach(permission => {
      expect(permission.granted).toBe(false)
    })
  })

  it('should provide hasPermission utility function', async () => {
    const mockAdmin = {
      user: {
        id: 'admin-id',
        role: 'admin'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockAdmin,
      isLoading: false
    })
    mockIsSystemAdmin.mockReturnValue(true)

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Test hasPermission function
    expect(result.current.hasPermission('user', 'read')).toBe(true)
    expect(result.current.hasPermission('user', 'create')).toBe(true)
    expect(result.current.hasPermission('permission', 'read')).toBe(true)
  })

  it('should handle organizationId option', async () => {
    const mockUser = {
      user: {
        id: 'user-id',
        role: 'member'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockUser,
      isLoading: false
    })
    mockIsSystemAdmin.mockReturnValue(false)

    const { result } = renderHook(() => usePermissions({ organizationId: 'org-123' }), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.permissions.length).toBeGreaterThan(0)
  })

  it('should support enabled option', () => {
    const mockUser = {
      user: {
        id: 'user-id',
        role: 'member'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockUser,
      isLoading: false
    })

    const { result } = renderHook(() => usePermissions({ enabled: false }), {
      wrapper: createWrapper()
    })

    // When disabled, should not fetch permissions
    expect(result.current.loading).toBe(false)
    expect(result.current.permissions).toEqual([])
  })
})

describe('usePermissionChecks Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return permission check functions for system admin', async () => {
    const mockAdmin = {
      user: {
        id: 'admin-id',
        role: 'admin'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockAdmin,
      isLoading: false
    })
    mockIsSystemAdmin.mockReturnValue(true)

    const { result } = renderHook(() => usePermissionChecks(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSystemAdmin).toBe(true)
    })

    // All permission checks should return true for system admin
    expect(result.current.canCreateUsers).toBe(true)
    expect(result.current.canViewUsers).toBe(true)
    expect(result.current.canUpdateUsers).toBe(true)
    expect(result.current.canDeleteUsers).toBe(true)
    expect(result.current.canViewPermissions).toBe(true)
    expect(result.current.canViewSystemRoles).toBe(true)
    expect(result.current.canViewOrgRoles).toBe(true)
  })

  it('should return appropriate permissions for regular user', async () => {
    const mockUser = {
      user: {
        id: 'user-id',
        role: 'member'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockUser,
      isLoading: false
    })
    mockIsSystemAdmin.mockReturnValue(false)

    const { result } = renderHook(() => usePermissionChecks(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSystemAdmin).toBe(false)
    })

    // Regular users should have read permissions but not admin permissions
    expect(result.current.canViewUsers).toBe(true)
    expect(result.current.canViewOrganizations).toBe(true)
    expect(result.current.canViewScripts).toBe(true)
    
    // But not admin-level permissions
    expect(result.current.canViewPermissions).toBe(false)
    expect(result.current.canViewSystemRoles).toBe(false)
    expect(result.current.canViewOrgRoles).toBe(false)
    expect(result.current.canCreateUsers).toBe(false)
    expect(result.current.canDeleteUsers).toBe(false)
  })

  it('should handle organizationId parameter', async () => {
    const mockUser = {
      user: {
        id: 'user-id',
        role: 'member'
      }
    }

    mockUseSession.mockReturnValue({
      data: mockUser,
      isLoading: false
    })
    mockIsSystemAdmin.mockReturnValue(false)

    const { result } = renderHook(() => usePermissionChecks('org-123'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSystemAdmin).toBe(false)
    })

    // Should still work with organization ID
    expect(result.current.canViewUsers).toBe(true)
    expect(result.current.canViewOrganizations).toBe(true)
  })

  it('should return false for all permissions when user is null', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isLoading: false
    })

    const { result } = renderHook(() => usePermissionChecks(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSystemAdmin).toBe(false)
    })

    // All permissions should be false for unauthenticated user
    expect(result.current.canCreateUsers).toBe(false)
    expect(result.current.canViewUsers).toBe(false)
    expect(result.current.canUpdateUsers).toBe(false)
    expect(result.current.canDeleteUsers).toBe(false)
    expect(result.current.canViewPermissions).toBe(false)
    expect(result.current.canViewSystemRoles).toBe(false)
    expect(result.current.canViewOrgRoles).toBe(false)
  })
})