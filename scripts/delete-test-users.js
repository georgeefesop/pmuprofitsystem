require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

/**
 * Script to delete test users from the Supabase database
 * This script preserves admin accounts and only deletes test users
 */
async function deleteTestUsers() {
  console.log('Starting user deletion process...');
  
  // Create Supabase client with admin privileges
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  if (!supabase) {
    console.error('Failed to create Supabase client. Check your environment variables.');
    process.exit(1);
  }
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    
    console.log(`Found ${users.users.length} users in the database.`);
    
    // Admin emails to preserve (add your admin email here)
    const adminEmails = ['admin@example.com']; // Replace with your admin email
    
    // Filter out admin users
    const testUsers = users.users.filter(user => !adminEmails.includes(user.email));
    
    console.log(`Found ${testUsers.length} test users to delete.`);
    
    // Delete each test user
    let deletedCount = 0;
    for (const user of testUsers) {
      console.log(`Deleting user: ${user.email} (${user.id})`);
      
      // Delete user from auth.users (this will cascade to public.users due to foreign key constraints)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`Error deleting user ${user.email}: ${deleteError.message}`);
      } else {
        deletedCount++;
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} test users.`);
    console.log('User deletion process completed.');
    
  } catch (error) {
    console.error('Error during user deletion process:', error);
    process.exit(1);
  }
}

// Run the function
deleteTestUsers(); 