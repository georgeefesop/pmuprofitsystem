/**
 * Database Cleanup Script
 * 
 * This script deletes all user entitlements, purchases, and users from the database.
 * It's intended for development and testing purposes only.
 * 
 * Usage:
 * node scripts/clean-database.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load Supabase configuration from .env files
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If not found in environment variables, try to read from .env files
if (!supabaseUrl || !supabaseKey) {
  try {
    // Try to read from .env.local first
    let envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
          supabaseUrl = line.split('=')[1].trim().replace(/["']/g, '');
        } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
          supabaseKey = line.split('=')[1].trim().replace(/["']/g, '');
        }
      }
    }
    
    // If still not found, try .env
    if (!supabaseUrl || !supabaseKey) {
      envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');
        
        for (const line of envLines) {
          if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim().replace(/["']/g, '');
          } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            supabaseKey = line.split('=')[1].trim().replace(/["']/g, '');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading .env files:', error);
  }
}

// Check if we have the required configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and service role key are required');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment or .env files');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDatabase() {
  console.log('Starting database cleanup...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  try {
    // Delete all user entitlements
    console.log('Deleting user entitlements...');
    const { error: entitlementsError } = await supabase
      .from('user_entitlements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (entitlementsError) {
      console.error('Error deleting user entitlements:', entitlementsError);
    } else {
      console.log('User entitlements deleted successfully');
    }
    
    // Delete all purchases
    console.log('Deleting purchases...');
    const { error: purchasesError } = await supabase
      .from('purchases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (purchasesError) {
      console.error('Error deleting purchases:', purchasesError);
    } else {
      console.log('Purchases deleted successfully');
    }
    
    // Delete all users from the public schema
    console.log('Deleting users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (usersError) {
      console.error('Error deleting users:', usersError);
    } else {
      console.log('Users deleted successfully');
    }
    
    // Verify the data has been deleted
    const { data: remainingUsers } = await supabase
      .from('users')
      .select('count', { count: 'exact' });
    
    const { data: remainingEntitlements } = await supabase
      .from('user_entitlements')
      .select('count', { count: 'exact' });
    
    const { data: remainingPurchases } = await supabase
      .from('purchases')
      .select('count', { count: 'exact' });
    
    console.log('\nVerification:');
    console.log(`Remaining users: ${remainingUsers?.count || 0}`);
    console.log(`Remaining entitlements: ${remainingEntitlements?.count || 0}`);
    console.log(`Remaining purchases: ${remainingPurchases?.count || 0}`);
    
    console.log('\nDatabase cleanup completed successfully!');
  } catch (error) {
    console.error('Unexpected error during database cleanup:', error);
    process.exit(1);
  }
}

// Clean up auth users if requested
async function cleanAuthUsers() {
  console.log('\nCleaning up auth users...');
  
  try {
    // List all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing auth users:', listError);
      return;
    }
    
    console.log(`Found ${users?.users?.length || 0} auth users`);
    
    // Delete each user
    let deletedCount = 0;
    for (const user of (users?.users || [])) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`Error deleting auth user ${user.id}:`, deleteError);
      } else {
        deletedCount++;
      }
    }
    
    console.log(`Deleted ${deletedCount} auth users`);
    
    // Verify auth users have been deleted
    const { data: remainingUsers } = await supabase.auth.admin.listUsers();
    console.log(`Remaining auth users: ${remainingUsers?.users?.length || 0}`);
    
    console.log('Auth users cleanup completed!');
  } catch (error) {
    console.error('Unexpected error during auth users cleanup:', error);
  }
}

// Run the cleanup
async function run() {
  await cleanDatabase();
  await cleanAuthUsers();
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 