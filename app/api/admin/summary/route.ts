import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date for "recent" items (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // New leads in last 7 days
    const newLeads = await prisma.customer.count({
      where: {
        status: 'LEAD',
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // New active customers in last 7 days
    const newCustomers = await prisma.customer.count({
      where: {
        status: 'ACTIVE',
        closedAt: { gte: sevenDaysAgo }
      }
    });

    // Pending commissions
    const pendingCommissions = await prisma.commission.count({
      where: { status: 'PENDING' }
    });

    const pendingAmount = await prisma.commission.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true }
    });

    // Recently paid commissions (last 7 days)
    const paidCommissions = await prisma.commission.count({
      where: {
        status: 'PAID',
        updatedAt: { gte: sevenDaysAgo }
      }
    });

    const paidAmount = await prisma.commission.aggregate({
      where: {
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
    console.error('Error fetching admin summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
