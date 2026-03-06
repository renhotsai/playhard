/**
 * Test Admin Creation Script
 * Tests the admin creation with different email addresses
 */

async function testAdminCreation(email) {
  try {
    console.log(`\n🧪 Testing admin creation with email: ${email}`);
    
    // First reset any existing admin
    console.log('1. Resetting existing admins...');
    const resetResponse = await fetch('http://localhost:3000/scripts/reset-admin', {
      method: 'POST'
    });
    
    if (resetResponse.ok) {
      const resetResult = await resetResponse.text();
      console.log('Reset result:', resetResult);
    }
    
    // Update .env for this test email
    const fs = require('fs');
    const envPath = './.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the email in the env file
    envContent = envContent.replace(
      /DEFAULT_OWNER_EMAIL="[^"]*"/,
      `DEFAULT_OWNER_EMAIL="${email}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log(`2. Updated DEFAULT_OWNER_EMAIL to: ${email}`);
    
    // Create admin
    console.log('3. Creating admin via GET /api/create-admin...');
    const createResponse = await fetch('http://localhost:3000/api/create-admin');
    const createResult = await createResponse.json();
    
    console.log('4. Admin creation result:', JSON.stringify(createResult, null, 2));
    console.log(`Status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      console.log('✅ Admin creation successful!');
      console.log('📧 Check console logs above for magic link URL');
    } else {
      console.log('❌ Admin creation failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test with different emails
const testEmails = [
  'test@example.com',
  'admin@test.local',
  'newuser@playhard.test'
];

async function runTests() {
  console.log('🚀 Starting admin creation tests...');
  
  for (const email of testEmails) {
    await testAdminCreation(email);
    console.log('\n' + '-'.repeat(60));
  }
  
  console.log('\n✨ All tests completed!');
  console.log('Note: Check the server console logs for magic link URLs in development mode');
}

runTests().catch(console.error);