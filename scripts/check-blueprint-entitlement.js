#!/usr/bin/env node

/**
 * Script to check if george.efesopa@gmail.com has an entitlement for the Consultation Success Blueprint
 * Usage: node check-blueprint-entitlement.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Fixed values for this specific check
const userEmail = 'george.efesopa@gmail.com';
const productName = 'Consultation Success Blueprint';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables not set');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log(`Checking Blueprint entitlement for: ${userEmail}`);
  console.log('-----------------------------------');

  try {
    // First, let's check if the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error(`Error: User with email ${userEmail} not found`);
      console.error(userError.message);
      process.exit(1);
    }

    const userId = userData.id;
    console.log(`Found user ID: ${userId}`);

    // Get the Blueprint product ID
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('name', productName)
      .single();

    if (productError) {
      console.error(`Error: Product "${productName}" not found`);
      console.error(productError.message);
      process.exit(1);
    }

    const productId = productData.id;
    console.log(`Found product: ${productData.name} (ID: ${productId}, Price: $${productData.price})`);

    // Check for active entitlements
    const { data: entitlements, error: entitlementError } = await supabase
      .from('user_entitlements')
      .select('id, created_at, is_active')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('is_active', true);

    if (entitlementError) {
      console.error('Error checking entitlements:', entitlementError.message);
      process.exit(1);
    }

    if (entitlements && entitlements.length > 0) {
      console.log('\n✅ ACTIVE BLUEPRINT ENTITLEMENT FOUND:');
      entitlements.forEach((ent, index) => {
        console.log(`  ${index + 1}. ID: ${ent.id}`);
        console.log(`     Created: ${new Date(ent.created_at).toLocaleString()}`);
        console.log(`     Active: ${ent.is_active}`);
      });
    } else {
      console.log('\n❌ NO ACTIVE BLUEPRINT ENTITLEMENT FOUND');
    }

    // Check for purchases (regardless of status)
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, created_at, status, payment_intent_id')
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (purchaseError) {
      console.error('Error checking purchases:', purchaseError.message);
      process.exit(1);
    }

    if (purchases && purchases.length > 0) {
      console.log('\n📦 BLUEPRINT PURCHASES FOUND:');
      purchases.forEach((purchase, index) => {
        console.log(`  ${index + 1}. ID: ${purchase.id}`);
        console.log(`     Created: ${new Date(purchase.created_at).toLocaleString()}`);
        console.log(`     Status: ${purchase.status}`);
        console.log(`     Payment Intent: ${purchase.payment_intent_id || 'N/A'}`);
      });

      // If there are pending purchases, suggest how to fix them
      const pendingPurchases = purchases.filter(p => p.status === 'pending');
      if (pendingPurchases.length > 0) {
        console.log('\n⚠️ PENDING PURCHASES DETECTED');
        console.log('To manually create entitlements for these purchases, you can run:');
        pendingPurchases.forEach(purchase => {
          console.log(`\nnpx supabase-cli create-entitlement --purchase-id=${purchase.id} --user-id=${userId} --product-id=${productId}`);
        });
      }
    } else {
      console.log('\n❌ NO BLUEPRINT PURCHASES FOUND');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main(); 