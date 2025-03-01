const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuth() {
  try {
    console.log('Testing Supabase authentication...');
    
    // Test user creation
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    console.log(`\nAttempting to create a test user: ${testEmail}`);
    
    try {
      // Create a test user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (userError) {
        console.error('Error creating test user:', userError.message);
      } else {
        console.log('✅ Test user created successfully');
        console.log(userData);
      }
    } catch (createError) {
      console.error('Exception creating user:', createError);
    }
    
    // Test authentication
    console.log('\nTesting authentication with the test user');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (authError) {
        console.error('Error authenticating test user:', authError.message);
      } else {
        console.log('✅ Authentication successful');
        console.log('User ID:', authData.user.id);
        console.log('Session:', authData.session ? 'Valid' : 'Invalid');
      }
    } catch (authError) {
      console.error('Exception during authentication:', authError);
    }
    
  } catch (error) {
    console.error('Error testing authentication:', error);
  }
}

testAuth().catch(err => {
  console.error('Unhandled error in testAuth:', err);
}); 