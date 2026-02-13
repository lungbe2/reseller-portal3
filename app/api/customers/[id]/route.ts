import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';

// Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        reseller: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Resellers can only view their own customers
    if (user.role === 'RESELLER' && customer.resellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// Update customer - Resellers can only edit limited fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Resellers can only edit their own customers
    if (user.role === 'RESELLER' && customer.resellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const updateData: any = {};

    // Fields resellers can edit
    const resellerEditableFields = [
      'contactName', 'email', 'phone', 'mobile', 'address', 'city', 'country', 'postalCode',
      // Secondary contact fields
      'secondaryContactName', 'secondaryEmail', 'secondaryPhone', 'secondaryMobile',
      // Follow-up fields
      'followUpDate', 'followUpNotes',
      // Checklist fields
      'contractReceived', 'pendingFinalization',
      // Status - resellers can now edit status
      'status'
    ];
    
    // Additional fields admins can edit
    const adminOnlyFields = ['resellerId', 'name', 'company', 'companyName'];

    // Apply editable fields based on role
    for (const field of resellerEditableFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    // Admin can also edit admin-only fields
    if (user.role === 'ADMIN') {
      for (const field of adminOnlyFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
