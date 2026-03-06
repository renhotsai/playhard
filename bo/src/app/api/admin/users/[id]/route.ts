/**
 * System Admin User Management API - Individual User Operations
 * Handles GET, PUT, and DELETE operations for specific users
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Check authentication using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'System admin access required' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        _count: {
          select: {
            sessions: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('[Admin User API] Failed to fetch user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Check authentication using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'System admin access required' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sessions: true,
            members: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent self-deletion
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Use transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // Delete all user sessions first
      await tx.session.deleteMany({
        where: { userId: id }
      });

      // Delete all organization memberships
      await tx.member.deleteMany({
        where: { userId: id }
      });

      // Delete all team memberships
      await tx.teamMember.deleteMany({
        where: { userId: id }
      });

      // Delete user accounts (OAuth, passwords, etc.)
      await tx.account.deleteMany({
        where: { userId: id }
      });

      // Delete verification records
      await tx.verification.deleteMany({
        where: { identifier: existingUser.email }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      success: true,
      message: `User ${existingUser.name || existingUser.email} has been successfully deleted`,
      data: {
        deletedUser: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          deletedSessions: existingUser._count.sessions,
          deletedMemberships: existingUser._count.members
        }
      }
    });

  } catch (error) {
    console.error('[Admin User API] Failed to delete user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}