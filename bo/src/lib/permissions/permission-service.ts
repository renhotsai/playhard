/**
 * Checkbox-Based Permission Service
 * Simplified permission management using direct permission grants
 */

import { PrismaClient, Permission as PrismaPermission } from "@/generated/prisma";

export type SubjectType = "user" | "team";
export type Resource = "user" | "team" | "organization" | "report" | "store" | "game" | "system_role" | "organization_role" | "permission";
export type Action = "create" | "update" | "delete" | "read";

export interface Permission {
  id: string;
  subjectType: SubjectType;
  subjectId: string;
  resource: Resource;
  action: Action;
  granted: boolean;
  grantedAt: Date;
  grantedBy: string;
}

export interface PermissionMatrix {
  resource: Resource;
  permissions: Record<Action, boolean>;
  all: boolean;
}

export class PermissionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get user's effective permissions (direct + team permissions)
   */
  async getUserEffectivePermissions(userId: string, organizationId?: string): Promise<Permission[]> {
    // Get direct user permissions
    const directPermissions = await this.prisma.permission.findMany({
      where: {
        subjectType: "user",
        subjectId: userId,
        granted: true
      }
    });

    // Get team permissions if user is in organization
    let teamPermissions: PrismaPermission[] = [];
    if (organizationId) {
      const userTeams = await this.prisma.teamMember.findMany({
        where: {
          userId: userId,
          team: {
            organizationId: organizationId
          }
        },
        include: {
          team: true
        }
      });

      const teamIds = userTeams.map(tm => tm.teamId);
      
      teamPermissions = await this.prisma.permission.findMany({
        where: {
          subjectType: "team",
          subjectId: {
            in: teamIds
          },
          granted: true
        }
      });
    }

    // Merge permissions (user permissions take precedence)
    const allPermissions = [...directPermissions, ...teamPermissions];
    const uniquePermissions = this.mergePermissions(allPermissions);
    
    // Cast database results to our Permission type
    return uniquePermissions.map(p => ({
      ...p,
      subjectType: p.subjectType as SubjectType,
      resource: p.resource as Resource,
      action: p.action as Action
    }));
  }

  /**
   * Check if user has specific permission (Better Auth integrated)
   */
  async hasPermission(
    userId: string, 
    resource: Resource, 
    action: Action, 
    organizationId?: string
  ): Promise<boolean> {
    // Layer 1: System Admin Bypass (Better Auth admin plugin)
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user?.role === 'admin') {
      return true; // System admins bypass all checks
    }

    // Layer 2: Organization Permission Limits (System-level restrictions)
    if (organizationId) {
      const isAllowed = await this.isPermissionAllowedInOrganization(
        organizationId, 
        resource, 
        action
      );
      if (!isAllowed) {
        return false; // Hard restriction from system level
      }

      // Layer 2.5: Better Auth Organization Role Gates
      const member = await this.prisma.member.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId
          }
        }
      });

      // Organization owners get enhanced permissions but still go through fine-grained checks
      // This allows for audit trails and granular control even for owners
      if (member?.role === 'owner') {
        // Check if this is a high-privilege action that requires explicit permission
        const requiresExplicitPermission = this.requiresExplicitPermission(resource, action);
        if (!requiresExplicitPermission) {
          return true; // Owner bypass for common operations
        }
      }
    }

    // Layer 3: Fine-grained Permission Check (Custom service)
    const permissions = await this.getUserEffectivePermissions(userId, organizationId);
    
    return permissions.some(p => 
      p.resource === resource && 
      p.action === action && 
      p.granted
    );
  }

  /**
   * Determine if certain actions require explicit permissions even for owners
   */
  private requiresExplicitPermission(resource: Resource, action: Action): boolean {
    // Define actions that require explicit permission even for organization owners
    const explicitPermissionRequired = [
      { resource: 'user', action: 'delete' }, // User deletion always requires explicit permission
      { resource: 'organization', action: 'delete' }, // Org deletion requires explicit permission
      // Add more critical operations as needed
    ];

    return explicitPermissionRequired.some(
      req => req.resource === resource && req.action === action
    );
  }

  /**
   * Grant permission to user or team
   */
  async grantPermission(
    subjectType: SubjectType,
    subjectId: string,
    resource: Resource,
    action: Action,
    grantedBy: string
  ): Promise<Permission> {
    const permission = await this.prisma.permission.upsert({
      where: {
        subjectType_subjectId_resource_action: {
          subjectType,
          subjectId,
          resource,
          action
        }
      },
      update: {
        granted: true,
        grantedAt: new Date(),
        grantedBy
      },
      create: {
        subjectType,
        subjectId,
        resource,
        action,
        granted: true,
        grantedBy
      }
    });

    return {
      ...permission,
      subjectType: permission.subjectType as SubjectType,
      resource: permission.resource as Resource,
      action: permission.action as Action
    };
  }

  /**
   * Revoke permission from user or team
   */
  async revokePermission(
    subjectType: SubjectType,
    subjectId: string,
    resource: Resource,
    action: Action
  ): Promise<void> {
    await this.prisma.permission.deleteMany({
      where: {
        subjectType,
        subjectId,
        resource,
        action
      }
    });
  }

  /**
   * Set multiple permissions at once (for checkbox matrix)
   */
  async setPermissions(
    subjectType: SubjectType,
    subjectId: string,
    permissions: { resource: Resource; action: Action; granted: boolean }[],
    grantedBy: string
  ): Promise<void> {
    const operations = permissions.map(async (perm) => {
      if (perm.granted) {
        return this.grantPermission(
          subjectType,
          subjectId,
          perm.resource,
          perm.action,
          grantedBy
        );
      } else {
        return this.revokePermission(
          subjectType,
          subjectId,
          perm.resource,
          perm.action
        );
      }
    });

    await Promise.all(operations);
  }

  /**
   * Get permission matrix for user or team (for UI display)
   */
  async getPermissionMatrix(
    subjectType: SubjectType,
    subjectId: string
  ): Promise<PermissionMatrix[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        subjectType,
        subjectId,
        granted: true
      }
    });

    const resources: Resource[] = ["user", "team", "organization", "report", "store", "game", "system_role", "organization_role", "permission"];
    const actions: Action[] = ["create", "update", "delete", "read"];

    return resources.map(resource => {
      const resourcePermissions = permissions.filter(p => p.resource === resource);
      const permissionMap: Record<Action, boolean> = {} as Record<Action, boolean>;
      
      actions.forEach(action => {
        permissionMap[action] = resourcePermissions.some(p => p.action === action);
      });

      const all = actions.every(action => permissionMap[action]);

      return {
        resource,
        permissions: permissionMap,
        all
      };
    });
  }

  /**
   * Check if permission is allowed in organization
   */
  async isPermissionAllowedInOrganization(
    organizationId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    const limit = await this.prisma.organizationPermissionLimit.findUnique({
      where: {
        organizationId_resource_action: {
          organizationId,
          resource,
          action
        }
      }
    });

    // If no explicit limit, assume allowed
    return limit?.allowed !== false;
  }

  /**
   * Set organization permission limits
   */
  async setOrganizationPermissionLimits(
    organizationId: string,
    limits: { resource: Resource; action: Action; allowed: boolean }[]
  ): Promise<void> {
    const operations = limits.map(limit =>
      this.prisma.organizationPermissionLimit.upsert({
        where: {
          organizationId_resource_action: {
            organizationId,
            resource: limit.resource,
            action: limit.action
          }
        },
        update: {
          allowed: limit.allowed
        },
        create: {
          organizationId,
          resource: limit.resource,
          action: limit.action,
          allowed: limit.allowed
        }
      })
    );

    await Promise.all(operations);
  }

  /**
   * Merge permissions from different sources (user permissions override team permissions)
   */
  private mergePermissions(permissions: PrismaPermission[]): Permission[] {
    const permissionMap = new Map<string, Permission>();

    permissions.forEach(permission => {
      const key = `${permission.resource}:${permission.action}`;
      const existing = permissionMap.get(key);

      // Convert PrismaPermission to Permission with proper type casting
      const convertedPermission: Permission = {
        ...permission,
        subjectType: permission.subjectType as SubjectType,
        resource: permission.resource as Resource,
        action: permission.action as Action
      };

      // User permissions take precedence over team permissions
      if (!existing || permission.subjectType === "user") {
        permissionMap.set(key, convertedPermission);
      }
    });

    return Array.from(permissionMap.values());
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const permissionService = new PermissionService();