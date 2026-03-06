import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { isSystemAdmin } from "@/lib/permissions";

const prisma = new PrismaClient();

/**
 * System-level Analytics API
 * Only accessible by system administrators (user.role = 'admin')
 * Provides cross-brand analytics and insights
 */

// GET /api/system/analytics - Get system-wide analytics (system admin only)
export async function GET(request: NextRequest) {
  try {
    // Validate system admin session
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user || !isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "System admin privileges required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const orgId = searchParams.get('organizationId');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Base filters
    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    const orgFilter = orgId ? { organizationId: orgId } : {};

    // Fetch comprehensive system analytics
    const [
      totalUsers,
      totalOrganizations,
      totalTeams,
      recentUsers,
      recentOrganizations,
      activeUsers,
      organizationGrowth,
      userRoleDistribution,
      organizationStats
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.organization.count(),
      prisma.team.count(),

      // Recent activity
      prisma.user.count({
        where: dateFilter
      }),
      prisma.organization.count({
        where: dateFilter
      }),

      // Active users (with sessions in period)
      prisma.user.count({
        where: {
          sessions: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }),

      // Organization growth over time
      prisma.organization.groupBy({
        by: ['createdAt'],
        _count: true,
        where: dateFilter,
        orderBy: {
          createdAt: 'asc'
        }
      }),

      // User role distribution
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),

      // Organization statistics
      prisma.organization.findMany({
        where: orgId ? { id: orgId } : {},
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              teams: true,
              invitations: {
                where: {
                  status: 'pending'
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: orgId ? undefined : 10 // Top 10 organizations if not filtered
      })
    ]);

    // Process organization growth data
    const growthData = organizationGrowth.reduce((acc, item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + item._count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period));

    const [previousPeriodUsers, previousPeriodOrgs] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.organization.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      })
    ]);

    // Calculate percentage changes
    const userGrowthRate = previousPeriodUsers > 0 
      ? ((recentUsers - previousPeriodUsers) / previousPeriodUsers * 100)
      : (recentUsers > 0 ? 100 : 0);

    const orgGrowthRate = previousPeriodOrgs > 0 
      ? ((recentOrganizations - previousPeriodOrgs) / previousPeriodOrgs * 100)
      : (recentOrganizations > 0 ? 100 : 0);

    // Transform role distribution
    const roleDistribution = userRoleDistribution.reduce((acc, item) => {
      acc[item.role || 'member'] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Top organizations by activity
    const topOrganizations = organizationStats.map(org => ({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      metrics: {
        totalMembers: org._count.members,
        totalTeams: org._count.teams,
        pendingInvitations: org._count.invitations,
        activityScore: org._count.members * 2 + org._count.teams * 1.5 + org._count.invitations * 0.5
      }
    })).sort((a, b) => b.metrics.activityScore - a.metrics.activityScore);

    const analytics = {
      overview: {
        totalUsers,
        totalOrganizations,
        totalTeams,
        activeUsers,
        period: `${period} days`
      },
      growth: {
        newUsers: recentUsers,
        newOrganizations: recentOrganizations,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        organizationGrowthRate: Math.round(orgGrowthRate * 100) / 100
      },
      userDistribution: {
        byRole: roleDistribution,
        activeUserPercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers * 100) * 100) / 100 : 0
      },
      organizationInsights: {
        averageMembersPerOrg: totalOrganizations > 0 ? Math.round((totalUsers / totalOrganizations) * 100) / 100 : 0,
        averageTeamsPerOrg: totalOrganizations > 0 ? Math.round((totalTeams / totalOrganizations) * 100) / 100 : 0,
        topOrganizations: topOrganizations.slice(0, 5)
      },
      timeline: {
        organizationGrowth: growthData
      },
      generatedAt: new Date().toISOString(),
      filters: {
        period: parseInt(period),
        organizationId: orgId || null
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error("System analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}