import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications/notification-service';
import { generatePayoutDocument } from '@/lib/payout-document';

/**
 * GET /api/commissions/[id]
 * Get a specific commission
 */
export async function GET(
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
    const commissionId = params.id;

    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: {
        customer: true,
        reseller: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    // Check authorization
    if (userRole === 'RESELLER' && commission.resellerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ commission });
  } catch (error) {
    console.error('Error fetching commission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/commissions/[id]
 * Update commission status (approve, reject, mark as paid)
 * Admin only
 */
export async function PATCH(
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
    const commissionId = params.id;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update commission status' }, { status: 403 });
    }

    const body = await request.json();
    const { action, notes, rejectionReason, paymentReference } = body;

    // Validate action
    if (!['APPROVE', 'REJECT', 'MARK_PAID'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the commission
    const existingCommission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: {
        reseller: true,
        customer: true,
      },
    });

    if (!existingCommission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    let updateData: any = {
      updatedAt: new Date(),
    };

    let notificationType: any = null;
    let notificationData: any = {};

    if (action === 'APPROVE') {
      // Check if already approved or paid
      if (existingCommission.status === 'APPROVED' || existingCommission.status === 'PAID') {
        return NextResponse.json({ error: 'Commission is already approved or paid' }, { status: 400 });
      }

      updateData = {
        ...updateData,
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
        notes: notes || existingCommission.notes,
      };

      notificationType = 'COMMISSION_APPROVED';
      notificationData = {
        commissionId: existingCommission.id,
        amount: existingCommission.amount,
        period: existingCommission.period,
      };
    } else if (action === 'REJECT') {
      // Check if already rejected
      if (existingCommission.status === 'REJECTED') {
        return NextResponse.json({ error: 'Commission is already rejected' }, { status: 400 });
      }

      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      updateData = {
        ...updateData,
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason,
        notes: notes || existingCommission.notes,
      };

      notificationType = 'COMMISSION_REJECTED';
      notificationData = {
        commissionId: existingCommission.id,
        amount: existingCommission.amount,
        period: existingCommission.period,
        rejectionReason,
      };
    } else if (action === 'MARK_PAID') {
      // Check if approved
      if (existingCommission.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Commission must be approved before marking as paid' }, { status: 400 });
      }

      updateData = {
        ...updateData,
        status: 'PAID',
        paidAt: new Date(),
        paymentReference: paymentReference || null,
        notes: notes || existingCommission.notes,
      };

      notificationType = 'COMMISSION_PAID';
      notificationData = {
        commissionId: existingCommission.id,
        amount: existingCommission.amount,
        period: existingCommission.period,
        paymentReference,
      };
    }

    // Update the commission
    const updatedCommission = await prisma.commission.update({
      where: { id: commissionId },
      data: updateData,
      include: {
        customer: true,
        reseller: true,
        approvedBy: true,
      },
    });

    // Generate payout document when approved
    if (action === 'APPROVE' && updatedCommission.approvedBy) {
      try {
        await generatePayoutDocument({
          commission: updatedCommission as any,
          approvedBy: updatedCommission.approvedBy,
        });
      } catch (docError) {
        console.error('Error generating payout document:', docError);
        // Don't fail the approval if document generation fails
      }
    }

    // Send notification to the reseller
    if (notificationType) {
      await createNotification({
        userId: existingCommission.resellerId,
        type: notificationType,
        data: notificationData,
        locale: 'en', // Default to English, can be made dynamic
      });
    }

    // Send email notification for approval/payment
    if ((action === 'APPROVE' || action === 'MARK_PAID') && updatedCommission.reseller?.email) {
      try {
        const formattedAmount = new Intl.NumberFormat('nl-NL', {
          style: 'currency',
          currency: 'EUR',
        }).format(Number(updatedCommission.amount));

        const appUrl = process.env.NEXTAUTH_URL || '';
        const appName = 'Reseller Portal';
        
        const subject = action === 'APPROVE' 
          ? `Commissie goedgekeurd: ${formattedAmount}`
          : `Commissie uitbetaald: ${formattedAmount}`;

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              ${action === 'APPROVE' ? 'Commissie Goedgekeurd' : 'Commissie Uitbetaald'}
            </h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Bedrag:</strong> ${formattedAmount}</p>
              <p style="margin: 10px 0;"><strong>Periode:</strong> ${updatedCommission.period || '-'}</p>
              <p style="margin: 10px 0;"><strong>Klant:</strong> ${updatedCommission.customer?.companyName || '-'}</p>
              ${action === 'MARK_PAID' && paymentReference ? `<p style="margin: 10px 0;"><strong>Betaalreferentie:</strong> ${paymentReference}</p>` : ''}
            </div>
            <p style="margin: 20px 0;">
              ${action === 'APPROVE' 
                ? 'Uw commissie is goedgekeurd en zal binnenkort worden uitbetaald. U kunt het uitbetalingsdocument downloaden in uw portal onder Documenten.' 
                : 'Uw commissie is uitbetaald. Het bedrag wordt binnen enkele werkdagen op uw rekening bijgeschreven.'}
            </p>
            <a href="${appUrl}/nl/reseller/commissions" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0;">
              Bekijk in Portal
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Dit is een automatisch gegenereerd bericht van het Reseller Portal.
            </p>
          </div>
        `;

        await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deployment_token: process.env.ABACUSAI_API_KEY,
            subject,
            body: htmlBody,
            is_html: true,
            recipient_email: updatedCommission.reseller.email,
            sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : 'noreply@reseller-portal.com',
            sender_alias: appName,
          }),
        });
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the action if email fails
      }
    }

    return NextResponse.json({ commission: updatedCommission });
  } catch (error) {
    console.error('Error updating commission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
