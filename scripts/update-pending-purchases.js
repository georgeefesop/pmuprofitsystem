#!/usr/bin/env node

/**
 * Script to update pending purchases to completed and create entitlements for them
 * 
 * This script:
 * 1. Finds all pending purchases for a specific product or all products
 * 2. Updates them to completed status
 * 3. Creates entitlements for each purchase
 * 4. Logs the results
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

// Product ID mapping
const PRODUCT_IDS = {
  'pmu-profit-system': '4a554622-d759-42b7-b830-79c9136d2f96',
  'pmu-ad-generator': '4ba5c775-a8e4-449e-828f-19f938e3710b',
  'consultation-success-blueprint': 'e5749058-500d-4333-8938-c8a19b16cd65',
  'pricing-template': 'f2a8c6b1-9d3e-4c7f-b5a2-1e8d7f9b6c3a'
};

// Function to normalize product ID
function normalizeProductId(productId) {
  // If it's already a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
    return productId;
  }
  
  // Otherwise, look up the UUID from the mapping
  return PRODUCT_IDS[productId] || productId;
}

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
    console.log('Updating pending purchases to completed and creating entitlements...');
    
    // Ask for product ID filter (optional)
    const productIdPrompt = await new Promise((resolve) => {
      rl.question('Enter product ID to filter (leave empty for all products): ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    // Ask for user ID filter (optional)
    const userIdPrompt = await new Promise((resolve) => {
      rl.question('Enter user ID to filter (leave empty for all users): ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    // Ask for payment intent ID filter (optional)
    const paymentIntentIdPrompt = await new Promise((resolve) => {
      rl.question('Enter payment intent ID to filter (leave empty for all): ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    // Build query for pending purchases
    let query = supabase
      .from('purchases')
      .select('*')
      .eq('status', 'pending');
    
    // Apply filters if provided
    if (productIdPrompt) {
      const normalizedProductId = normalizeProductId(productIdPrompt);
      console.log(`Filtering by product ID: ${normalizedProductId}`);
      query = query.eq('product_id', normalizedProductId);
    }
    
    if (userIdPrompt) {
      console.log(`Filtering by user ID: ${userIdPrompt}`);
      query = query.eq('user_id', userIdPrompt);
    }
    
    if (paymentIntentIdPrompt) {
      console.log(`Filtering by payment intent ID: ${paymentIntentIdPrompt}`);
      query = query.eq('stripe_payment_intent_id', paymentIntentIdPrompt);
    }
    
    // Execute query
    const { data: pendingPurchases, error: pendingError } = await query;
    
    if (pendingError) {
      throw new Error(`Error fetching pending purchases: ${pendingError.message}`);
    }
    
    console.log(`Found ${pendingPurchases.length} pending purchases`);
    
    if (pendingPurchases.length === 0) {
      console.log('No pending purchases to update.');
      rl.close();
      return;
    }
    
    // Display pending purchases
    console.log('\nPending purchases:');
    pendingPurchases.forEach((purchase, index) => {
      console.log(`${index + 1}. Purchase ID: ${purchase.id}`);
      console.log(`   User ID: ${purchase.user_id}`);
      console.log(`   Product ID: ${purchase.product_id}`);
      console.log(`   Payment Intent ID: ${purchase.stripe_payment_intent_id}`);
      console.log(`   Created At: ${purchase.created_at}`);
      console.log('---');
    });
    
    // Confirm before proceeding
    const shouldProceed = await promptForConfirmation(`Update ${pendingPurchases.length} pending purchases to completed and create entitlements?`);
    
    if (!shouldProceed) {
      console.log('Operation cancelled.');
      rl.close();
      return;
    }
    
    // Update purchases and create entitlements
    console.log('\nUpdating purchases and creating entitlements...');
    const now = new Date().toISOString();
    const results = {
      updatedPurchases: 0,
      createdEntitlements: 0,
      errors: []
    };
    
    for (const purchase of pendingPurchases) {
      try {
        // Update purchase to completed
        const { data: updatedPurchase, error: updateError } = await supabase
          .from('purchases')
          .update({
            status: 'completed',
            updated_at: now
          })
          .eq('id', purchase.id)
          .select()
          .single();
          
        if (updateError) {
          results.errors.push(`Error updating purchase ${purchase.id}: ${updateError.message}`);
          continue;
        }
        
        console.log(`Updated purchase ${purchase.id} to completed`);
        results.updatedPurchases++;
        
        // Check if entitlement already exists
        const { data: existingEntitlement, error: checkError } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', purchase.user_id)
          .eq('product_id', purchase.product_id)
          .eq('is_active', true)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          results.errors.push(`Error checking for existing entitlement for purchase ${purchase.id}: ${checkError.message}`);
        } else if (!existingEntitlement) {
          // Create entitlement
          const { data: newEntitlement, error: entitlementError } = await supabase
            .from('user_entitlements')
            .insert({
              user_id: purchase.user_id,
              product_id: purchase.product_id,
              source_type: 'purchase',
              source_id: purchase.id,
              valid_from: now,
              is_active: true,
              created_at: now
            })
            .select()
            .single();
            
          if (entitlementError) {
            results.errors.push(`Error creating entitlement for purchase ${purchase.id}: ${entitlementError.message}`);
          } else {
            console.log(`Created entitlement ${newEntitlement.id} for purchase ${purchase.id}`);
            results.createdEntitlements++;
          }
        } else {
          console.log(`Entitlement already exists for purchase ${purchase.id}: ${existingEntitlement.id}`);
        }
        
        // Update purchase to indicate entitlements were created
        const { error: markError } = await supabase
          .from('purchases')
          .update({ 
            entitlements_created: true,
            updated_at: now
          })
          .eq('id', purchase.id);
          
        if (markError) {
          results.errors.push(`Error marking purchase ${purchase.id} as having entitlements: ${markError.message}`);
        }
      } catch (error) {
        results.errors.push(`Unexpected error processing purchase ${purchase.id}: ${error.message}`);
      }
    }
    
    // Display results
    console.log('\nResults:');
    console.log(`Updated ${results.updatedPurchases} purchases to completed`);
    console.log(`Created ${results.createdEntitlements} entitlements`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\nOperation completed.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 