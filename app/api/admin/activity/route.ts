import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { getRecentActivity } from '@/lib/audit-log';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get recent activity from audit logs
    const recentActivity = await getRecentActivity(limit);

    // Get pending approvals count
    const pendingApprovalsCount = await prisma.commission.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get recent logins (users who logged in recently)
    const recentLogins = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLoginAt: true,
        role: true,
      },
      orderBy: {
        lastLoginAt: 'desc',
      },
      take: 10,
    });

    // Get active users count (logged in within last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const activeUsersCount = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Get system stats
    const [totalUsers, totalCustomers, totalCommissions, pendingCommissions] = await Promise.all([
      prisma.user.count({ where: { role: 'RESELLER', status: 'ACTIVE' } }),
      prisma.customer.count(),
      prisma.commission.count(),
      prisma.commission.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      recentActivity,
      pendingApprovals: pendingApprovalsCount,
      recentLogins,
      activeUsers: activeUsersCount,
      stats: {
        totalUsers,
        totalCustomers,
        totalCommissions,
        pendingCommissions,
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}
