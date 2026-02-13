import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications/notification-service';
import { createAuditLog } from '@/lib/audit-log';

interface CheckAutoApprovalParams {
  amount: number;
  resellerId: string;
}

interface AutoApprovalResult {
  shouldAutoApprove: boolean;
  ruleId?: string;
  ruleName?: string;
}

/**
 * Check if a commission should be auto-approved based on active rules
 */
export async function checkAutoApproval(
  params: CheckAutoApprovalParams
): Promise<AutoApprovalResult> {
  try {
    const { amount, resellerId } = params;

    // Get reseller information
    const reseller = await prisma.user.findUnique({
      where: { id: resellerId },
      select: { isTrusted: true },
    });

    if (!reseller) {
      return { shouldAutoApprove: false };
    }

    // Get all active rules, ordered by priority (highest first)
    const rules = await prisma.autoApprovalRule.findMany({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
    });

    // Check each rule in priority order
    for (const rule of rules) {
      let matches = true;

      // Check trusted reseller condition
      if (rule.trustedResellersOnly && !reseller.isTrusted) {
        matches = false;
      }

      // Check amount condition
      if (rule.maxAmount !== null && amount > rule.maxAmount) {
        matches = false;
      }

      // If all conditions match, auto-approve
      if (matches) {
        return {
          shouldAutoApprove: true,
          ruleId: rule.id,
          ruleName: rule.name,
        };
      }
    }

    return { shouldAutoApprove: false };
  } catch (error) {
    console.error('Error checking auto-approval:', error);
    return { shouldAutoApprove: false };
  }
}

/**
 * Apply auto-approval to a commission
 */
export async function applyAutoApproval({
  commissionId,
  ruleId,
  ruleName,
  resellerId,
  amount,
  period,
}: {
  commissionId: string;
  ruleId: string;
  ruleName: string;
  resellerId: string;
  amount: number;
  period: string;
}) {
  try {
    // Update commission to approved status
    const commission = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: 'APPROVED',
        autoApproved: true,
        autoApprovalRuleId: ruleId,
        approvedAt: new Date(),
        // Note: approvedById is not set for auto-approvals
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

    // Notify reseller about auto-approval
    await createNotification({
      userId: resellerId,
      type: 'COMMISSION_APPROVED',
      data: {
        commissionId,
        amount,
        period,
        autoApproved: true,
        ruleName,
      },
      locale: 'en', // Can be made dynamic
    });

    // Create audit log for auto-approval
    await createAuditLog({
      action: 'COMMISSION_AUTO_APPROVED',
      performedById: resellerId, // System action, but attributed to reseller
      entityType: 'Commission',
      entityId: commissionId,
      changes: {
        commissionId,
        amount,
        period,
        ruleId,
        ruleName,
        status: 'AUTO-APPROVED',
      },
    });

    return commission;
  } catch (error) {
    console.error('Error applying auto-approval:', error);
    throw error;
  }
}
