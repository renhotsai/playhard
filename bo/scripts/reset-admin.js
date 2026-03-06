/**
 * Reset System Admin Script
 * Clears existing admin users and allows fresh bootstrap
 */

const { PrismaClient } = require('../src/generated/prisma');

async function resetAdmin() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Starting admin reset process...');

    // Remove all users with admin role
    const deletedAdmins = await prisma.user.deleteMany({
      where: {
        role: 'admin'
      }
    });

    console.log(`✅ Deleted ${deletedAdmins.count} admin users`);

    // Also remove any test users with the old email
    const deletedTestUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@playhard.local', 'owner@playhard.local']
        }
      }
    });

    console.log(`✅ Deleted ${deletedTestUsers.count} test users`);

    console.log('🎉 Admin reset complete! You can now run /api/create-admin to bootstrap the system with the correct email address.');

  } catch (error) {
    console.error('❌ Error during admin reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();