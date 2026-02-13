import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications/notification-service';
import { checkAutoApproval, applyAutoApproval } from '@/lib/auto-approval';

/**
 * GET /api/commissions
 * Get all commissions for the authenticated user
 * Admins can see all commissions, resellers see only their own
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const period = searchParams.get('period');
    const resellerId = searchParams.get('resellerId');

    // Build filter conditions
    const where: any = {};

    // Role-based filtering
    if (userRole === 'RESELLER') {
      where.resellerId = userId;
    } else if (userRole === 'ADMIN' && resellerId) {
      where.resellerId = resellerId;
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Period filter
    if (period && period !== 'ALL') {
      where.period = period;
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        customer: true,
        reseller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ commissions });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/commissions
 * Create a new commission request (resellers only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'RESELLER') {
      return NextResponse.json({ error: 'Only resellers can create commission requests' }, { status: 403 });
    }

    const body = await request.json();
    const { amount, customerId, period, description, notes } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 });
    }

    // Verify customer belongs to this reseller
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          resellerId: userId,
        },
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
    }

    // Check if commission should be auto-approved
    const autoApprovalCheck = await checkAutoApproval({
      amount: parseFloat(amount),
      resellerId: userId,
    });

    // Create commission request
    const commission = await prisma.commission.create({
      data: {
        amount: parseFloat(amount),
        period,
        description,
        notes,
        status: 'PENDING',
        resellerId: userId,
        customerId,
        requestedAt: new Date(),
      },
      include: {
        customer: true,
        reseller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If auto-approval is applicable, apply it
    if (autoApprovalCheck.shouldAutoApprove && autoApprovalCheck.ruleId) {
      await applyAutoApproval({
        commissionId: commission.id,
        ruleId: autoApprovalCheck.ruleId,
        ruleName: autoApprovalCheck.ruleName!,
        resellerId: userId,
        amount: commission.amount,
        period: commission.period,
      });

      // Return the updated commission with auto-approved status
      const updatedCommission = await prisma.commission.findUnique({
        where: { id: commission.id },
        include: {
          customer: true,
          reseller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          commission: updatedCommission,
          autoApproved: true,
          message: 'Commission auto-approved',
        },
        { status: 201 }
      );
    }

    // Not auto-approved, notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    // Notify each admin about the new commission request
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'COMMISSION_REQUESTED',
        data: {
          commissionId: commission.id,
          resellerName: commission.reseller.name,
          amount: commission.amount,
          period: commission.period,
        },
        locale: 'en', // Default to English, can be made dynamic
      });
    }

    return NextResponse.json({ commission }, { status: 201 });
  } catch (error) {
    console.error('Error creating commission request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
