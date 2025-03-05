require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

/**
 * Script to disable email confirmation requirement in Supabase
 * This allows users to log in immediately after signup without verifying their email
 */
async function disableEmailConfirmation() {
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

    // Initialize Supabase client with service role key
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

    // Get all existing users
    console.log('Fetching all users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError.message);
      process.exit(1);
    }
    
    console.log(`Found ${users.users.length} users`);

    // Update all users to have confirmed emails
    console.log('Updating users to have confirmed emails...');
    let updatedCount = 0;
    
    for (const user of users.users) {
      // Skip users who already have confirmed emails
      if (user.email_confirmed_at) {
        console.log(`User ${user.email} already has a confirmed email`);
        continue;
      }
      
      // Update user to have confirmed email
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error(`Error confirming email for user ${user.email}:`, updateError.message);
      } else {
        console.log(`Confirmed email for user ${user.email}`);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} users to have confirmed emails`);

    // Create a test user with confirmed email
    const testEmail = `test-confirmed-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log(`Creating test user with confirmed email: ${testEmail}`);
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (userError) {
      console.error('Error creating test user:', userError.message);
    } else {
      console.log(`Test user created with ID: ${userData.user.id}`);
      
      // Test login with the created user
      console.log('Testing login with the created user...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.error('Error signing in with test user:', signInError.message);
      } else {
        console.log('Successfully signed in with test user without email verification');
        console.log('User session:', signInData.session ? 'Created' : 'Not created');
      }
      
      // Clean up test user
      console.log('Cleaning up test user...');
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.user.id);
      
      if (deleteError) {
        console.error('Error deleting test user:', deleteError.message);
      } else {
        console.log('Test user deleted');
      }
    }

    console.log('\nEmail confirmation requirement has been disabled for all users');
    console.log('New users can now log in immediately after signup without verifying their email');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

disableEmailConfirmation()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }); 