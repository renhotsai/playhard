import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  // Get session and check authentication
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100); // Max 100 items
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search')?.trim() || '';
  const orderBy = url.searchParams.get('orderBy') || 'name';
  const orderDir = url.searchParams.get('orderDir') === 'desc' ? 'desc' : 'asc';

  // System admins can see all organizations  
  if (isSystemAdmin(session.user.role || '')) {
    try {
      // For system admin: get all organizations using Prisma
      const { PrismaClient } = await import("@/generated/prisma");
      const prisma = new PrismaClient();
      
      // Build search filter
      const searchFilter = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ]
      } : {};

      // Build orderBy object
      const orderByClause = orderBy === 'memberCount' 
        ? { members: { _count: orderDir } }
        : { [orderBy]: orderDir };

      const allOrganizations = await prisma.organization.findMany({
        where: searchFilter,
        include: {
          members: true,
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: orderByClause,
        // Don't apply pagination here for system admin - we'll do it manually for consistency
      });
      
      await prisma.$disconnect();

      // Better Auth returns data directly, not wrapped
      if (!allOrganizations || allOrganizations.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }

      const transformedOrganizations = allOrganizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug || '',
        createdAt: org.createdAt,
        memberCount: org.members?.length || 0,
        pendingInvitationsCount: 0, // Will be fetched separately if needed
        members: org.members || [],
        pendingInvitations: []
      }));

      // Apply manual pagination to the results
      const total = transformedOrganizations.length;
      const paginatedData = transformedOrganizations.slice(offset, offset + limit);

      return NextResponse.json({
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching organizations for admin:', error);
      return NextResponse.json({
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }
  }

  // Regular users: get their organizations only
  // Better Auth organization plugin provides user organizations through session context
  let userOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    members?: Array<unknown>;
  }> = [];
  
  try {
    // Skip the active organization check since we'll get all from Prisma anyway
    
    // For Better Auth compliance: Use Prisma to get all user organizations
    // This is the recommended approach when Better Auth doesn't provide the specific API
    const { PrismaClient } = await import("@/generated/prisma");
    const prisma = new PrismaClient();
    
    // Build search filter for regular users
    const userSearchFilter = search ? {
      AND: [
        { userId: session.user.id },
        {
          organization: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
            ]
          }
        }
      ]
    } : { userId: session.user.id };

    const membershipOrgs = await prisma.member.findMany({
      where: userSearchFilter,
      include: {
        organization: true
      },
      orderBy: {
        organization: {
          [orderBy]: orderDir
        }
      }
    });
    
    // Override previous organizations with complete list from database
    userOrganizations = membershipOrgs.map(member => ({
      id: member.organization.id,
      name: member.organization.name,
      slug: member.organization.slug || '',
      createdAt: member.organization.createdAt,
      members: [] // Will be populated if needed
    }));
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    userOrganizations = [];
  }

  if (!userOrganizations || userOrganizations.length === 0) {
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    });
  }

  // Transform the data to match our expected format
  const transformedOrganizations = userOrganizations.filter(org => org != null).map((org: { 
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    members?: Array<unknown>;
  }) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    memberCount: org.members?.length || 0,
    pendingInvitationsCount: 0, // Will be fetched separately if needed
    members: org.members || [],
    pendingInvitations: []
  }));

  // Apply pagination to user organizations
  const total = transformedOrganizations.length;
  const paginatedData = transformedOrganizations.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
}