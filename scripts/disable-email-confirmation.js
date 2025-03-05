require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

/**
 * Script to disable email confirmation requirement in Supabase
 * This allows users to log in immediately after signup without verifying their email
 */
async function disableEmailConfirmation() {
  console.log('Disabling email confirmation in Supabase...');
  
  // Create Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or service role key in environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Get all users
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      process.exit(1);
    }
    
    console.log(`Found ${usersData.users.length} users`);
    
    // Update each user to have confirmed email
    let confirmedCount = 0;
    for (const user of usersData.users) {
      if (!user.email_confirmed_at) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error(`Error confirming email for user ${user.email}:`, updateError);
        } else {
          confirmedCount++;
          console.log(`Confirmed email for user ${user.email}`);
        }
      }
    }
    
    console.log(`✅ Confirmed emails for ${confirmedCount} users`);
    console.log('Users can now log in without verifying their email addresses');
    
    // Create a test user with confirmed email to verify it works
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log(`Creating test user with confirmed email: ${testEmail}`);
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (createError) {
      console.error('Error creating test user:', createError);
    } else {
      console.log(`✅ Test user created with confirmed email: ${testEmail}`);
      
      // Clean up test user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(newUser.user.id);
      
      if (deleteError) {
        console.error('Error deleting test user:', deleteError);
      } else {
        console.log('Test user deleted');
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

// Run the function
disableEmailConfirmation(); 