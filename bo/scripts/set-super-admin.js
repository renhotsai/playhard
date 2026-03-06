/**
 * Set Super Admin Role Script
 * Updates the admin user to have super_admin role
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function setSuperAdmin() {
  try {
    console.log('🔧 Setting up super admin user...');

    // Find user with email admin or admin123
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'admin' },
          { email: 'admin123' },
          { email: { contains: 'admin' } }
        ]
      }
    });

    console.log(`Found ${adminUsers.length} admin-like users:`, 
      adminUsers.map(u => ({ email: u.email, currentRole: u.role })));

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found. Creating one...');
      
      // Create super admin user if none exists
      const newAdmin = await prisma.user.create({
        data: {
          id: crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID(),
          email: 'admin',
          name: 'Super Administrator',
          role: 'super_admin',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Created super admin user:', newAdmin);
      return;
    }

    // Update all admin users to super_admin
    for (const user of adminUsers) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'super_admin' },
        select: { id: true, email: true, name: true, role: true }
      });
      
      console.log(`✅ Updated ${user.email} to super_admin:`, updated);
    }

    console.log('🎉 Super admin setup completed!');
    console.log('\n📋 Current admin users:');
    
    const allAdmins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { email: true, name: true, role: true, createdAt: true }
    });
    
    console.table(allAdmins);

  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setSuperAdmin();