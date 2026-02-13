import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { getAuditLogs } from '@/lib/audit-log';
import { stringify } from 'csv';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all audit logs (limit 1000 for export)
    const { logs } = await getAuditLogs({
      limit: 1000,
      offset: 0,
    });

    // Prepare CSV data
    const records = logs.map((log) => ({
      'Timestamp': new Date(log.createdAt).toISOString(),
      'Action': log.action,
      'Entity Type': log.entityType,
      'Entity ID': log.entityId || '',
      'Performed By': log.performedBy.name,
      'Email': log.performedBy.email,
      'IP Address': log.ipAddress || '',
      'Changes': log.changes || '',
    }));

    // Convert to CSV
    const csv = await new Promise<string>((resolve, reject) => {
      stringify(records, { header: true }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
