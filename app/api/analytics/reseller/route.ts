import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { getDateRange, calculateComparison, groupByMonth } from '@/lib/analytics';
import { CommissionStatus, CustomerStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user?.id || user.role !== 'RESELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rangeType = searchParams.get('range') || 'last_30_days';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    // Ensure database connection
    try {
      await prisma.$connect();
    } catch (connectError) {
      console.error('Database connection error:', connectError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again in a moment.' },
        { status: 503 }
      );
    }

    // Get date range
    let dateRange;
    if (customStart && customEnd) {
      dateRange = {
        startDate: new Date(customStart),
        endDate: new Date(customEnd)
      };
    } else {
      dateRange = getDateRange(rangeType);
    }

    // Calculate previous period for comparison
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousRange = {
      startDate: new Date(dateRange.startDate.getTime() - periodLength),
      endDate: new Date(dateRange.startDate.getTime() - 1)
    };

    const userId = user.id;

    // Fetch current period data
    const [customers, commissions, previousCustomers, previousCommissions, allCustomers, allCommissions] = await Promise.all([
      // Current period customers
      prisma.customer.findMany({
        where: {
          resellerId: userId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate
          }
        }
      }),
      // Current period commissions
      prisma.commission.findMany({
        where: {
          resellerId: userId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate
          }
        }
      }),
      // Previous period customers
      prisma.customer.findMany({
        where: {
          resellerId: userId,
          createdAt: {
            gte: previousRange.startDate,
            lte: previousRange.endDate
          }
        }
      }),
      // Previous period commissions
      prisma.commission.findMany({
        where: {
          resellerId: userId,
          createdAt: {
            gte: previousRange.startDate,
            lte: previousRange.endDate
          }
        }
      }),
      // All customers for status breakdown
      prisma.customer.findMany({
        where: {
          resellerId: userId
        }
      }),
      // All commissions for trends
      prisma.commission.findMany({
        where: {
          resellerId: userId,
          createdAt: {
            gte: new Date(dateRange.endDate.getTime() - 365 * 24 * 60 * 60 * 1000), // Last year
            lte: dateRange.endDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    ]);

    // Calculate metrics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === CustomerStatus.ACTIVE).length;
    const newCustomers = customers.length;

    const totalCommissions = commissions.length;
    const paidCommissions = commissions.filter(c => c.status === CommissionStatus.PAID).length;
    const approvedCommissions = commissions.filter(c => c.status === CommissionStatus.APPROVED).length;
    const pendingCommissions = commissions.filter(c => c.status === CommissionStatus.PENDING).length;
    const rejectedCommissions = commissions.filter(c => c.status === CommissionStatus.REJECTED).length;

    const totalRevenue = commissions
      .filter(c => c.status === CommissionStatus.PAID || c.status === CommissionStatus.APPROVED)
      .reduce((sum, c) => sum + c.amount, 0);

    const averageCommission = totalCommissions > 0 ? totalRevenue / totalCommissions : 0;

    // Calculate rates
    const approvalRate = totalCommissions > 0
      ? ((approvedCommissions + paidCommissions) / totalCommissions) * 100
      : 0;
    const rejectionRate = totalCommissions > 0
      ? (rejectedCommissions / totalCommissions) * 100
      : 0;
    const conversionRate = totalCustomers > 0
      ? (activeCustomers / totalCustomers) * 100
      : 0;

    // Calculate comparisons
    const previousTotalRevenue = previousCommissions
      .filter(c => c.status === CommissionStatus.PAID || c.status === CommissionStatus.APPROVED)
      .reduce((sum, c) => sum + c.amount, 0);

    const revenueComparison = calculateComparison(totalRevenue, previousTotalRevenue);
    const customersComparison = calculateComparison(totalCustomers, previousCustomers.length);
    const commissionsComparison = calculateComparison(totalCommissions, previousCommissions.length);

    // Group commissions by month for trend chart
    const monthlyData = groupByMonth(allCommissions);
    const commissionTrend = Array.from(monthlyData.entries())
      .map(([month, items]) => ({
        label: month,
        value: items.reduce((sum, c) => {
          if (c.status === CommissionStatus.PAID || c.status === CommissionStatus.APPROVED) {
            return sum + c.amount;
          }
          return sum;
        }, 0),
        count: items.length
      }))
      .slice(-12); // Last 12 months

    // Customer status breakdown
    const customersByStatus = {
      active: allCustomers.filter(c => c.status === CustomerStatus.ACTIVE).length,
      lead: allCustomers.filter(c => c.status === CustomerStatus.LEAD).length,
      no_deal: allCustomers.filter(c => c.status === CustomerStatus.NO_DEAL).length
    };

    // Commission status breakdown
    const commissionsByStatus = {
      paid: allCommissions.filter(c => c.status === CommissionStatus.PAID).length,
      approved: allCommissions.filter(c => c.status === CommissionStatus.APPROVED).length,
      pending: allCommissions.filter(c => c.status === CommissionStatus.PENDING).length,
      rejected: allCommissions.filter(c => c.status === CommissionStatus.REJECTED).length
    };

    // Top customers by commission
    const customerCommissions = await prisma.customer.findMany({
      where: {
        resellerId: userId
      },
      include: {
        commissions: {
          where: {
            status: {
              in: [CommissionStatus.PAID, CommissionStatus.APPROVED]
            }
          }
        }
      }
    });

    const topCustomers = customerCommissions
      .map(customer => ({
        id: customer.id,
        name: customer.companyName,
        value: customer.commissions.reduce((sum, c) => sum + c.amount, 0)
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((customer, index) => ({
        ...customer,
        rank: index + 1
      }));

    return NextResponse.json({
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      },
      metrics: {
        totalCustomers,
        activeCustomers,
        newCustomers,
        totalCommissions,
        paidCommissions,
        approvedCommissions,
        pendingCommissions,
        rejectedCommissions,
        totalRevenue,
        averageCommission,
        conversionRate,
        approvalRate,
        rejectionRate
      },
      comparisons: {
        revenue: revenueComparison,
        customers: customersComparison,
        commissions: commissionsComparison
      },
      trends: {
        commissionTrend,
        customersByStatus,
        commissionsByStatus
      },
      topPerformers: {
        customers: topCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching reseller analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
