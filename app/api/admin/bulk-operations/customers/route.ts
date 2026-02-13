import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit-log';
import { CustomerStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { customerIds, action, newStatus } = await request.json();

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { error: 'Customer IDs are required' },
        { status: 400 }
      );
    }

    if (!['update_status', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (action === 'update_status') {
      if (!newStatus || !['ACTIVE', 'LEAD', 'NO_DEAL'].includes(newStatus)) {
        return NextResponse.json(
          { error: 'Valid status is required' },
          { status: 400 }
        );
      }

      // Perform bulk update
      await prisma.customer.updateMany({
        where: {
          id: { in: customerIds },
        },
        data: {
          status: newStatus as CustomerStatus,
        },
      });

      // Create audit log
      await createAuditLog({
        action: 'CUSTOMER_BULK_UPDATED',
        performedById: (session.user as any).id,
        entityType: 'Customer',
        metadata: {
          customerIds,
          newStatus,
          count: customerIds.length,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        count: customerIds.length,
        message: `Successfully updated ${customerIds.length} customer(s) to ${newStatus}`,
      });
    } else if (action === 'delete') {
      // Perform bulk delete
      await prisma.customer.deleteMany({
        where: {
          id: { in: customerIds },
        },
      });

      // Create audit log
      await createAuditLog({
        action: 'CUSTOMER_DELETED',
        performedById: (session.user as any).id,
        entityType: 'Customer',
        metadata: {
          customerIds,
          count: customerIds.length,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        count: customerIds.length,
        message: `Successfully deleted ${customerIds.length} customer(s)`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Bulk customer operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
