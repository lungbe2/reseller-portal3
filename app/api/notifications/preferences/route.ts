import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    // If no preferences exist, create default ones
    if (preferences.length === 0) {
      const notificationTypes = Object.values(NotificationType);
      const defaultPreferences = await Promise.all(
        notificationTypes.map((type) =>
          prisma.notificationPreference.create({
            data: {
              userId,
              type,
              emailEnabled: true,
              inAppEnabled: true,
            },
          })
        )
      );
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { type, emailEnabled, inAppEnabled } = body;

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    // Upsert preference
    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      update: {
        emailEnabled: emailEnabled ?? true,
        inAppEnabled: inAppEnabled ?? true,
      },
      create: {
        userId,
        type,
        emailEnabled: emailEnabled ?? true,
        inAppEnabled: inAppEnabled ?? true,
      },
    });

    return NextResponse.json(preference);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
