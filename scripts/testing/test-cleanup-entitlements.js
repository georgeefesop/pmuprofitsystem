/**
 * Test Cleanup Entitlements Script
 * 
 * This script tests the cleanup functionality for entitlements and purchases,
 * including phantom data.
 * 
 * Usage:
 * node scripts/testing/test-cleanup-entitlements.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pmuprofitsystem.vercel.app' 
  : 'http://localhost:3000';

// Test user ID - using existing test account
const TEST_USER_ID = '57e5a1a4-150d-4185-afd5-983363d608d9'; // george.efesopa@gmail.com

// Known product IDs
const MAIN_PRODUCT_ID = '4a554622-d759-42b7-b830-79c9136d2f96'; // PMU Profit System
const AD_GENERATOR_ID = '4ba5c775-a8e4-449e-828f-19f938e3710b'; // PMU Ad Generator
const BLUEPRINT_ID = 'e5749058-500d-4333-8938-c8a19b16cd65'; // Consultation Success Blueprint

async function runTest() {
  console.log('=== Test Cleanup Entitlements ===');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Base URL:', BASE_URL);
  console.log('Testing with user ID:', TEST_USER_ID);
  console.log('');
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not found in environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. First, check current entitlements and purchases
    console.log('1. Checking current entitlements and purchases...');
    
    const { data: currentEntitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*, products:product_id(*)')
      .eq('user_id', TEST_USER_ID);
    
    if (entitlementsError) {
      console.error('Error fetching entitlements:', entitlementsError);
      return;
    }
    
    console.log(`Found ${currentEntitlements.length} entitlements for user:`);
    currentEntitlements.forEach(entitlement => {
      console.log(`- ${entitlement.products?.name || 'Unknown'} (ID: ${entitlement.product_id})`);
    });
    
    const { data: currentPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', TEST_USER_ID);
    
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return;
    }
    
    console.log(`Found ${currentPurchases.length} purchases for user:`);
    currentPurchases.forEach(purchase => {
      console.log(`- Product ID: ${purchase.product_id}, Amount: ${purchase.amount}, Status: ${purchase.status}`);
    });
    
    // 2. Create a phantom entitlement for testing (using real product ID but fake purchase ID)
    console.log('\n2. Creating a phantom entitlement for testing...');
    
    const { data: phantomEntitlement, error: createError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: TEST_USER_ID,
        product_id: AD_GENERATOR_ID, // Use a real product ID
        source_type: 'purchase',
        source_id: uuidv4(), // Use a non-existent purchase ID
        valid_from: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating phantom entitlement:', createError);
    } else {
      console.log(`Created phantom entitlement with ID: ${phantomEntitlement.id}`);
      console.log(`Using real product ID: ${AD_GENERATOR_ID} but fake purchase ID: ${phantomEntitlement.source_id}`);
    }
    
    // 3. Create a phantom purchase for testing
    console.log('\n3. Creating a phantom purchase for testing...');
    
    const { data: phantomPurchase, error: createPurchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: TEST_USER_ID,
        product_id: 'phantom-product-id', // This is intentionally not a UUID to test string product IDs
        amount: '0.00',
        status: 'completed',
        currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createPurchaseError) {
      console.error('Error creating phantom purchase:', createPurchaseError);
    } else {
      console.log(`Created phantom purchase with ID: ${phantomPurchase.id}`);
    }
    
    // 4. Call the cleanup API
    console.log('\n4. Calling the cleanup API...');
    
    const response = await fetch(`${BASE_URL}/api/user-entitlements/clear-addons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error calling cleanup API:', errorData);
      return;
    }
    
    const cleanupResult = await response.json();
    console.log('Cleanup result:', cleanupResult);
    
    // 5. Check entitlements and purchases after cleanup
    console.log('\n5. Checking entitlements and purchases after cleanup...');
    
    const { data: afterEntitlements, error: afterEntitlementsError } = await supabase
      .from('user_entitlements')
      .select('*, products:product_id(*)')
      .eq('user_id', TEST_USER_ID);
    
    if (afterEntitlementsError) {
      console.error('Error fetching entitlements after cleanup:', afterEntitlementsError);
      return;
    }
    
    console.log(`Found ${afterEntitlements.length} entitlements after cleanup:`);
    afterEntitlements.forEach(entitlement => {
      console.log(`- ${entitlement.products?.name || 'Unknown'} (ID: ${entitlement.product_id})`);
    });
    
    const { data: afterPurchases, error: afterPurchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', TEST_USER_ID);
    
    if (afterPurchasesError) {
      console.error('Error fetching purchases after cleanup:', afterPurchasesError);
      return;
    }
    
    console.log(`Found ${afterPurchases.length} purchases after cleanup:`);
    afterPurchases.forEach(purchase => {
      console.log(`- Product ID: ${purchase.product_id}, Amount: ${purchase.amount}, Status: ${purchase.status}`);
    });
    
    // 6. Verify phantom data was removed
    console.log('\n6. Verifying phantom data was removed...');
    
    const phantomEntitlementRemoved = !afterEntitlements.some(e => 
      e.product_id === AD_GENERATOR_ID && e.source_id === phantomEntitlement?.source_id
    );
    console.log(`Phantom entitlement removed: ${phantomEntitlementRemoved ? 'Yes' : 'No'}`);
    
    const phantomPurchaseRemoved = !afterPurchases.some(p => p.product_id === 'phantom-product-id');
    console.log(`Phantom purchase removed: ${phantomPurchaseRemoved ? 'Yes' : 'No'}`);
    
    // 7. Verify only main product remains
    console.log('\n7. Verifying only main product remains...');
    
    const onlyMainProductRemains = afterEntitlements.every(e => e.product_id === MAIN_PRODUCT_ID);
    console.log(`Only main product remains: ${onlyMainProductRemains ? 'Yes' : 'No'}`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Unexpected error in test:', error);
  }
}

// Run the test
runTest(); 