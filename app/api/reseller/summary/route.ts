import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'RESELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get date for "recent" items (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Reseller's new leads in last 7 days
    const newLeads = await prisma.customer.count({
      where: {
        resellerId: userId,
        status: 'LEAD',
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Reseller's new active customers in last 7 days
    const newCustomers = await prisma.customer.count({
      where: {
        resellerId: userId,
        status: 'ACTIVE',
        closedAt: { gte: sevenDaysAgo }
      }
    });

    // Reseller's pending commissions
    const pendingCommissions = await prisma.commission.count({
      where: {
        resellerId: userId,
        status: 'PENDING'
      }
    });

    const pendingAmount = await prisma.commission.aggregate({
      where: {
        resellerId: userId,
        status: 'PENDING'
      },
      _sum: { amount: true }
    });

    // Reseller's recently paid commissions (last 7 days)
    const paidCommissions = await prisma.commission.count({
      where: {
        resellerId: userId,
        status: 'PAID',
        updatedAt: { gte: sevenDaysAgo }
      }
    });

    const paidAmount = await prisma.commission.aggregate({
      where: {
        resellerId: userId,
        status: 'PAID',
        updatedAt: { gte: sevenDaysAgo }
      },
      _sum: { amount: true }
    });

    return NextResponse.json({
      newLeads,
      newCustomers,
      pendingCommissions,
      totalPendingAmount: pendingAmount._sum.amount || 0,
      paidCommissions,
      totalPaidAmount: paidAmount._sum.amount || 0
    });
  } catch (error) {
    console.error('Error fetching reseller summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
