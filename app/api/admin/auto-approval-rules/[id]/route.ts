import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit-log';

// PATCH /api/admin/auto-approval-rules/[id] - Update auto-approval rule
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
    const body = await request.json();
    const { name, description, enabled, priority, maxAmount, trustedResellersOnly } = body;

    // Check if rule exists
    const existingRule = await prisma.autoApprovalRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Validation
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json({ error: 'Rule name cannot be empty' }, { status: 400 });
    }

    if (maxAmount !== null && maxAmount !== undefined && maxAmount < 0) {
      return NextResponse.json({ error: 'Max amount must be positive' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (priority !== undefined) updateData.priority = priority;
    if (maxAmount !== undefined) {
      updateData.maxAmount = maxAmount !== null ? parseFloat(maxAmount) : null;
    }
    if (trustedResellersOnly !== undefined) {
      updateData.trustedResellersOnly = trustedResellersOnly;
    }

    // Update the rule
    const rule = await prisma.autoApprovalRule.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await createAuditLog({
      action: 'AUTO_APPROVAL_RULE_UPDATED',
      performedById: session.user.id,
      entityType: 'AutoApprovalRule',
      entityId: rule.id,
      changes: {
        before: existingRule,
        after: updateData,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating auto-approval rule:', error);
    return NextResponse.json(
      { error: 'Failed to update auto-approval rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/auto-approval-rules/[id] - Delete auto-approval rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if rule exists
    const existingRule = await prisma.autoApprovalRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Delete the rule
    await prisma.autoApprovalRule.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      action: 'AUTO_APPROVAL_RULE_DELETED',
      performedById: session.user.id,
      entityType: 'AutoApprovalRule',
      entityId: id,
      changes: {
        deletedRule: existingRule,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting auto-approval rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete auto-approval rule' },
      { status: 500 }
    );
  }
}
