/**
 * Test Authentication Flow
 * 
 * This script tests the entire authentication flow from signup to checkout,
 * with detailed logging at each step to help debug authentication issues.
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Create a log file to persist logs
const logFile = path.join(__dirname, 'auth-flow-test.log');
fs.writeFileSync(logFile, `Auth Flow Test - ${new Date().toISOString()}\n\n`);

// Helper function to log to both console and file
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  if (data) {
    console.log(data);
    fs.appendFileSync(logFile, `${logMessage}\n${JSON.stringify(data, null, 2)}\n\n`);
  } else {
    fs.appendFileSync(logFile, `${logMessage}\n\n`);
  }
}

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate a unique test user
const testEmail = `test-user-${Date.now()}@example.com`;
const testPassword = 'Test1234!';
const testFullName = 'Test User';

// Test the entire authentication flow
async function testAuthFlow() {
  log('Starting authentication flow test');
  log(`Test user: ${testEmail}`);

  try {
    // Step 1: Clean up any existing test user
    await cleanupTestUser();

    // Step 2: Test signup API
    const signupResult = await testSignup();
    
    // Step 3: Test login API
    const loginResult = await testLogin();
    
    // Step 4: Test session persistence
    await testSessionPersistence(loginResult.token);
    
    // Step 5: Test checkout page authentication
    await testCheckoutAuthentication(loginResult.token);
    
    log('Authentication flow test completed successfully');
  } catch (error) {
    log('Authentication flow test failed', { error: error.message, stack: error.stack });
  }
}

// Clean up any existing test user
async function cleanupTestUser() {
  log('Cleaning up any existing test user');
  
  try {
    // Check if user exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', testEmail);
    
    if (existingUsers && existingUsers.length > 0) {
      log('Found existing test user, deleting');
      
      // Get auth user
      const { data: authUser } = await supabase.auth.admin.listUsers({
        filter: {
          email: testEmail
        }
      });
      
      if (authUser && authUser.users && authUser.users.length > 0) {
        // Delete auth user
        const userId = authUser.users[0].id;
        await supabase.auth.admin.deleteUser(userId);
        log(`Deleted auth user with ID: ${userId}`);
      }
    } else {
      log('No existing test user found');
    }
  } catch (error) {
    log('Error cleaning up test user', { error: error.message });
  }
}

// Test the signup API
async function testSignup() {
  log('Testing signup API');
  
  try {
    // Make request to signup API
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: testFullName
      })
    });
    
    const data = await response.json();
    
    log('Signup API response', {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Check for cookies in response
    const cookies = response.headers.get('set-cookie');
    log('Signup cookies', { cookies });
    
    if (!response.ok) {
      throw new Error(`Signup failed: ${data.error || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    log('Error during signup', { error: error.message });
    throw error;
  }
}

// Test the login API
async function testLogin() {
  log('Testing login API');
  
  try {
    // Make request to login API
    const response = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const data = await response.json();
    
    log('Login API response', {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Check for cookies in response
    const cookies = response.headers.get('set-cookie');
    log('Login cookies', { cookies });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
    }
    
    // Extract token from cookies
    const tokenMatch = cookies?.match(/sb-access-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    return { ...data, token };
  } catch (error) {
    log('Error during login', { error: error.message });
    throw error;
  }
}

// Test session persistence
async function testSessionPersistence(token) {
  log('Testing session persistence');
  
  try {
    // Make request to session API
    const response = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        'Cookie': `sb-access-token=${token}`
      }
    });
    
    const data = await response.json();
    
    log('Session API response', {
      status: response.status,
      data
    });
    
    if (!response.ok || !data.session) {
      throw new Error('Session persistence failed');
    }
    
    return data;
  } catch (error) {
    log('Error testing session persistence', { error: error.message });
    throw error;
  }
}

// Test checkout page authentication
async function testCheckoutAuthentication(token) {
  log('Testing checkout page authentication');
  
  try {
    // Make request to checkout page
    const response = await fetch(`${baseUrl}/checkout`, {
      headers: {
        'Cookie': `sb-access-token=${token}`
      }
    });
    
    const html = await response.text();
    
    // Check if the page contains the loading message or checkout form
    const isLoading = html.includes('Checking authentication status');
    const hasCheckoutForm = html.includes('Payment Information');
    
    log('Checkout page response', {
      status: response.status,
      isLoading,
      hasCheckoutForm,
      htmlLength: html.length
    });
    
    if (isLoading && !hasCheckoutForm) {
      throw new Error('Checkout page is stuck on loading');
    }
    
    return { isLoading, hasCheckoutForm };
  } catch (error) {
    log('Error testing checkout authentication', { error: error.message });
    throw error;
  }
}

// Run the test
testAuthFlow().catch(error => {
  log('Unhandled error in test', { error: error.message, stack: error.stack });
  process.exit(1);
}); 