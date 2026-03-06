/**
 * Debug API to check and set user roles
 * Temporary endpoint for debugging role issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 Debug: Checking all user roles...');
    
    // Get all users and their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        members: {
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.role,
        organizations: user.members.map(member => ({
          organizationId: member.organization.id,
          organizationName: member.organization.name,
          organizationRole: member.role,
          joinedAt: member.createdAt
        }))
      }))
    });
  } catch (error) {
    console.error('Error getting user roles:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, systemRole } = await request.json();

    if (!email || !systemRole) {
      return NextResponse.json({
        success: false,
        error: 'Email and systemRole are required'
      }, { status: 400 });
    }

    // Update user system role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: systemRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${email} system role to ${systemRole}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}