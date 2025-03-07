/**
 * Script to fix entitlements for users with purchases but no entitlements
 * 
 * This script finds all users who have purchases but no entitlements,
 * and creates the appropriate entitlements for them.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Hardcoded product IDs (same as in src/lib/product-ids.ts)
const PRODUCT_IDS = {
  'pmu-profit-system': '4a554622-d759-42b7-b830-79c9136d2f96',
  'pmu-ad-generator': '4ba5c775-a8e4-449e-828f-19f938e3710b',
  'consultation-success-blueprint': 'e5749058-500d-4333-8938-c8a19b16cd65',
};

// Legacy product ID mapping
const LEGACY_PRODUCT_IDS = {
  'pmu-profit-system': 'pmu-profit-system',
  'pmu-ad-generator': 'pmu-ad-generator',
  'consultation-success-blueprint': 'consultation-success-blueprint',
};

// Reverse mapping from UUID to legacy ID
const UUID_TO_LEGACY_PRODUCT_IDS = Object.entries(PRODUCT_IDS).reduce(
  (acc, [legacyId, uuidId]) => {
    acc[uuidId] = legacyId;
    return acc;
  },
  {}
);

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper functions for product ID handling
function isValidUuidProductId(id) {
  return Object.values(PRODUCT_IDS).includes(id);
}

function isValidLegacyProductId(id) {
  return id in LEGACY_PRODUCT_IDS;
}

function normalizeProductId(productId) {
  // If it's already a UUID product ID, return it
  if (isValidUuidProductId(productId)) {
    return productId;
  }
  
  // If it's a legacy product ID, convert it to UUID
  if (isValidLegacyProductId(productId)) {
    return PRODUCT_IDS[productId];
  }
  
  // If we can't recognize it, return the original ID
  console.warn(`Unrecognized product ID format: ${productId}`);
  return productId;
}

// Function to create entitlements from a purchase
async function createEntitlementsFromPurchase(purchase) {
  if (!purchase || !purchase.user_id) {
    console.error('Cannot create entitlements: Invalid purchase data');
    return { error: 'Invalid purchase data' };
  }

  const now = new Date().toISOString();
  const entitlements = [];
  const userId = purchase.user_id;

  try {
    // Check if this is a legacy purchase with product_id field
    if (purchase.product_id) {
      // Normalize the product ID to ensure it's in UUID format
      const productId = normalizeProductId(purchase.product_id);

      // Create the entitlement
      const { data: entitlement, error: entitlementError } = await supabase
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

      if (entitlementError) {
        console.error(`Error creating entitlement from legacy purchase for user ${userId}:`, entitlementError);
      } else {
        console.log(`Created entitlement from legacy purchase for user ${userId}: ${entitlement.id}`);
        entitlements.push(entitlement);
      }
    } else {
      // For purchases without a product_id, create entitlements based on metadata or defaults
      
      // Always create the main product entitlement
      const mainProductId = normalizeProductId('pmu-profit-system');
      const { data: mainEntitlement, error: mainError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: mainProductId,
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();
        
      if (mainError) {
        console.error(`Error creating main product entitlement for user ${userId}:`, mainError);
      } else {
        console.log(`Created main product entitlement for user ${userId}: ${mainEntitlement.id}`);
        entitlements.push(mainEntitlement);
      }

      // Create entitlement for Ad Generator if included
      if (purchase.include_ad_generator) {
        const { data: adEntitlement, error: adError } = await supabase
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: PRODUCT_IDS['pmu-ad-generator'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (adError) {
          console.error(`Error creating ad generator entitlement for user ${userId}:`, adError);
        } else {
          console.log(`Created ad generator entitlement for user ${userId}:`, adEntitlement.id);
          entitlements.push(adEntitlement);
        }
      }

      // Create entitlement for Blueprint if included
      if (purchase.include_blueprint) {
        const { data: blueprintEntitlement, error: blueprintError } = await supabase
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: PRODUCT_IDS['consultation-success-blueprint'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (blueprintError) {
          console.error(`Error creating blueprint entitlement for user ${userId}:`, blueprintError);
        } else {
          console.log(`Created blueprint entitlement for user ${userId}:`, blueprintEntitlement.id);
          entitlements.push(blueprintEntitlement);
        }
      }
    }

    // Update purchase status to indicate entitlements were created
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'completed', entitlements_created: true })
      .eq('id', purchase.id);
    
    if (updateError) {
      console.error(`Error updating purchase status for user ${userId}:`, updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error(`Error creating entitlements for user ${userId}:`, error);
    return { error };
  }
}

// Function to fix entitlements for a specific user
async function fixUserEntitlements(userId) {
  console.log(`Fixing entitlements for user ${userId}...`);
  
  try {
    // Get all purchases for the user
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (purchasesError) {
      console.error(`Error getting purchases for user ${userId}:`, purchasesError);
      return { error: purchasesError };
    }
    
    if (!purchases || purchases.length === 0) {
      console.log(`No purchases found for user ${userId}`);
      return { message: 'No purchases found' };
    }
    
    console.log(`Found ${purchases.length} purchases for user ${userId}`);
    
    // Check if the user already has entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (entitlementsError) {
      console.error(`Error checking entitlements for user ${userId}:`, entitlementsError);
    }
    
    if (entitlements && entitlements.length > 0) {
      console.log(`User ${userId} already has ${entitlements.length} entitlements`);
      return { message: 'User already has entitlements', entitlements };
    }
    
    // Create entitlements for each purchase
    const results = [];
    for (const purchase of purchases) {
      console.log(`Creating entitlements for purchase ${purchase.id}...`);
      const result = await createEntitlementsFromPurchase(purchase);
      results.push(result);
    }
    
    return { results };
  } catch (error) {
    console.error(`Error fixing entitlements for user ${userId}:`, error);
    return { error };
  }
}

// Function to fix entitlements for all users
async function fixAllUserEntitlements() {
  console.log('Fixing entitlements for all users with purchases but no entitlements...');
  
  try {
    // Get all users with purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('user_id')
      .eq('status', 'completed')
      .is('entitlements_created', null);
    
    if (purchasesError) {
      console.error('Error getting purchases:', purchasesError);
      return { error: purchasesError };
    }
    
    if (!purchases || purchases.length === 0) {
      console.log('No purchases found that need entitlements');
      return { message: 'No purchases found that need entitlements' };
    }
    
    // Get unique user IDs
    const userIds = [...new Set(purchases.map(p => p.user_id))];
    console.log(`Found ${userIds.length} users with purchases that need entitlements`);
    
    // Fix entitlements for each user
    const results = [];
    for (const userId of userIds) {
      console.log(`Fixing entitlements for user ${userId}...`);
      const result = await fixUserEntitlements(userId);
      results.push({ userId, result });
    }
    
    return { results };
  } catch (error) {
    console.error('Error fixing entitlements for all users:', error);
    return { error };
  }
}

// Main function
async function main() {
  const userId = process.argv[2];
  
  if (userId) {
    console.log(`Fixing entitlements for user ${userId}...`);
    await fixUserEntitlements(userId);
  } else {
    console.log('Fixing entitlements for all users with purchases but no entitlements...');
    await fixAllUserEntitlements();
  }
  
  console.log('Done!');
  process.exit(0);
}

// Run the script
main(); 