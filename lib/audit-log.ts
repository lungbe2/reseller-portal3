import { AuditAction } from '@prisma/client';
import prisma from '@/lib/db';

interface CreateAuditLogParams {
  action: AuditAction;
  performedById: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an audit log entry for tracking administrative actions
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const {
      action,
      performedById,
      entityType,
      entityId,
      changes,
      metadata,
      ipAddress,
      userAgent,
    } = params;

    await prisma.auditLog.create({
      data: {
        action,
        performedById,
        entityType,
        entityId: entityId || null,
        changes: changes ? JSON.stringify(changes) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Gets audit logs with optional filtering
 */
export async function getAuditLogs(params: {
  action?: AuditAction;
  entityType?: string;
  performedById?: string;
  limit?: number;
  offset?: number;
}) {
  const { action, entityType, performedById, limit = 50, offset = 0 } = params;

  const where: any = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (performedById) where.performedById = performedById;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Gets recent activity for the dashboard
 */
export async function getRecentActivity(limit = 10) {
  const logs = await prisma.auditLog.findMany({
    include: {
      performedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return logs;
}
