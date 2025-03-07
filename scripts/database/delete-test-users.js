/**
 * Delete Test Users Script
 * 
 * This script deletes all test users and their associated data from the database.
 * 
 * Usage: node scripts/database/delete-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteTestUsers() {
  try {
    console.log('Starting deletion of test users and associated data...');

    // 1. Delete user entitlements
    console.log('Deleting user entitlements...');
    const { error: entitlementsError } = await supabase
      .from('user_entitlements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all

    if (entitlementsError) {
      console.error('Error deleting user entitlements:', entitlementsError);
    } else {
      console.log('User entitlements deleted successfully.');
    }

    // 2. Delete purchase items
    console.log('Deleting purchase items...');
    const { error: purchaseItemsError } = await supabase
      .from('purchase_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (purchaseItemsError) {
      console.error('Error deleting purchase items:', purchaseItemsError);
    } else {
      console.log('Purchase items deleted successfully.');
    }

    // 3. Delete purchases
    console.log('Deleting purchases...');
    const { error: purchasesError } = await supabase
      .from('purchases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (purchasesError) {
      console.error('Error deleting purchases:', purchasesError);
    } else {
      console.log('Purchases deleted successfully.');
    }

    // 4. Delete subscription items
    console.log('Deleting subscription items...');
    const { error: subscriptionItemsError } = await supabase
      .from('subscription_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (subscriptionItemsError) {
      console.error('Error deleting subscription items:', subscriptionItemsError);
    } else {
      console.log('Subscription items deleted successfully.');
    }

    // 5. Delete subscriptions
    console.log('Deleting subscriptions...');
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError);
    } else {
      console.log('Subscriptions deleted successfully.');
    }

    // 6. Delete ad generator logs
    console.log('Deleting ad generator logs...');
    const { error: adGeneratorLogsError } = await supabase
      .from('ad_generator_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (adGeneratorLogsError) {
      console.error('Error deleting ad generator logs:', adGeneratorLogsError);
    } else {
      console.log('Ad generator logs deleted successfully.');
    }

    // 7. Get all users
    console.log('Getting users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error getting users:', usersError);
      return;
    }

    // 8. Delete each user
    console.log(`Found ${users.users.length} users to delete.`);
    for (const user of users.users) {
      console.log(`Deleting user: ${user.email}...`);
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteUserError) {
        console.error(`Error deleting user ${user.email}:`, deleteUserError);
      } else {
        console.log(`User ${user.email} deleted successfully.`);
      }
    }

    console.log('All test users and associated data deleted successfully!');
  } catch (error) {
    console.error('Error deleting test users:', error);
    process.exit(1);
  }
}

deleteTestUsers(); 