/**
 * Verify Sign-up and Checkout Flow Script
 * 
 * This script verifies that the sign-up and checkout flow is working correctly
 * by checking if new users and purchases are created in the database.
 * 
 * Usage: node scripts/database/verify-signup-checkout.js
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

async function verifySignupCheckout() {
  try {
    console.log('Verifying sign-up and checkout flow...');

    // Check if there are any users
    console.log('Checking for users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error getting users:', usersError);
      return;
    }

    if (users.users.length === 0) {
      console.log('No users found. Please sign up first.');
      return;
    }

    console.log(`Found ${users.users.length} users:`);
    users.users.forEach(user => {
      console.log(`- ${user.email} (${user.id})`);
    });

    // Check if there are any purchases
    console.log('\nChecking for purchases...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*, user:user_id(email)');

    if (purchasesError) {
      console.error('Error getting purchases:', purchasesError);
      return;
    }

    if (purchases.length === 0) {
      console.log('No purchases found. Please complete a checkout first.');
      return;
    }

    console.log(`Found ${purchases.length} purchases:`);
    purchases.forEach(purchase => {
      console.log(`- User: ${purchase.user?.email || purchase.user_id}`);
      console.log(`  Product ID: ${purchase.product_id}`);
      console.log(`  Amount: ${purchase.currency} ${purchase.amount}`);
      console.log(`  Status: ${purchase.status}`);
      console.log(`  Created at: ${purchase.created_at}`);
      console.log('');
    });

    // Check if there are any user entitlements
    console.log('Checking for user entitlements...');
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*');

    if (entitlementsError) {
      console.error('Error getting user entitlements:', entitlementsError);
      return;
    }

    if (entitlements.length === 0) {
      console.log('No user entitlements found. User entitlements should be created after a purchase.');
      return;
    }

    console.log(`Found ${entitlements.length} user entitlements:`);
    entitlements.forEach(entitlement => {
      console.log(`- User ID: ${entitlement.user_id}`);
      console.log(`  Product ID: ${entitlement.product_id}`);
      console.log(`  Source: ${entitlement.source_type} (${entitlement.source_id})`);
      console.log(`  Active: ${entitlement.is_active}`);
      console.log(`  Created at: ${entitlement.created_at}`);
      console.log('');
    });

    console.log('Sign-up and checkout flow verification completed.');
    
    if (users.users.length > 0 && purchases.length > 0 && entitlements.length > 0) {
      console.log('\n✅ SUCCESS: The sign-up and checkout flow is working correctly!');
    } else {
      console.log('\n❌ FAILURE: The sign-up and checkout flow is not working correctly.');
      if (users.users.length === 0) {
        console.log('- No users found. Please sign up first.');
      }
      if (purchases.length === 0) {
        console.log('- No purchases found. Please complete a checkout first.');
      }
      if (entitlements.length === 0) {
        console.log('- No user entitlements found. User entitlements should be created after a purchase.');
      }
    }
  } catch (error) {
    console.error('Error verifying sign-up and checkout flow:', error);
    process.exit(1);
  }
}

verifySignupCheckout(); 