import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import { prisma } from "@/lib/db";


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'summary'; // 'summary' or 'detailed'

    const resellers = await prisma.user.findMany({
      where: { role: 'RESELLER' },
      include: {
        customers: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        commissions: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (format === 'detailed') {
      // Detailed export: one row per customer with reseller info
      const headers = [
        'Reseller Name', 'Reseller Email', 'Reseller Company', 'Reseller Phone',
        'Customer Company', 'Customer Contact', 'Customer Email', 'Customer Status', 'Referral Date'
      ];
      
      const rows: string[][] = [];
      resellers.forEach((reseller) => {
        if (reseller.customers.length === 0) {
          // Include resellers without customers
          rows.push([
            reseller.name || '',
            reseller.email,
            reseller.company || '',
            reseller.phone || '',
            '', '', '', '', ''
          ]);
        } else {
          reseller.customers.forEach((customer) => {
            rows.push([
              reseller.name || '',
              reseller.email,
              reseller.company || '',
              reseller.phone || '',
              customer.companyName || '',
              customer.contactName || '',
              customer.email || '',
              customer.status,
              new Date(customer.createdAt).toISOString().split('T')[0],
            ]);
          });
        }
      });

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="resellers-with-customers-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Summary export (default)
    const headers = ['Name', 'Email', 'Company', 'Phone', 'Total Customers', 'Leads', 'Active', 'No Deal', 'Total Commission', 'Member Since'];
    const rows = resellers.map((reseller) => {
      const totalCommission = reseller.commissions.reduce((sum, c) => sum + c.amount, 0);
      const leads = reseller.customers.filter(c => c.status === 'LEAD').length;
      const active = reseller.customers.filter(c => c.status === 'ACTIVE').length;
      const noDeal = reseller.customers.filter(c => c.status === 'NO_DEAL').length;
      return [
        reseller.name || '',
        reseller.email,
        reseller.company || '',
        reseller.phone || '',
        reseller.customers.length,
        leads,
        active,
        noDeal,
        totalCommission.toFixed(2),
        new Date(reseller.createdAt).toISOString().split('T')[0],
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="resellers_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export resellers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
