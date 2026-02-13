/**
 * Email Service
 * Handles sending emails with templates
 * In production, integrate with SendGrid, AWS SES, or similar service
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 * For demo purposes, this logs the email. In production, integrate with an email service.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In production, replace this with actual email service integration
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    // await sgMail.send({
    //   from: process.env.FROM_EMAIL!,
    //   ...options
    // });

    // For demo: log the email
    console.log('='.repeat(80));
    console.log('📧 EMAIL SENT');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Content:', options.html.substring(0, 200) + '...');
    console.log('='.repeat(80));

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Email template generator
 */
export function generateEmailTemplate({
  title,
  message,
  actionUrl,
  actionText,
  locale = 'en',
}: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  locale?: string;
}): string {
  const buttonHtml = actionUrl
    ? `
      <div style="margin: 30px 0; text-align: center;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          ${actionText}
        </a>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Reseller Portal</h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">${title}</h2>
          <div style="color: #4b5563; line-height: 1.6; font-size: 16px;">
            ${message}
          </div>
          ${buttonHtml}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">${locale === 'nl' ? 'Hartelijk dank' : 'Best regards'},</p>
            <p style="margin: 5px 0 0 0; font-weight: 600;">Reseller Portal Team</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">
            ${locale === 'nl' ? 'Dit is een geautomatiseerd bericht, antwoord niet op deze e-mail.' : 'This is an automated message, please do not reply to this email.'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
