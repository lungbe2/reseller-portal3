import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications/notification-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.id;

    // Get customer with commissions
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        reseller: {
          select: { id: true, name: true },
        },
        commissions: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only end contract for active customers' },
        { status: 400 }
      );
    }

    // Update all pending/approved commissions to CONTRACT_ENDED
    const result = await prisma.$transaction(async (tx) => {
      // Mark all pending/approved commissions as CONTRACT_ENDED
      const updatedCommissions = await tx.commission.updateMany({
        where: {
          customerId: customerId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
        data: {
          status: 'CONTRACT_ENDED',
        },
      });

      // Update customer status to NO_DEAL (contract ended)
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          status: 'NO_DEAL',
        },
      });

      return {
        customer: updatedCustomer,
        commissionsEnded: updatedCommissions.count,
      };
    });

    // Notify reseller
    await createNotification({
      userId: customer.reseller.id,
      type: 'CUSTOMER_STATUS_CHANGED',
      data: {
        customerName: customer.companyName,
        newStatus: 'Contract Ended',
        commissionsEnded: result.commissionsEnded,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error ending contract:', error);
    return NextResponse.json(
      { error: 'Failed to end contract' },
      { status: 500 }
    );
  }
}
