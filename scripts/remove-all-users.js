require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of admin emails that should not be deleted
const ADMIN_EMAILS = [
  'admin@pmuprofitsystem.com',
  // Add other admin emails here
];

/**
 * Remove all users from Supabase except for admin accounts
 */
async function removeAllUsers() {
  try {
    console.log('Fetching all users from Supabase...');
    
    // Get all users from auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error.message);
      return;
    }
    
    if (!users || !users.users || users.users.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log(`Found ${users.users.length} users in total.`);
    
    // Filter out admin users
    const usersToDelete = users.users.filter(user => !ADMIN_EMAILS.includes(user.email));
    
    console.log(`Preparing to delete ${usersToDelete.length} non-admin users...`);
    
    // Delete each user
    for (const user of usersToDelete) {
      console.log(`Processing user: ${user.id} (${user.email})`);
      
      try {
        // First delete any purchases associated with this user
        const { error: purchasesError } = await supabase
          .from('purchases')
          .delete()
          .eq('user_id', user.id);
          
        if (purchasesError) {
          console.warn(`Warning: Could not delete purchases for user ${user.id}: ${purchasesError.message}`);
        } else {
          console.log(`Deleted purchases for user ${user.id}`);
        }
        
        // Delete user profile from public.users if it exists
        const { error: profileError } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
          
        if (profileError) {
          console.warn(`Warning: Could not delete profile for user ${user.id}: ${profileError.message}`);
        } else {
          console.log(`Deleted profile for user ${user.id}`);
        }
        
        // Finally delete the user from auth.users
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${user.id}: ${deleteError.message}`);
        } else {
          console.log(`Successfully deleted user ${user.id} (${user.email})`);
        }
      } catch (err) {
        console.error(`Unexpected error processing user ${user.id}:`, err);
      }
    }
    
    console.log('User deletion process completed.');
    
  } catch (error) {
    console.error('Unexpected error during user removal:', error);
  }
}

removeAllUsers()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }); 