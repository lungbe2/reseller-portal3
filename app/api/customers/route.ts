import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth-options';
import { createNotification } from '@/lib/notifications/notification-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'RESELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const body = await req.json();
    const { companyName, contactName, email, phone, address, city, country, websiteDomain, reviewPlatform, status } = body;

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        companyName,
        contactName,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || null,
        websiteDomain: websiteDomain || null,
        reviewPlatform: reviewPlatform || null,
        status: status || 'LEAD',
        resellerId: userId,
      },
    });

    // Send notification
    await createNotification({
      userId,
      type: 'CUSTOMER_CREATED',
      data: {
        customerName: companyName,
        customerId: customer.id,
      },
      locale: 'en',
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
