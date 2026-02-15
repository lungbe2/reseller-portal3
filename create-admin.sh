#!/bin/bash

# First, update the Prisma schema to include role field if not already there
cat > prisma/schema.prisma << 'EOF'
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      String   @default("RESELLER")
  commissionRate Float?
  currency  String   @default("USD")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  customers Customer[]
  commissions Commission[]
}

model Customer {
  id          String   @id @default(cuid())
  companyName String
  email       String
  phone       String?
  status      String   @default("LEAD")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resellerId  String
  reseller    User     @relation(fields: [resellerId], references: [id])
  commissions Commission[]

  @@index([resellerId])
}

model Commission {
  id          String   @id @default(cuid())
  amount      Float
  status      String   @default("PENDING")
  period      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resellerId  String
  customerId  String?
  reseller    User     @relation(fields: [resellerId], references: [id])
  customer    Customer? @relation(fields: [customerId], references: [id])

  @@index([resellerId])
  @@index([status])
}
EOF

echo "✅ Prisma schema updated with role field"

# Push schema to database
echo "🔄 Pushing schema to database..."
npx prisma db push

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Create ADMIN user
echo "👑 Creating ADMIN user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Delete existing test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['admin@example.com', 'test@example.com']
      }
    }
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      currency: 'USD',
      commissionRate: 0
    }
  });
  console.log('✅ ADMIN user created:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin123');
  console.log('   Role: ADMIN');

  // Create reseller user
  const resellerPassword = await bcrypt.hash('password123', 10);
  const reseller = await prisma.user.create({
    data: {
      name: 'Test Reseller',
      email: 'reseller@example.com',
      password: resellerPassword,
      role: 'RESELLER',
      currency: 'USD',
      commissionRate: 10.5
    }
  });
  console.log('✅ RESELLER user created:');
  console.log('   Email: reseller@example.com');
  console.log('   Password: password123');
  console.log('   Role: RESELLER');
}

main().catch(console.error).finally(() => prisma.\$disconnect());
"

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo ""
echo "========================================="
echo "✅ FIX COMPLETE!"
echo "========================================="
echo ""
echo "ADMIN LOGIN:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
echo "RESELLER LOGIN:"
echo "  Email: reseller@example.com"
echo "  Password: password123"
echo ""
echo "========================================="
echo ""
echo "🚀 Starting dev server..."
npm run dev
