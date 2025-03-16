#!/usr/bin/env node

/**
 * Script to create a Blueprint entitlement for a specific user
 * 
 * This script:
 * 1. Finds the user with email george.efesopa@gmail.com
 * 2. Checks if they already have a Blueprint entitlement
 * 3. Creates a Blueprint entitlement if they don't have one
 * 4. Creates a purchase record if needed
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for confirmation
function promptForConfirmation(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  try {
    // Fixed values
    const userEmail = 'george.efesopa@gmail.com';
    const blueprintProductId = 'e5749058-500d-4333-8938-c8a19b16cd65';
    const mainProductId = '4a554622-d759-42b7-b830-79c9136d2f96';
    
    console.log(`Creating Blueprint entitlement for user: ${userEmail}`);
    
    // Find the user
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      throw new Error(`Error finding user: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error(`User with email ${userEmail} not found`);
    }
    
    console.log(`Found user: ${user.id} (${user.email})`);
    
    // Check if the user already has a Blueprint entitlement
    const { data: existingEntitlement, error: entitlementError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', blueprintProductId)
      .eq('is_active', true)
      .single();
    
    if (entitlementError && entitlementError.code !== 'PGRST116') {
      throw new Error(`Error checking for existing entitlement: ${entitlementError.message}`);
    }
    
    if (existingEntitlement) {
      console.log(`User already has an active Blueprint entitlement: ${existingEntitlement.id}`);
      const shouldProceed = await promptForConfirmation('Do you want to create another entitlement anyway?');
      
      if (!shouldProceed) {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }
    }
    
    // Check if the user has a completed purchase of the main product
    const { data: mainPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', mainProductId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let sourceId;
    
    if (purchaseError && purchaseError.code !== 'PGRST116') {
      throw new Error(`Error checking for main product purchase: ${purchaseError.message}`);
    }
    
    if (!mainPurchase) {
      console.log('No completed purchase of the main product found');
      
      // Check for pending purchases of the Blueprint
      const { data: pendingPurchases, error: pendingError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', blueprintProductId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (pendingError) {
        throw new Error(`Error checking for pending Blueprint purchases: ${pendingError.message}`);
      }
      
      if (pendingPurchases && pendingPurchases.length > 0) {
        console.log(`Found ${pendingPurchases.length} pending Blueprint purchases`);
        
        // Display pending purchases
        pendingPurchases.forEach((purchase, index) => {
          console.log(`${index + 1}. Purchase ID: ${purchase.id}`);
          console.log(`   Created At: ${purchase.created_at}`);
          console.log(`   Payment Intent ID: ${purchase.stripe_payment_intent_id || 'N/A'}`);
        });
        
        // Ask which purchase to use
        const purchaseIndexPrompt = await new Promise((resolve) => {
          rl.question(`Which purchase do you want to use? (1-${pendingPurchases.length}): `, (answer) => {
            const index = parseInt(answer, 10) - 1;
            if (isNaN(index) || index < 0 || index >= pendingPurchases.length) {
              resolve(0); // Default to the first one
            } else {
              resolve(index);
            }
          });
        });
        
        const selectedPurchase = pendingPurchases[purchaseIndexPrompt];
        console.log(`Using purchase: ${selectedPurchase.id}`);
        
        // Update the purchase to completed
        const { data: updatedPurchase, error: updateError } = await supabase
          .from('purchases')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPurchase.id)
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Error updating purchase: ${updateError.message}`);
        }
        
        console.log(`Updated purchase ${updatedPurchase.id} to completed`);
        sourceId = updatedPurchase.id;
      } else {
        console.log('No pending Blueprint purchases found');
        
        // Create a new purchase record
        const shouldCreatePurchase = await promptForConfirmation('Do you want to create a new purchase record?');
        
        if (!shouldCreatePurchase) {
          console.log('Operation cancelled.');
          rl.close();
          return;
        }
        
        const now = new Date().toISOString();
        const { data: newPurchase, error: createError } = await supabase
          .from('purchases')
          .insert({
            user_id: user.id,
            product_id: blueprintProductId,
            status: 'completed',
            amount: 33,
            created_at: now,
            updated_at: now,
            metadata: {
              auto_created: true,
              created_at: now,
              created_by: 'create-blueprint-entitlement-for-user.js'
            }
          })
          .select()
          .single();
        
        if (createError) {
          throw new Error(`Error creating purchase record: ${createError.message}`);
        }
        
        console.log(`Created new purchase record: ${newPurchase.id}`);
        sourceId = newPurchase.id;
      }
    } else {
      console.log(`Found completed purchase of main product: ${mainPurchase.id}`);
      sourceId = mainPurchase.id;
    }
    
    // Create the entitlement
    const now = new Date().toISOString();
    const { data: newEntitlement, error: createEntitlementError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: user.id,
        product_id: blueprintProductId,
        source_type: 'purchase',
        source_id: sourceId,
        valid_from: now,
        is_active: true,
        created_at: now
      })
      .select()
      .single();
    
    if (createEntitlementError) {
      throw new Error(`Error creating entitlement: ${createEntitlementError.message}`);
    }
    
    console.log(`Successfully created Blueprint entitlement: ${newEntitlement.id}`);
    console.log(`User ID: ${newEntitlement.user_id}`);
    console.log(`Product ID: ${newEntitlement.product_id}`);
    console.log(`Source ID: ${newEntitlement.source_id}`);
    console.log(`Created At: ${newEntitlement.created_at}`);
    
    // Update the purchase to indicate entitlements were created
    const { error: markError } = await supabase
      .from('purchases')
      .update({ 
        entitlements_created: true,
        updated_at: now
      })
      .eq('id', sourceId);
    
    if (markError) {
      console.error(`Warning: Error marking purchase ${sourceId} as having entitlements: ${markError.message}`);
    } else {
      console.log(`Updated purchase ${sourceId} to mark entitlements as created`);
    }
    
    console.log('\nOperation completed successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 