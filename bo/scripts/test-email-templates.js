#!/usr/bin/env node

/**
 * Test script for role-specific email templates
 * Demonstrates the enhanced email invitation system
 */

const path = require('path');
process.env.NODE_ENV = 'development'; // Ensure development mode

// Import the email service
const { sendRoleBasedInvitationEmail, getAvailableEmailTemplates, getEmailSubjectForRole } = require('../src/lib/email.ts');

const TEST_EMAIL = 'test@example.com';
const TEST_MAGIC_LINK = 'https://playhard.local/magic-link-test-token-12345';

const roles = [
  'system-admin',
  'organization-owner', 
  'organization-admin',
  'game-master',
  'game-staff',
  'game-player'
];

async function testRoleBasedEmails() {
  console.log('🧪 Testing Role-Based Email Templates');
  console.log('=====================================\n');

  // Show available templates
  const templates = getAvailableEmailTemplates();
  console.log('📧 Available Email Templates:');
  Object.entries(templates).forEach(([role, template]) => {
    console.log(`  • ${role}: ${template}`);
  });
  console.log('\n');

  // Test each role
  for (const role of roles) {
    console.log(`🎭 Testing ${role.toUpperCase()} invitation email`);
    console.log(`Subject: ${getEmailSubjectForRole(role)}`);
    
    try {
      const result = await sendRoleBasedInvitationEmail({
        email: TEST_EMAIL,
        magicLinkUrl: TEST_MAGIC_LINK,
        recipientName: '測試用戶',
        role: role,
        organizationName: '測試劇本殺門店',
        inviterName: '系統管理員',
        expiresInMinutes: 15
      });

      if (result.success) {
        console.log(`✅ SUCCESS: ${result.emailAddress}`);
        if (result.messageId) {
          console.log(`   Message ID: ${result.messageId}`);
        }
        if (result.developmentMode) {
          console.log(`   Mode: Development (console display)`);
        }
      } else {
        console.log(`❌ FAILED: ${result.error}`);
      }

    } catch (error) {
      console.error(`💥 ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 Email template testing completed!');
  console.log('\nℹ️  In development mode, emails are displayed in console.');
  console.log('ℹ️  For actual email delivery, set NODE_ENV=production and use verified email addresses.');
}

// Export for use in other scripts
module.exports = {
  testRoleBasedEmails,
  roles,
  TEST_EMAIL,
  TEST_MAGIC_LINK
};

// Run if called directly
if (require.main === module) {
  testRoleBasedEmails()
    .then(() => {
      console.log('\n🔚 Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}