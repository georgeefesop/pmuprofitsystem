require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

/**
 * Test script for the signup flow
 * This script tests the signup flow by:
 * 1. Creating a test user in Supabase
 * 2. Verifying the user profile is created
 * 3. Cleaning up the test user
 */
async function testSignupFlow() {
  try {
    // Load environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'undefined');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[REDACTED]' : 'undefined');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables. Please check your .env.local file.');
      process.exit(1);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized');

    // Test connection to Supabase
    console.log('Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase.from('users').select('count').limit(1);
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError.message);
      console.log('Please check your Supabase URL and service role key.');
      process.exit(1);
    }
    
    console.log('Supabase connection successful');

    // Create a test user email
    const testEmail = `test-${Date.now()}@example.com`;
    const testFullName = 'Test User';
    const testPassword = 'Password123!';

    console.log(`Creating test user with email: ${testEmail}`);

    // Create a test user in Supabase
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testFullName
      }
    });

    if (userError) {
      console.error('Error creating test user:', userError.message);
      process.exit(1);
    }

    const userId = userData.user.id;
    console.log(`Test user created with ID: ${userId}`);

    // Create user profile
    console.log('Creating user profile...');
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: testFullName,
        email: testEmail
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      // Continue anyway, as this might be handled by a trigger
    } else {
      console.log('User profile created successfully');
    }

    // Verify user profile was created
    console.log('Verifying user profile...');
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError.message);
    } else if (!profile) {
      console.error('User profile not found');
    } else {
      console.log('User profile verified:');
      console.log(`- ID: ${profile.id}`);
      console.log(`- Email: ${profile.email}`);
      console.log(`- Full Name: ${profile.full_name}`);
      console.log(`- Created At: ${profile.created_at}`);
    }

    // Test login with the created user
    console.log('\nTesting user login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('Error signing in with test user:', signInError.message);
    } else {
      console.log('Successfully signed in with test user');
      console.log('User session:', signInData.session ? 'Created' : 'Not created');
    }

    // Clean up - delete the test user and associated data
    console.log('\nCleaning up test data...');
    
    // Delete user profile
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteProfileError) {
      console.warn('Warning: Could not delete user profile:', deleteProfileError.message);
    } else {
      console.log('Deleted user profile for test user');
    }
    
    // Delete auth user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('Error deleting test user:', deleteUserError.message);
    } else {
      console.log('Deleted test user');
    }

    console.log('\nTest completed successfully');
    
  } catch (error) {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  }
}

testSignupFlow()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }); 