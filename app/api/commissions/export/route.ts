import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/db';
import { stringify } from 'csv/sync';

/**
 * GET /api/commissions/export
 * Export commission statement as CSV
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
            name: true,
            email: true,
            company: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    // Format data for CSV
    const csvData = commissions.map((commission) => ({
      'Request Date': new Date(commission.requestedAt).toLocaleDateString(),
      'Reseller': commission.reseller.name,
      'Company': commission.reseller.company || '',
      'Customer': commission.customer?.companyName || '',
      'Period': commission.period,
      'Description': commission.description || '',
      'Amount (€)': commission.amount.toFixed(2),
      'Status': commission.status,
      'Approved Date': commission.approvedAt ? new Date(commission.approvedAt).toLocaleDateString() : '',
      'Approved By': commission.approvedBy?.name || '',
      'Paid Date': commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : '',
      'Payment Reference': commission.paymentReference || '',
      'Notes': commission.notes || '',
    }));

    // Generate CSV
    const csv = stringify(csvData, {
      header: true,
      columns: [
        'Request Date',
        'Reseller',
        'Company',
        'Customer',
        'Period',
        'Description',
        'Amount (€)',
        'Status',
        'Approved Date',
        'Approved By',
        'Paid Date',
        'Payment Reference',
        'Notes',
      ],
    });

    // Return CSV file
    const filename = `commission-statement-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting commissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
