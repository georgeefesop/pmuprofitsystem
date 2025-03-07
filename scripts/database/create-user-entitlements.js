/**
 * Create User Entitlements Script
 * 
 * This script creates user entitlements based on existing purchases.
 * 
 * Usage: node scripts/database/create-user-entitlements.js
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

// Map product_id strings to UUID product IDs
const productIdMap = {
  'pmu-profit-system': '4a554622-d759-42b7-b830-79c9136d2f96',
  'pmu-ad-generator': '4ba5c775-a8e4-449e-828f-19f938e3710b',
  'consultation-success-blueprint': 'e5749058-500d-4333-8938-c8a19b16cd65'
};

async function main() {
  try {
    console.log('Starting user entitlements creation...');

    // 1. Get all purchases
    console.log('Fetching purchases...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('status', 'completed');
    
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return;
    }

    console.log(`Found ${purchases.length} completed purchases`);

    // 2. Create user entitlements for each purchase
    for (const purchase of purchases) {
      const productUuid = productIdMap[purchase.product_id];
      
      if (!productUuid) {
        console.error(`No UUID mapping found for product_id: ${purchase.product_id}`);
        continue;
      }

      console.log(`Creating entitlement for user ${purchase.user_id} and product ${purchase.product_id} (${productUuid})`);
      
      const { data: entitlement, error: entitlementError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: purchase.user_id,
          product_id: productUuid,
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: new Date().toISOString(),
          valid_until: null, // No expiration
          is_active: true
        })
        .select()
        .single();
      
      if (entitlementError) {
        console.error(`Error creating entitlement for purchase ${purchase.id}:`, entitlementError);
      } else {
        console.log(`Created entitlement: ${entitlement.id}`);
      }
    }

    // 3. Verify user entitlements
    console.log('Verifying user entitlements...');
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*');
    
    if (entitlementsError) {
      console.error('Error fetching entitlements:', entitlementsError);
    } else {
      console.log(`Created ${entitlements.length} user entitlements`);
      console.table(entitlements.map(e => ({
        id: e.id,
        user_id: e.user_id,
        product_id: e.product_id,
        is_active: e.is_active
      })));
    }

    console.log('User entitlements creation completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 