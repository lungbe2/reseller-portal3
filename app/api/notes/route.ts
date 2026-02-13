import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth-options';
import { createNotification } from '@/lib/notifications/notification-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resellerId, content } = body;

    if (!resellerId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const authorName = session.user?.name || 'Admin';
    const note = await prisma.note.create({
      data: {
        resellerId,
        content,
        authorName,
      },
    });

    // Send notification to reseller
    await createNotification({
      userId: resellerId,
      type: 'NOTE_ADDED',
      data: {
        authorName,
        noteId: note.id,
      },
      locale: 'en',
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
