import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit-log';
import { sendEmail } from '@/lib/notifications/email-service';
import bcrypt from 'bcryptjs';

// Generate a random temporary password
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
      },
    });

    // Create audit log
    await createAuditLog({
      action: 'USER_PASSWORD_RESET',
      performedById: (session.user as any).id,
      entityType: 'User',
      entityId: params.id,
      metadata: {
        resetBy: (session.user as any).name,
        userEmail: user.email,
      },
      ipAddress,
      userAgent,
    });

    // Send email with temporary password
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your Password Has Been Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>Hello ${user.name},</p>
            <p>Your password has been reset by an administrator. Your temporary password is:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <code style="font-size: 16px; font-weight: bold;">${temporaryPassword}</code>
            </div>
            <p><strong>Important:</strong> Please log in and change your password immediately.</p>
            <p>If you did not request this password reset, please contact your administrator immediately.</p>
            <p>Best regards,<br>Reseller Portal Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue even if email fails - password is already reset
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Temporary password sent to user.',
      temporaryPassword, // Return in response for admin to see
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
