import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@reseller.com' },
    update: {},
    create: {
      email: 'admin@reseller.com',
      name: 'Admin User',
      password: '$2a$10$HxJqXQZz5z5z5z5z5z5z5u', // dummy hash
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  
  console.log('✅ Admin created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
