import prisma from '@/lib/db';
import { Commission, User, Customer } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface PayoutDocumentData {
  commission: Commission & {
    reseller: User;
    customer: Customer | null;
  };
  approvedBy: User;
}

export async function generatePayoutDocument(data: PayoutDocumentData): Promise<string> {
  const { commission, approvedBy } = data;
  const reseller = commission.reseller;
  
  const invoiceNumber = `PAY-${new Date().getFullYear()}-${commission.id.slice(-6).toUpperCase()}`;
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  
  const formattedAmount = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(commission.amount));

  // Generate HTML content for the payout document
  const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Uitbetalingsdocument ${invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 20px; font-weight: bold; color: #2563eb; }
    .date { color: #666; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 14px; font-weight: bold; color: #666; margin-bottom: 10px; text-transform: uppercase; }
    .details-box { background: #f8fafc; padding: 20px; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; }
    .detail-value { font-weight: 500; }
    .amount-box { background: #2563eb; color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; }
    .amount-label { font-size: 14px; opacity: 0.9; }
    .amount-value { font-size: 36px; font-weight: bold; margin-top: 10px; }
    .status-badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Reseller Portal</div>
    <div class="invoice-info">
      <div class="invoice-number">${invoiceNumber}</div>
      <div class="date">${formattedDate}</div>
    </div>
  </div>

  <h1 style="margin-bottom: 30px;">Uitbetalingsdocument <span class="status-badge">GOEDGEKEURD</span></h1>

  <div class="section">
    <div class="section-title">Reseller Gegevens</div>
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Naam</span>
        <span class="detail-value">${reseller.name || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Bedrijf</span>
        <span class="detail-value">${reseller.company || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">E-mail</span>
        <span class="detail-value">${reseller.email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Adres</span>
        <span class="detail-value">${reseller.address || '-'} ${reseller.postalCode || ''}</span>
      </div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Uit te betalen bedrag</div>
    <div class="amount-value">${formattedAmount}</div>
  </div>

  <div class="section">
    <div class="section-title">Commissie Details</div>
    <table>
      <tr>
        <th>Omschrijving</th>
        <th>Periode</th>
        <th>Klant</th>
        <th>Bedrag</th>
      </tr>
      <tr>
        <td>Commissie uitbetaling${commission.yearNumber ? ` - Jaar ${commission.yearNumber}` : ''}</td>
        <td>${commission.period || '-'}</td>
        <td>${commission.customer?.companyName || '-'}</td>
        <td>${formattedAmount}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Goedkeuringsdetails</div>
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Goedgekeurd door</span>
        <span class="detail-value">${approvedBy.name || approvedBy.email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Goedkeuringsdatum</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Referentie</span>
        <span class="detail-value">${commission.id}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Dit document is automatisch gegenereerd door het Reseller Portal systeem.</p>
    <p>Voor vragen kunt u contact opnemen via het contactformulier in de portal.</p>
  </div>
</body>
</html>
`;

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Save HTML file
  const fileName = `payout-${invoiceNumber}.html`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, htmlContent);

  // Create document record in database
  const document = await prisma.document.create({
    data: {
      name: `Uitbetalingsdocument ${invoiceNumber}`,
      description: `Commissie uitbetaling voor periode ${commission.period || '-'} - ${formattedAmount}`,
      category: 'INVOICE',
      fileName: fileName,
      fileUrl: `/api/files/${fileName}`,
      fileSize: Buffer.byteLength(htmlContent, 'utf8'),
      mimeType: 'text/html',
      isPublic: false,
      uploadedById: approvedBy.id,
      sharedWith: [reseller.id],
    },
  });

  return document.id;
}
