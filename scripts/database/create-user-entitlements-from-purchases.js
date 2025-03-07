// Script to create user entitlements from existing purchases
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map of product IDs
const PRODUCT_IDS = {
  'pmu-profit-system': '4a554622-d759-42b7-b830-79c9136d2f96',
  'pmu-ad-generator': '4ba5c775-a8e4-449e-828f-19f938e3710b',
  'consultation-success-blueprint': 'e5749058-500d-4333-8938-c8a19b16cd65'
};

// Function to create user entitlements from purchases
async function createEntitlementsFromPurchases(userId) {
  console.log(`Creating entitlements for user: ${userId}`);
  
  try {
    // Get all completed purchases for the user
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return;
    }
    
    console.log(`Found ${purchases.length} purchases for user ${userId}`);
    
    // Group purchases by product_id to avoid duplicates
    const productGroups = {};
    purchases.forEach(purchase => {
      if (!productGroups[purchase.product_id]) {
        productGroups[purchase.product_id] = purchase;
      }
    });
    
    // Create entitlements for each unique product
    const now = new Date().toISOString();
    const entitlements = [];
    
    for (const [productKey, purchase] of Object.entries(productGroups)) {
      // Map the product_id from purchases to the UUID format in user_entitlements
      let productId;
      if (productKey === 'pmu-profit-system') {
        productId = PRODUCT_IDS['pmu-profit-system'];
      } else if (productKey === 'pmu-ad-generator') {
        productId = PRODUCT_IDS['pmu-ad-generator'];
      } else if (productKey === 'consultation-success-blueprint') {
        productId = PRODUCT_IDS['consultation-success-blueprint'];
      } else {
        console.warn(`Unknown product key: ${productKey}, skipping`);
        continue;
      }
      
      // Check if entitlement already exists
      const { data: existingEntitlement, error: checkError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (checkError) {
        console.error(`Error checking existing entitlement for ${productKey}:`, checkError);
        continue;
      }
      
      if (existingEntitlement) {
        console.log(`Entitlement for ${productKey} already exists, skipping`);
        continue;
      }
      
      // Create the entitlement
      const { data: entitlement, error: createError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: productId,
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error(`Error creating entitlement for ${productKey}:`, createError);
      } else {
        console.log(`Created entitlement for ${productKey}:`, entitlement.id);
        entitlements.push(entitlement);
      }
    }
    
    console.log(`Created ${entitlements.length} entitlements for user ${userId}`);
    return entitlements;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Main function
async function main() {
  try {
    // Get the user ID from command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('Please provide a user ID as an argument');
      process.exit(1);
    }
    
    console.log('Starting user entitlements creation process...');
    
    // Create entitlements for the user
    const entitlements = await createEntitlementsFromPurchases(userId);
    
    // Verify the created entitlements
    const { data: verifyEntitlements, error: verifyError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (verifyError) {
      console.error('Error verifying entitlements:', verifyError);
    } else {
      console.log(`Verified ${verifyEntitlements.length} active entitlements for user ${userId}`);
      console.table(verifyEntitlements.map(e => ({
        id: e.id,
        user_id: e.user_id,
        product_id: e.product_id,
        is_active: e.is_active
      })));
    }
    
    console.log('User entitlements creation process completed successfully');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    process.exit(0);
  }
}

// Run the main function
main(); 