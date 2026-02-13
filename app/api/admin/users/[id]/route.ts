import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit-log';
import { createNotification } from '@/lib/notifications/notification-service';
import bcrypt from 'bcryptjs';

// Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        title: true,
        company: true,
        city: true,
        country: true,
        commissionRate: true,
        commissionYears: true,
        isOneOffPayment: true,
        isTrusted: true,
        // Backup Admin details
        backupAdminName: true,
        backupAdminEmail: true,
        backupAdminPhone: true,
        // Banking details
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        bankCode: true,
        currency: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            commissions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update user (suspend/activate/update details)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    const changes: any = {};

    if (data.status && data.status !== currentUser.status) {
      updateData.status = data.status;
      changes.status = { from: currentUser.status, to: data.status };
    }

    if (data.name && data.name !== currentUser.name) {
      updateData.name = data.name;
      changes.name = { from: currentUser.name, to: data.name };
    }

    if (data.email && data.email !== currentUser.email) {
      // Check if email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== params.id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      updateData.email = data.email;
      changes.email = { from: currentUser.email, to: data.email };
    }

    if (data.phone !== undefined && data.phone !== currentUser.phone) {
      updateData.phone = data.phone || null;
      changes.phone = { from: currentUser.phone, to: data.phone };
    }

    if (data.company !== undefined && data.company !== currentUser.company) {
      updateData.company = data.company || null;
      changes.company = { from: currentUser.company, to: data.company };
    }

    if (data.title !== undefined) {
      updateData.title = data.title || null;
    }

    // Backup Admin details
    if (data.backupAdminName !== undefined) {
      updateData.backupAdminName = data.backupAdminName || null;
    }
    if (data.backupAdminEmail !== undefined) {
      updateData.backupAdminEmail = data.backupAdminEmail || null;
    }
    if (data.backupAdminPhone !== undefined) {
      updateData.backupAdminPhone = data.backupAdminPhone || null;
    }

    if (data.commissionRate !== undefined) {
      updateData.commissionRate = data.commissionRate;
    }

    if (data.commissionYears !== undefined) {
      updateData.commissionYears = data.commissionYears;
    }

    if (data.isOneOffPayment !== undefined) {
      updateData.isOneOffPayment = data.isOneOffPayment;
    }

    // Location fields
    if (data.city !== undefined) {
      updateData.city = data.city || null;
    }
    if (data.country !== undefined) {
      updateData.country = data.country || null;
    }

    // Banking details
    if (data.bankName !== undefined) {
      updateData.bankName = data.bankName || null;
    }
    if (data.accountHolder !== undefined) {
      updateData.accountHolder = data.accountHolder || null;
    }
    if (data.accountNumber !== undefined) {
      updateData.accountNumber = data.accountNumber || null;
    }
    if (data.bankCode !== undefined) {
      updateData.bankCode = data.bankCode || null;
    }
    if (data.currency !== undefined) {
      updateData.currency = data.currency || 'EUR';
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        company: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    const auditAction = changes.status
      ? changes.status.to === 'SUSPENDED'
        ? 'USER_SUSPENDED'
        : 'USER_ACTIVATED'
      : 'USER_UPDATED';

    await createAuditLog({
      action: auditAction as any,
      performedById: (session.user as any).id,
      entityType: 'User',
      entityId: params.id,
      changes,
      ipAddress,
      userAgent,
    });

    // Send notification if status changed
    if (changes.status) {
      // You can add notification logic here if needed
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
