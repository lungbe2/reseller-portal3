import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit-log';

// PATCH /api/admin/users/[id]/toggle-trusted - Toggle trusted status for reseller
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only resellers can be marked as trusted
    if (user.role !== 'RESELLER') {
      return NextResponse.json(
        { error: 'Only resellers can be marked as trusted' },
        { status: 400 }
      );
    }

    // Toggle trusted status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isTrusted: !user.isTrusted,
      },
    });

    // Create audit log
    await createAuditLog({
      action: updatedUser.isTrusted ? 'USER_MARKED_TRUSTED' : 'USER_UNMARKED_TRUSTED',
      performedById: session.user.id,
      entityType: 'User',
      entityId: id,
      changes: {
        userId: id,
        userName: user.name,
        userEmail: user.email,
        isTrusted: updatedUser.isTrusted,
      },
    });

    return NextResponse.json({
      success: true,
      isTrusted: updatedUser.isTrusted,
    });
  } catch (error) {
    console.error('Error toggling trusted status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle trusted status' },
      { status: 500 }
    );
  }
}
