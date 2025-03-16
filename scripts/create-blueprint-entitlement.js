#!/usr/bin/env node

/**
 * Script to create an entitlement for the Consultation Success Blueprint product
 * for the user george.efesopa@gmail.com
 * 
 * Usage: node create-blueprint-entitlement.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Fixed values for this specific task
const userEmail = 'george.efesopa@gmail.com';
const productId = 'e5749058-500d-4333-8938-c8a19b16cd65'; // Consultation Success Blueprint UUID
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
  console.log(`Creating Blueprint entitlement for: ${userEmail}`);
  console.log('-----------------------------------');

  try {
    // First, let's check if the user exists
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
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

    // Check if the entitlement already exists
    const { data: existingEntitlement, error: entitlementCheckError } = await supabase
      .from('user_entitlements')
      .select('id, created_at, is_active')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .single();

    if (entitlementCheckError && entitlementCheckError.code !== 'PGRST116') {
      console.error('Error checking for existing entitlement:', entitlementCheckError);
      process.exit(1);
    }

    if (existingEntitlement) {
      console.log('\n⚠️ User already has an active Blueprint entitlement:');
      console.log(`  ID: ${existingEntitlement.id}`);
      console.log(`  Created: ${new Date(existingEntitlement.created_at).toLocaleString()}`);
      console.log(`  Active: ${existingEntitlement.is_active}`);
      
      const proceed = await promptYesNo('Do you want to create another entitlement anyway?');
      if (!proceed) {
        console.log('Operation cancelled by user.');
        process.exit(0);
      }
    }

    // Check if the user has a purchase for the main product
    const { data: mainPurchase, error: mainPurchaseError } = await supabase
      .from('purchases')
      .select('id, status')
      .eq('user_id', userId)
      .eq('product_id', '4a554622-d759-42b7-b830-79c9136d2f96') // PMU Profit System
      .eq('status', 'completed')
      .single();

    if (mainPurchaseError && mainPurchaseError.code !== 'PGRST116') {
      console.error('Error checking for main product purchase:', mainPurchaseError);
    }

    let purchaseId;

    if (mainPurchase) {
      console.log(`Found main product purchase: ${mainPurchase.id}`);
      purchaseId = mainPurchase.id;
    } else {
      console.log('No main product purchase found, creating a new purchase record for Blueprint');
      
      // Create a new purchase record for the Blueprint
      const { data: newPurchase, error: createPurchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: productId,
          status: 'completed',
          amount: 33, // Blueprint price
          created_at: new Date().toISOString(),
          metadata: {
            direct_creation: true,
            created_by: 'admin-script'
          }
        })
        .select()
        .single();

      if (createPurchaseError) {
        console.error('Error creating purchase record:', createPurchaseError);
        process.exit(1);
      }

      console.log(`Created new purchase record: ${newPurchase.id}`);
      purchaseId = newPurchase.id;
    }

    // Create the entitlement
    const now = new Date().toISOString();
    
    const { data: entitlement, error: createEntitlementError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: userId,
        product_id: productId,
        source_type: 'purchase',
        source_id: purchaseId,
        valid_from: now,
        is_active: true,
        created_at: now
      })
      .select()
      .single();

    if (createEntitlementError) {
      console.error('Error creating entitlement:', createEntitlementError);
      process.exit(1);
    }

    console.log('\n✅ BLUEPRINT ENTITLEMENT CREATED SUCCESSFULLY:');
    console.log(`  ID: ${entitlement.id}`);
    console.log(`  Created: ${new Date(entitlement.created_at).toLocaleString()}`);
    console.log(`  Active: ${entitlement.is_active}`);
    console.log(`  Source: ${entitlement.source_type} (ID: ${entitlement.source_id})`);

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Helper function to prompt for yes/no
function promptYesNo(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question(`${question} (y/n) `, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

main(); 