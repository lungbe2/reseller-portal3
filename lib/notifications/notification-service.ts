/**
 * Notification Service
 * Handles creating and sending notifications
 */

import { NotificationType } from '@prisma/client';
import { sendEmail, generateEmailTemplate } from './email-service';
import { prisma } from '@/lib/db';

interface NotificationData {
  userId: string;
  type: NotificationType;
  data: Record<string, any>;
  locale?: string;
}

/**
 * Create a notification and optionally send email
 */
export async function createNotification(input: NotificationData): Promise<void> {
  try {
    const locale = input.locale || 'en';
    
    // Get template with title and message
    const template = getNotificationTemplate(input.type, input.data, locale);
    
    // Check user preferences
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId: input.userId,
          type: input.type,
        },
      },
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      console.error('User not found:', input.userId);
      return;
    }

    // Create in-app notification if enabled (default: true)
    const inAppEnabled = preference?.inAppEnabled ?? true;
    if (inAppEnabled) {
      await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: template.title,
          message: template.message,
          metadata: input.data ? JSON.stringify(input.data) : null,
          read: false,
          emailSent: false,
        },
      });
    }

    // Send email if enabled (default: true)
    const emailEnabled = preference?.emailEnabled ?? true;
    if (emailEnabled && user.email) {
      const emailHtml = generateEmailTemplate({
        title: template.title,
        message: template.message,
        actionText: template.actionText,
        locale: locale,
      });

      const emailSent = await sendEmail({
        to: user.email,
        subject: template.title,
        html: emailHtml,
      });

      // Update notification to mark email as sent
      if (emailSent && inAppEnabled) {
        const notification = await prisma.notification.findFirst({
          where: {
            userId: input.userId,
            type: input.type,
            createdAt: {
              gte: new Date(Date.now() - 5000), // Last 5 seconds
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (notification) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Get notification message templates
 */
export function getNotificationTemplate(
  type: NotificationType,
  data: Record<string, any>,
  locale: string = 'en'
): { title: string; message: string; actionText?: string } {
  const templates = {
    en: {
      CUSTOMER_CREATED: {
        title: 'New Customer Registered',
        message: `A new customer "${data.customerName}" has been registered successfully.`,
        actionText: 'View Customer',
      },
      CUSTOMER_STATUS_CHANGED: {
        title: 'Customer Status Updated',
        message: `The status of customer "${data.customerName}" has been changed to ${data.newStatus}.`,
        actionText: 'View Customer',
      },
      COMMISSION_REQUESTED: {
        title: 'New Commission Request',
        message: `${data.resellerName} has submitted a commission request of €${data.amount} for period ${data.period}.`,
        actionText: 'Review Request',
      },
      COMMISSION_APPROVED: {
        title: 'Commission Approved',
        message: `Your commission of €${data.amount} for period ${data.period} has been approved.`,
        actionText: 'View Commissions',
      },
      COMMISSION_PAID: {
        title: 'Commission Paid',
        message: `Your commission of €${data.amount} for period ${data.period} has been paid${data.paymentReference ? ` (Ref: ${data.paymentReference})` : ''}.`,
        actionText: 'View Commissions',
      },
      COMMISSION_REJECTED: {
        title: 'Commission Rejected',
        message: `Your commission request of €${data.amount} for period ${data.period} has been rejected. Reason: ${data.rejectionReason || 'No reason provided'}.`,
        actionText: 'View Commissions',
      },
      REFERRAL_CREATED: {
        title: 'New Referral',
        message: `A new referral for customer "${data.customerName}" has been created.`,
        actionText: 'View Referrals',
      },
      NOTE_ADDED: {
        title: 'New Note Added',
        message: `A new note has been added to your account by ${data.authorName}.`,
        actionText: 'View Notes',
      },
      DOCUMENT_UPLOADED: {
        title: 'Document Uploaded',
        message: `${data.uploaderName} uploaded a new document "${data.documentName}"${data.customerName ? ` for ${data.customerName}` : ''}.`,
        actionText: 'View Document',
      },
      DOCUMENT_SHARED: {
        title: 'Document Shared',
        message: `${data.sharedBy} shared document "${data.documentName}" with you.`,
        actionText: 'View Document',
      },
    },
    nl: {
      CUSTOMER_CREATED: {
        title: 'Nieuwe Klant Geregistreerd',
        message: `Een nieuwe klant "${data.customerName}" is succesvol geregistreerd.`,
        actionText: 'Klant Bekijken',
      },
      CUSTOMER_STATUS_CHANGED: {
        title: 'Klantstatus Bijgewerkt',
        message: `De status van klant "${data.customerName}" is gewijzigd naar ${data.newStatus}.`,
        actionText: 'Klant Bekijken',
      },
      COMMISSION_REQUESTED: {
        title: 'Nieuw Commissieverzoek',
        message: `${data.resellerName} heeft een commissieverzoek van €${data.amount} ingediend voor periode ${data.period}.`,
        actionText: 'Verzoek Bekijken',
      },
      COMMISSION_APPROVED: {
        title: 'Commissie Goedgekeurd',
        message: `Uw commissie van €${data.amount} voor periode ${data.period} is goedgekeurd.`,
        actionText: 'Commissies Bekijken',
      },
      COMMISSION_PAID: {
        title: 'Commissie Betaald',
        message: `Uw commissie van €${data.amount} voor periode ${data.period} is betaald${data.paymentReference ? ` (Ref: ${data.paymentReference})` : ''}.`,
        actionText: 'Commissies Bekijken',
      },
      COMMISSION_REJECTED: {
        title: 'Commissie Afgewezen',
        message: `Uw commissieverzoek van €${data.amount} voor periode ${data.period} is afgewezen. Reden: ${data.rejectionReason || 'Geen reden opgegeven'}.`,
        actionText: 'Commissies Bekijken',
      },
      REFERRAL_CREATED: {
        title: 'Nieuwe Verwijzing',
        message: `Een nieuwe verwijzing voor klant "${data.customerName}" is aangemaakt.`,
        actionText: 'Verwijzingen Bekijken',
      },
      NOTE_ADDED: {
        title: 'Nieuwe Notitie Toegevoegd',
        message: `Een nieuwe notitie is toegevoegd aan uw account door ${data.authorName}.`,
        actionText: 'Notities Bekijken',
      },
      DOCUMENT_UPLOADED: {
        title: 'Document Geüpload',
        message: `${data.uploaderName} heeft een nieuw document "${data.documentName}" geüpload${data.customerName ? ` voor ${data.customerName}` : ''}.`,
        actionText: 'Document Bekijken',
      },
      DOCUMENT_SHARED: {
        title: 'Document Gedeeld',
        message: `${data.sharedBy} heeft document "${data.documentName}" met u gedeeld.`,
        actionText: 'Document Bekijken',
      },
    },
  };

  const localeTemplates = templates[locale as 'en' | 'nl'] || templates.en;
  return localeTemplates[type] || { title: 'Notification', message: 'You have a new notification' };
}
