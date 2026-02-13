import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit-log';

// GET /api/admin/auto-approval-rules - Get all auto-approval rules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.autoApprovalRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching auto-approval rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto-approval rules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/auto-approval-rules - Create new auto-approval rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, enabled, priority, maxAmount, trustedResellersOnly } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Rule name is required' }, { status: 400 });
    }

    if (maxAmount !== null && maxAmount !== undefined && maxAmount < 0) {
      return NextResponse.json({ error: 'Max amount must be positive' }, { status: 400 });
    }

    // Create the rule
    const rule = await prisma.autoApprovalRule.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        enabled: enabled !== false, // Default to true
        priority: priority || 0,
        maxAmount: maxAmount !== null && maxAmount !== undefined ? parseFloat(maxAmount) : null,
        trustedResellersOnly: trustedResellersOnly === true,
      },
    });

    // Create audit log
    await createAuditLog({
      action: 'AUTO_APPROVAL_RULE_CREATED',
      performedById: session.user.id,
      entityType: 'AutoApprovalRule',
      entityId: rule.id,
      changes: {
        name: rule.name,
        enabled: rule.enabled,
        maxAmount: rule.maxAmount,
        trustedResellersOnly: rule.trustedResellersOnly,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating auto-approval rule:', error);
    return NextResponse.json(
      { error: 'Failed to create auto-approval rule' },
      { status: 500 }
    );
  }
}
