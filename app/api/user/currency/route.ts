import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, currency } = await request.json();
  if (session.user.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.user.update({ where: { id: userId }, data: { currency } });
  return NextResponse.json({ success: true });
}
