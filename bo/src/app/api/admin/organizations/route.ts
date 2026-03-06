/**
 * System Admin Organizations API
 * Enhanced endpoint for hierarchical role selection feature
 * Provides comprehensive organization data with member counts, role distribution, and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// Enhanced response interfaces for role selection feature
interface RoleDistribution {
  owner: number;
  admin: number;
  gm: number;
  staff: number;
  player: number;
}

interface EnhancedOrganization {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  roleDistribution: RoleDistribution;
  status: 'active' | 'inactive' | 'pending';
  canAssignRoles: boolean;
  createdAt: string;
  metadata?: {
    createdBy?: string;
    description?: string;
    gameType?: string;
  };
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface EnhancedOrganizationsResponse {
  success?: boolean;
  organizations: EnhancedOrganization[];
  pagination: PaginationInfo;
  error?: {
    message: string;
  };
}


export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Check authentication using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false,
          error: { message: 'Authentication required' },
          organizations: [],
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
        },
        { status: 401 }
      );
    }

    // Check system admin authorization  
    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { 
          success: false,
          error: { message: 'System administrator access required' },
          organizations: [],
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
        },
        { status: 403 }
      );
    }

    // Parse query parameters with validation
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    const minMembersParam = url.searchParams.get('minMembers');

    // Validate and parse numeric parameters
    let limit = 50; // default
    let offset = 0; // default
    let minMembers: number | undefined;

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Invalid query parameters: limit must be between 1 and 100' },
            organizations: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
          },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Invalid query parameters: offset must be >= 0' },
            organizations: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
          },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    if (minMembersParam) {
      const parsedMinMembers = parseInt(minMembersParam, 10);
      if (isNaN(parsedMinMembers) || parsedMinMembers < 0) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Invalid query parameters: minMembers must be >= 0' },
            organizations: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
          },
          { status: 400 }
        );
      }
      minMembers = parsedMinMembers;
    }

    // Validate status parameter
    if (status && !['active', 'inactive', 'pending'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid query parameters: status must be active, inactive, or pending' },
          organizations: [],
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
        },
        { status: 400 }
      );
    }

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.organization.count({
      where: whereClause
    });

    // Fetch organizations with enhanced data and member relationships
    const organizations = await prisma.organization.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        metadata: true,
        members: {
          select: {
            role: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      skip: offset,
      take: limit
    });

    // Transform to enhanced interface with role distribution
    let enhancedOrganizations: EnhancedOrganization[] = organizations.map(org => {
      // Calculate role distribution
      const roleDistribution: RoleDistribution = {
        owner: 0,
        admin: 0,
        gm: 0,
        staff: 0,
        player: 0
      };

      org.members.forEach(member => {
        const role = member.role;
        if (role in roleDistribution) {
          roleDistribution[role as keyof RoleDistribution]++;
        }
      });

      // Parse metadata
      let parsedMetadata;
      try {
        parsedMetadata = org.metadata ? JSON.parse(org.metadata as string) : undefined;
      } catch (error) {
        console.warn(`Failed to parse metadata for organization ${org.id}:`, error);
        parsedMetadata = undefined;
      }

      // Determine organization status (for now, all are active - this could be enhanced with actual status field)
      const orgStatus: 'active' | 'inactive' | 'pending' = 'active';
      
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        memberCount: org._count.members,
        roleDistribution,
        status: orgStatus,
        canAssignRoles: true, // System admin can assign roles to all organizations
        createdAt: org.createdAt.toISOString(),
        ...(parsedMetadata && { metadata: parsedMetadata })
      };
    });

    // Apply post-query filters
    if (status) {
      enhancedOrganizations = enhancedOrganizations.filter(org => org.status === status);
    }

    if (minMembers !== undefined) {
      enhancedOrganizations = enhancedOrganizations.filter(org => org.memberCount >= minMembers);
    }

    // Calculate pagination info
    const hasMore = offset + limit < totalCount;
    
    const response: EnhancedOrganizationsResponse = {
      organizations: enhancedOrganizations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore
      }
    };

    // Performance check
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    if (responseTime > 500) {
      console.warn(`[Admin Organizations API] Slow response: ${responseTime}ms`);
    }

    // Return response with appropriate cache headers
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes cache
        'X-Response-Time': `${responseTime.toFixed(2)}ms`
      }
    });

  } catch (error) {
    console.error('[Admin Organizations API] Failed to fetch organizations:', error);
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return NextResponse.json(
      { 
        success: false,
        error: { 
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        organizations: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
      },
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime.toFixed(2)}ms`
        }
      }
    );
  } finally {
  }
}