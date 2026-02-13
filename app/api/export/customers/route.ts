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

    const customers = await prisma.customer.findMany({
      include: {
        reseller: true,
        referral: true,
      },
    });

    // Generate CSV
    const headers = ['Company Name', 'Contact Name', 'Email', 'Phone', 'City', 'Country', 'Status', 'Reseller', 'Is Referral', 'Referral Date', 'Registration Date'];
    const rows = customers.map((customer) => [
      customer.companyName,
      customer.contactName,
      customer.email,
      customer.phone || '',
      customer.city || '',
      customer.country || '',
      customer.status,
      customer.reseller?.name || '',
      customer.referral ? 'Yes' : 'No',
      customer.referral ? new Date(customer.referral.referralDate).toISOString().split('T')[0] : '',
      new Date(customer.registrationDate).toISOString().split('T')[0],
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
