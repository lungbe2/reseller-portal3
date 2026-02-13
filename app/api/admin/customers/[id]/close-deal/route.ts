import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { closeDealAndCalculateCommissions } from '@/lib/commission-calculator';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string; name?: string } | undefined;

    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractValue, contractDuration } = body;

    // Validate inputs
    if (!contractValue || contractValue <= 0) {
      return NextResponse.json(
        { error: 'Contract value must be greater than 0' },
        { status: 400 }
      );
    }

    if (!contractDuration || contractDuration < 1) {
      return NextResponse.json(
        { error: 'Contract duration must be at least 1 year' },
        { status: 400 }
      );
    }

    // Close the deal and calculate commissions
    const result = await closeDealAndCalculateCommissions({
      customerId: params.id,
      contractValue: parseFloat(contractValue),
      contractDuration: parseInt(contractDuration),
      closedById: user.id,
    });

    // Create audit log
    await createAuditLog({
      action: 'CUSTOMER_STATUS_UPDATED',
      entityType: 'Customer',
      entityId: params.id,
      performedById: user.id,
      changes: {
        action: 'Deal Closed',
        contractValue,
        contractDuration,
        commissionsCreated: result.commissionsCreated,
        totalCommissionValue: result.totalCommissionValue,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Deal closed successfully',
      data: {
        customerId: result.customer.id,
        companyName: result.customer.companyName,
        contractValue: result.customer.contractValue,
        contractDuration: result.customer.contractDuration,
        commissionsCreated: result.commissionsCreated,
        totalCommissionValue: result.totalCommissionValue,
      },
    });
  } catch (error: any) {
    console.error('Close deal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to close deal' },
      { status: 500 }
    );
  }
}
