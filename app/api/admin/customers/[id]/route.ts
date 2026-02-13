import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';

// Get single customer with all details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        reseller: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            commissionRate: true,
            commissionYears: true,
            currency: true,
          },
        },
        commissions: {
          orderBy: { yearNumber: 'asc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// Update customer status (for marking as NO_DEAL)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, contractReceived, pendingFinalization } = body;

    // Prepare update data
    const updateData: any = {};

    // Only allow changing status (LEAD, PROSPECT, NO_DEAL, CANCELLED)
    // ACTIVE status should be set via close-deal endpoint
    if (status) {
      const allowedStatusChanges = ['LEAD', 'PROSPECT', 'NO_DEAL', 'CANCELLED'];
      if (!allowedStatusChanges.includes(status)) {
        return NextResponse.json(
          { error: 'Use close-deal endpoint to mark deals as won' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Update checklist fields
    if (contractReceived !== undefined) {
      updateData.contractReceived = contractReceived;
    }
    if (pendingFinalization !== undefined) {
      updateData.pendingFinalization = pendingFinalization;
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
