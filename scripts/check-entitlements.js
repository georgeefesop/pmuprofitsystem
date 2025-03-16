#!/usr/bin/env node

/**
 * Script to check if a user has an entitlement for a specific product
 * Usage: node check-entitlements.js <email> <product-name>
 * Example: node check-entitlements.js george.efesopa@gmail.com "Consultation Success Blueprint"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get command line arguments
const userEmail = process.argv[2];
const productName = process.argv[3];

if (!userEmail || !productName) {
  console.error('Usage: node check-entitlements.js <email> <product-name>');
  console.error('Example: node check-entitlements.js user@example.com "Consultation Success Blueprint"');
  process.exit(1);
}

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
  console.log(`Checking entitlements for user: ${userEmail}`);
  console.log(`Product: ${productName}`);
  console.log('-----------------------------------');

  try {
    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error(`Error: User with email ${userEmail} not found`);
      console.error(userError?.message || 'No user data returned');
      process.exit(1);
    }

    const userId = userData.id;
    console.log(`Found user ID: ${userId}`);

    // Get product ID from name
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .ilike('name', `%${productName}%`)
      .single();

    if (productError || !productData) {
      console.error(`Error: Product with name containing "${productName}" not found`);
      console.error(productError?.message || 'No product data returned');
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
      console.log('\n✅ ACTIVE ENTITLEMENTS FOUND:');
      entitlements.forEach((ent, index) => {
        console.log(`  ${index + 1}. ID: ${ent.id}`);
        console.log(`     Created: ${new Date(ent.created_at).toLocaleString()}`);
        console.log(`     Active: ${ent.is_active}`);
      });
    } else {
      console.log('\n❌ NO ACTIVE ENTITLEMENTS FOUND');
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
      console.log('\n📦 PURCHASES FOUND:');
      purchases.forEach((purchase, index) => {
        console.log(`  ${index + 1}. ID: ${purchase.id}`);
        console.log(`     Created: ${new Date(purchase.created_at).toLocaleString()}`);
        console.log(`     Status: ${purchase.status}`);
        console.log(`     Payment Intent: ${purchase.payment_intent_id || 'N/A'}`);
      });
    } else {
      console.log('\n❌ NO PURCHASES FOUND');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main(); 