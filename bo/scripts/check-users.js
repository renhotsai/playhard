/**
 * Check all users and their roles
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 All users in the system:');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            sessions: true,
            members: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.table(users.map(user => ({
      email: user.email,
      name: user.name || 'No name',
      role: user.role,
      verified: user.emailVerified,
      sessions: user._count.sessions,
      organizations: user._count.members,
      created: user.createdAt.toISOString().split('T')[0]
    })));

    console.log(`\n📊 Total users: ${users.length}`);
    console.log(`🔐 Admin users: ${users.filter(u => ['admin', 'super_admin'].includes(u.role)).length}`);
    console.log(`👤 Regular members: ${users.filter(u => u.role === 'member').length}`);

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();