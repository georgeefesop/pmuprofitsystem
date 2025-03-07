// Script to update product prices and clean up user data using Supabase client directly
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client with service role key (needed for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key is missing in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    console.log('Starting database update...');

    // 1. Update PMU Profit System price
    console.log('Updating PMU Profit System price...');
    let { error: error1 } = await supabase
      .from('products')
      .update({ price: '37.00', currency: 'EUR' })
      .eq('name', 'PMU Profit System');
    
    if (error1) {
      console.error('Error updating PMU Profit System:', error1);
      return;
    }

    // 2. Update PMU Ad Generator price
    console.log('Updating PMU Ad Generator price...');
    let { error: error2 } = await supabase
      .from('products')
      .update({ price: '27.00', currency: 'EUR' })
      .eq('name', 'PMU Ad Generator');
    
    if (error2) {
      console.error('Error updating PMU Ad Generator:', error2);
      return;
    }

    // 3. Update Consultation Success Blueprint price
    console.log('Updating Consultation Success Blueprint price...');
    let { error: error3 } = await supabase
      .from('products')
      .update({ price: '33.00', currency: 'EUR' })
      .eq('name', 'Consultation Success Blueprint');
    
    if (error3) {
      console.error('Error updating Consultation Success Blueprint:', error3);
      return;
    }

    // 4. Delete user entitlements
    console.log('Deleting user entitlements...');
    let { error: error4 } = await supabase
      .from('user_entitlements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (error4) {
      console.error('Error deleting user entitlements:', error4);
      return;
    }

    // 5. Delete purchases
    console.log('Deleting purchases...');
    let { error: error5 } = await supabase
      .from('purchases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (error5) {
      console.error('Error deleting purchases:', error5);
      return;
    }

    // 6. Delete users (requires auth admin privileges)
    console.log('Deleting users...');
    // This requires special admin privileges, so we'll use a different approach
    // We'll get all users first
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError);
      return;
    }

    // Delete each user
    for (const user of users.users) {
      console.log(`Deleting user: ${user.email}`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`Error deleting user ${user.email}:`, deleteError);
      }
    }

    // 7. Verify product prices
    console.log('Verifying updated product prices...');
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, currency');
    
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      console.log('Updated product prices:');
      console.table(data);
    }

    console.log('Database update completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 