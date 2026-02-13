import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit-log';
import { createNotification } from '@/lib/notifications/notification-service';
import { AuditAction, NotificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { commissionIds, action, rejectionReason } = await request.json();

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Commission IDs are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'mark_paid'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let updateData: any = {};
    let auditAction: AuditAction = 'OTHER';
    let notificationType: NotificationType = 'COMMISSION_APPROVED';

    switch (action) {
      case 'approve':
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: (session.user as any).id,
        };
        auditAction = 'COMMISSION_BULK_APPROVED';
        notificationType = 'COMMISSION_APPROVED';
        break;
      case 'reject':
        updateData = {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || 'Rejected by admin',
          approvedById: (session.user as any).id,
        };
        auditAction = 'COMMISSION_BULK_REJECTED';
        notificationType = 'COMMISSION_REJECTED';
        break;
      case 'mark_paid':
        updateData = {
          status: 'PAID',
          paidAt: new Date(),
        };
        auditAction = 'COMMISSION_PAID';
        notificationType = 'COMMISSION_PAID';
        break;
    }

    // Get commissions with reseller details before update
    const commissions = await prisma.commission.findMany({
      where: {
        id: { in: commissionIds },
      },
      include: {
        reseller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Perform bulk update
    await prisma.commission.updateMany({
      where: {
        id: { in: commissionIds },
      },
      data: updateData,
    });

    // Create audit log
    await createAuditLog({
      action: auditAction,
      performedById: (session.user as any).id,
      entityType: 'Commission',
      metadata: {
        commissionIds,
        action,
        count: commissionIds.length,
      },
      ipAddress,
      userAgent,
    });

    // Send notifications to resellers
    for (const commission of commissions) {
      try {
        await createNotification({
          userId: commission.resellerId,
          type: notificationType,
          data: {
            commissionId: commission.id,
            amount: commission.amount,
            period: commission.period,
            status: updateData.status,
          },
        });
      } catch (error) {
        console.error(`Failed to send notification to reseller ${commission.resellerId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      count: commissions.length,
      message: `Successfully ${action}ed ${commissions.length} commission(s)`,
    });
  } catch (error) {
    console.error('Bulk commission operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
