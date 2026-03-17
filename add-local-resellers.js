const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function addResellers() {
  try {
    console.log('🔍 Checking existing resellers...');
    
    const existingResellers = await prisma.user.findMany({
      where: { role: 'RESELLER' }
    });

    if (existingResellers.length > 0) {
      console.log('\n📋 Existing reseller accounts:');
      existingResellers.forEach((r, i) => {
        console.log(`${i + 1}. Email: ${r.email} | Name: ${r.name} | Role: ${r.role}`);
      });
      
      // Ask if you want to add more
      console.log('\n✅ Found existing resellers. No need to create new ones.');
      return;
    }

    // Create reseller accounts
    const resellers = [
      {
        email: 'john@reseller.com',
        password: 'Reseller123!',
        name: 'John Doe',
        company: 'John Trading',
        phone: '+1234567890'
      },
      {
        email: 'jane@reseller.com',
        password: 'Reseller123!',
        name: 'Jane Smith',
        company: 'Smith Enterprises',
        phone: '+0987654321'
      },
      {
        email: 'mike@reseller.com',
        password: 'Reseller123!',
        name: 'Mike Wilson',
        company: 'Wilson & Co',
        phone: '+1122334455'
      }
    ];

    console.log('\n📝 Creating reseller accounts...');

    for (const reseller of resellers) {
      const hashedPassword = await bcrypt.hash(reseller.password, 10);
      
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: reseller.email,
          password: hashedPassword,
          name: reseller.name,
          company: reseller.company,
          phone: reseller.phone,
          role: 'RESELLER',
          status: 'ACTIVE',
          currency: 'USD'
        }
      });

      console.log(`✅ Created: ${user.email} (${user.name})`);
    }

    console.log('\n🎉 All reseller accounts created!');
    console.log('\n📧 Test credentials:');
    console.log('   Email: john@reseller.com | Password: Reseller123!');
    console.log('   Email: jane@reseller.com | Password: Reseller123!');
    console.log('   Email: mike@reseller.com | Password: Reseller123!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addResellers();
