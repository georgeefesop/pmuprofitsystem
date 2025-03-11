/**
 * Test script for environment-specific login with mismatched environments
 * 
 * This script tests the scenario where a user created in one environment
 * attempts to log in from a different environment.
 * 
 * Usage: node scripts/testing/test-environment-mismatch.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create service client for admin operations
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create regular client for user operations
const publicClient = createClient(supabaseUrl, supabaseAnonKey);

// Test environments
const CREATE_ENVIRONMENT = 'production';
const LOGIN_ENVIRONMENT = 'local';

// Generate a unique test email
const testEmail = `test-mismatch-${Date.now()}@example.com`;
const testPassword = 'Password123!';

// Simulate the AuthContext environment check
function simulateAuthContextCheck(user, loginEnvironment) {
  console.log('Simulating AuthContext environment check:');
  console.log(`- User environment: ${user.app_metadata?.environment || 'undefined'}`);
  console.log(`- Login environment: ${loginEnvironment}`);
  
  const userEnvironment = user.app_metadata?.environment;
  
  if (userEnvironment && userEnvironment !== loginEnvironment) {
    console.log('✅ Test PASSED: AuthContext would detect the environment mismatch');
    return {
      success: false,
      error: `This account was created in the ${userEnvironment === 'local' ? 'Local Development' : 'Production'} environment and cannot be accessed from the ${loginEnvironment === 'local' ? 'Local Development' : 'Production'} environment.`
    };
  }
  
  console.log('❌ Test FAILED: AuthContext would allow login despite environment mismatch');
  return { success: true };
}

async function runTest() {
  console.log('\n=== Environment Mismatch Login Test ===');
  console.log(`Creating user in: ${CREATE_ENVIRONMENT}`);
  console.log(`Attempting login from: ${LOGIN_ENVIRONMENT}`);
  console.log(`Test user email: ${testEmail}`);
  
  let userId = null;
  
  try {
    // 1. Create a test user with CREATE_ENVIRONMENT
    console.log('\n1. Creating test user...');
    
    const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
      },
      app_metadata: {
        environment: CREATE_ENVIRONMENT,
        environment_updated_at: new Date().toISOString()
      }
    });
    
    if (createError) {
      throw new Error(`Error creating test user: ${createError.message}`);
    }
    
    userId = createData.user.id;
    console.log(`User created successfully with ID: ${userId}`);
    console.log(`User environment: ${createData.user.app_metadata.environment}`);
    
    // Wait a moment to ensure the user is fully created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Attempt to log in
    console.log('\n2. Attempting to log in...');
    
    // First sign out if already signed in
    await publicClient.auth.signOut();
    
    // Log in with the regular client
    const { data: loginData, error: loginError } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Test FAILED: Login failed at Supabase level');
      console.log(`Error message: ${loginError.message}`);
    } else {
      console.log('Login successful at Supabase level');
      console.log(`User ID: ${loginData.user.id}`);
      
      // Now simulate the AuthContext environment check
      console.log('\n3. Simulating AuthContext environment check...');
      const result = simulateAuthContextCheck(loginData.user, LOGIN_ENVIRONMENT);
      
      if (!result.success) {
        console.log(`Environment mismatch detected: ${result.error}`);
      } else {
        console.log('No environment mismatch detected');
      }
    }
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    // Clean up - delete the test user
    console.log('\n4. Cleaning up...');
    
    if (userId) {
      try {
        // Use admin functions to delete the user
        const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
        
        if (deleteError) {
          console.error(`Error deleting test user: ${deleteError.message}`);
        } else {
          console.log('Test user deleted successfully');
        }
      } catch (deleteError) {
        console.error(`Failed to delete test user: ${deleteError.message}`);
        console.log('Note: You may need to manually delete this test user');
      }
    }
    
    console.log('\nTest completed!');
  }
}

runTest(); 