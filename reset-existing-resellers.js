const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetResellerPasswords() {
  try {
    console.log('🔍 Fetching existing resellers...\n');
    
    const resellers = await prisma.user.findMany({
      where: { role: 'RESELLER' },
      select: { 
        id: true, 
        email: true, 
        name: true,
        password: true 
      }
    });

    if (resellers.length === 0) {
      console.log('❌ No reseller accounts found');
      return;
    }

    console.log('📋 Found reseller accounts:\n');
    resellers.forEach((r, i) => {
      console.log(`${i + 1}. Email: ${r.email}`);
      console.log(`   Name: ${r.name}`);
      console.log(`   ID: ${r.id}`);
      console.log('---');
    });

    // Set a new password for all resellers
    const newPassword = 'Reseller123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`\n🔑 Resetting all reseller passwords to: ${newPassword}\n`);

    for (const reseller of resellers) {
      await prisma.user.update({
        where: { id: reseller.id },
        data: { password: hashedPassword }
      });
      console.log(`✅ Password reset for: ${reseller.email}`);
    }

    console.log('\n🎉 All reseller passwords have been reset!');
    console.log('\n📧 Login credentials:');
    resellers.forEach(r => {
      console.log(`   Email: ${r.email} | Password: ${newPassword}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetResellerPasswords();
