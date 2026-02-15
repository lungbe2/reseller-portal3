import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Reseller2025$';

function parseCSV(content: string, delimiter = ';'): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse header - remove quotes and BOM
  const header = lines[0].replace(/^\uFEFF/, '').split(delimiter).map(h => 
    h.replace(/^"|"$/g, '').trim()
  );
  
  const rows: Record<string, string>[] = [];
  let currentRow: string[] = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentField.replace(/^"|"$/g, '').trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    if (!inQuotes) {
      currentRow.push(currentField.replace(/^"|"$/g, '').trim());
      currentField = '';
      
      if (currentRow.length >= header.length) {
        const row: Record<string, string> = {};
        header.forEach((h, idx) => {
          row[h] = currentRow[idx] || '';
        });
        rows.push(row);
      }
      currentRow = [];
    } else {
      currentField += '\n';
    }
  }
  
  return rows;
}

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Format: DD-MM-YYYY or DD-MM-YYYY HH:MM
  const parts = dateStr.split(' ')[0].split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date();
}

function extractCommissionRate(provisieStr: string): number {
  // Extract percentage from strings like "Provisie 15% op nieuwe klanten"
  const match = provisieStr.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 15;
}

function mapStatus(status: string): 'ACTIVE' | 'SUSPENDED' {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('actief') || statusLower.includes('active')) return 'ACTIVE';
  return 'SUSPENDED';
}

function mapCustomerStatus(status: string): 'LEAD' | 'ACTIVE' | 'NO_DEAL' {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('behandeling') || statusLower.includes('lead')) return 'LEAD';
  if (statusLower.includes('actief') || statusLower.includes('active') || statusLower.includes('klant')) return 'ACTIVE';
  if (statusLower.includes('no deal') || statusLower.includes('verloren')) return 'NO_DEAL';
  return 'LEAD';
}

async function importResellers() {
  console.log('\n📥 Importing resellers...');
  
  const filePath = './data/resellers.csv';
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`Found ${rows.length} resellers to import`);
  
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let imported = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const email = row['E-mailadres']?.toLowerCase().trim();
    if (!email) {
      console.log(`  ⚠️ Skipping row - no email`);
      skipped++;
      continue;
    }
    
    // Check if already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  ⏭️ Skipping ${email} - already exists`);
      skipped++;
      continue;
    }
    
    const commissionYears = parseInt(row['Aantal jaar recht op provisie']) || 3;
    const commissionRate = extractCommissionRate(row['Provisie pakket'] || '');
    
    try {
      await prisma.user.create({
        data: {
          name: row['Contactpersoon'] || row['Naam'] || 'Unknown',
          email: email,
          password: hashedPassword,
          role: 'RESELLER',
          status: mapStatus(row['Status'] || 'Actief'),
          phone: row['Telefoonnummer'] || null,
          company: row['Naam'] || null,
          website: row['Website url'] || null,
          address: row['Adres'] || null,
          postalCode: row['Postcode'] || null,
          commissionRate: commissionRate,
          commissionYears: commissionYears,
          commissionNotes: row['Provisie pakket'] || null,
          createdAt: parseDate(row['Registratiedatum']),
        }
      });
      imported++;
      console.log(`  ✅ Imported: ${email} (${row['Naam']})`);
    } catch (error: any) {
      console.log(`  ❌ Error importing ${email}: ${error.message}`);
      skipped++;
    }
  }
  
  console.log(`\n✅ Resellers import complete: ${imported} imported, ${skipped} skipped`);
  return imported;
}

async function importCustomers() {
  console.log('\n📥 Importing customers/leads...');
  
  const filePath = './data/export-reseller.csv';
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`Found ${rows.length} customers to import`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const customerEmail = row['E-mailadres']?.toLowerCase().trim();
    const resellerName = row['Reseller']?.trim();
    
    if (!customerEmail || !resellerName) {
      console.log(`  ⚠️ Skipping - missing email or reseller`);
      skipped++;
      continue;
    }
    
    // Find reseller by company name
    const reseller = await prisma.user.findFirst({
      where: {
        role: 'RESELLER',
        company: { contains: resellerName, mode: 'insensitive' }
      }
    });
    
    if (!reseller) {
      console.log(`  ⚠️ Reseller not found: ${resellerName}`);
      skipped++;
      continue;
    }
    
    // Check if customer already exists
    const existing = await prisma.customer.findFirst({
      where: { email: customerEmail }
    });
    
    if (existing) {
      console.log(`  ⏭️ Skipping ${customerEmail} - already exists`);
      skipped++;
      continue;
    }
    
    try {
      const customer = await prisma.customer.create({
        data: {
          companyName: row['Bedrijfsnaam'] || 'Unknown',
          contactName: row['Contactpersoon'] || '',
          email: customerEmail,
          phone: row['Telefoonnummer'] || null,
          websiteDomain: row['Website url'] || null,
          industry: row['Branche'] || null,
          webshopSystem: row['Webshopsysteem'] || null,
          reviewPlatform: row['Systeem'] || null,
          status: mapCustomerStatus(row['Status'] || 'In behandeling'),
          resellerId: reseller.id,
          createdAt: parseDate(row['Registratiedatum']),
        }
      });
      
      // Notes are stored on reseller, not customer - skip for now
      // Customer remarks can be added as a separate field if needed
      
      imported++;
      console.log(`  ✅ Imported: ${customerEmail} → ${resellerName}`);
    } catch (error: any) {
      console.log(`  ❌ Error importing ${customerEmail}: ${error.message}`);
      skipped++;
    }
  }
  
  console.log(`\n✅ Customers import complete: ${imported} imported, ${skipped} skipped`);
  return imported;
}

async function main() {
  console.log('🚀 Starting data import...\n');
  console.log(`Default password for resellers: ${DEFAULT_PASSWORD}\n`);
  
  try {
    const resellersImported = await importResellers();
    const customersImported = await importCustomers();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Resellers imported: ${resellersImported}`);
    console.log(`Customers imported: ${customersImported}`);
    console.log(`Default password: ${DEFAULT_PASSWORD}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
