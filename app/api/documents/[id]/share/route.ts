import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/auth-options';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications/notification-service';

// POST /api/documents/[id]/share - Share document with users
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const body = await request.json();
    const { userIds } = body; // Array of user IDs to share with

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        uploadedBy: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only uploader or admin can share
    const canShare =
      userRole === 'ADMIN' ||
      document.uploadedById === userId;

    if (!canShare) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate that all user IDs exist
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    });

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: 'One or more user IDs are invalid' }, { status: 400 });
    }

    // Update document with new shared users (merge with existing)
    const existingSharedWith = document.sharedWith;
    const newSharedWith = Array.from(new Set([...existingSharedWith, ...userIds]));

    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        sharedWith: newSharedWith,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
    });

    // Send notifications to newly shared users
    const newlySharedUsers = userIds.filter((id) => !existingSharedWith.includes(id));
    for (const sharedUserId of newlySharedUsers) {
      await createNotification({
        userId: sharedUserId,
        type: 'DOCUMENT_SHARED',
        data: {
          documentName: document.name,
          documentId: document.id,
          sharedBy: document.uploadedBy.name,
        },
      });
    }

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error sharing document:', error);
    return NextResponse.json({ error: 'Failed to share document' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/share - Remove share access
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only uploader or admin can remove share access
    const canUnshare =
      userRole === 'ADMIN' ||
      document.uploadedById === userId;

    if (!canUnshare) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Remove user from sharedWith array
    const updatedSharedWith = document.sharedWith.filter((id) => id !== userIdToRemove);

    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        sharedWith: updatedSharedWith,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error removing share access:', error);
    return NextResponse.json({ error: 'Failed to remove share access' }, { status: 500 });
  }
}
