require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeAllTestUsers() {
  console.log('Starting removal of all test users...');
  
  try {
    // 1. Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Error fetching auth users: ${authError.message}`);
    }
    
    console.log(`Found ${authUsers.users.length} users in auth.users`);
    
    // 2. Delete each user's related records and then the user itself
    for (const user of authUsers.users) {
      console.log(`Processing user: ${user.email} (${user.id})`);
      
      // 2.1 Delete purchases for this user
      const { error: purchaseDeleteError } = await supabase
        .from('purchases')
        .delete()
        .eq('user_id', user.id);
      
      if (purchaseDeleteError) {
        console.warn(`Warning: Error deleting purchases for user ${user.id}: ${purchaseDeleteError.message}`);
      } else {
        console.log(`Deleted purchases for user ${user.id}`);
      }
      
      // 2.2 Delete user profile from public.users
      const { error: profileDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (profileDeleteError) {
        console.warn(`Warning: Error deleting profile for user ${user.id}: ${profileDeleteError.message}`);
      } else {
        console.log(`Deleted profile for user ${user.id}`);
      }
      
      // 2.3 Delete the auth user
      const { error: userDeleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (userDeleteError) {
        console.warn(`Warning: Error deleting auth user ${user.id}: ${userDeleteError.message}`);
      } else {
        console.log(`Deleted auth user ${user.id}`);
      }
    }
    
    console.log('Successfully removed all test users and their related data');
  } catch (error) {
    console.error('Error removing test users:', error.message);
  }
}

// Execute the function
removeAllTestUsers(); 