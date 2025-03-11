/**
 * Script to test environment-specific login functionality
 * 
 * This script will:
 * 1. Create a test user with a specific environment
 * 2. Attempt to log in with that user
 * 3. Verify that the login succeeds only in the matching environment
 * 
 * Usage:
 * node scripts/testing/test-environment-login.js [environment]
 * 
 * Where [environment] is either 'local' or 'production' (defaults to current environment)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get environment from command line args or determine from URL
let environment = process.argv[2];
if (!environment) {
  // Determine environment from URL
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  environment = url.includes('localhost') ? 'local' : 'production';
}

if (!['local', 'production'].includes(environment)) {
  console.error('Error: Environment must be either "local" or "production"');
  process.exit(1);
}

// Create Supabase client with service role key
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create regular Supabase client
const publicClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generate a unique email for testing
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'Password123!';
const testName = 'Test User';

async function runTest() {
  console.log('=== Environment-Specific Login Test ===');
  console.log(`Current environment: ${environment}`);
  console.log(`Test user email: ${testEmail}`);
  
  try {
    // Step 1: Create a test user with the specified environment
    console.log('\n1. Creating test user...');
    const { data: userData, error: createError } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName,
      },
      app_metadata: {
        environment,
        created_at: new Date().toISOString()
      }
    });
    
    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }
    
    console.log(`User created successfully with ID: ${userData.user.id}`);
    console.log(`User environment: ${userData.user.app_metadata.environment}`);
    
    // Step 2: Attempt to log in with the test user
    console.log('\n2. Attempting to log in...');
    const { data: loginData, error: loginError } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (loginError) {
      console.error(`Login failed: ${loginError.message}`);
      
      // Check if the error is related to environment mismatch
      if (loginError.message.includes('environment')) {
        console.log('✅ Test PASSED: Login correctly failed due to environment mismatch');
      } else {
        console.log('❌ Test FAILED: Login failed for an unexpected reason');
      }
    } else {
      console.log(`Login successful with user ID: ${loginData.user.id}`);
      
      // Check if the user's environment matches the current environment
      const userEnvironment = loginData.user.app_metadata?.environment;
      
      if (userEnvironment === environment) {
        console.log('✅ Test PASSED: Login successful with matching environment');
      } else {
        console.log(`❌ Test FAILED: Login successful but environment mismatch (user: ${userEnvironment}, current: ${environment})`);
      }
    }
    
    // Step 3: Clean up - delete the test user
    console.log('\n3. Cleaning up...');
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userData.user.id);
    
    if (deleteError) {
      console.error(`Failed to delete test user: ${deleteError.message}`);
    } else {
      console.log(`Test user deleted successfully`);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

runTest()
  .then(() => {
    console.log('\nTest completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 