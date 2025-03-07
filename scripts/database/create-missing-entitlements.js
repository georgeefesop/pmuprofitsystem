require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Creates entitlements for all completed purchases that don't have entitlements yet
 * @param {string} [userId] - Optional user ID to limit to a specific user
 */
async function createMissingEntitlements(userId) {
  console.log('Starting entitlement creation process...');
  
  // Get all completed purchases
  const purchasesQuery = supabase
    .from('purchases')
    .select(`
      id,
      user_id,
      status,
      purchase_items(
        id,
        product_id
      )
    `)
    .eq('status', 'completed');
  
  // If userId is provided, filter by that user
  if (userId) {
    purchasesQuery.eq('user_id', userId);
    console.log(`Filtering for user ID: ${userId}`);
  }
  
  const { data: purchases, error: purchasesError } = await purchasesQuery;
  
  if (purchasesError || !purchases) {
    console.error('Error fetching purchases:', purchasesError);
    return { 
      created: 0, 
      errors: 1, 
      message: `Error fetching purchases: ${purchasesError?.message || 'Unknown error'}` 
    };
  }
  
  console.log(`Found ${purchases.length} completed purchases`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process each purchase
  for (const purchase of purchases) {
    console.log(`Processing purchase ${purchase.id} for user ${purchase.user_id}`);
    
    // Skip purchases without items
    if (!purchase.purchase_items || purchase.purchase_items.length === 0) {
      console.log(`  Skipping purchase ${purchase.id} - no items found`);
      continue;
    }
    
    // Process each purchase item
    for (const item of purchase.purchase_items) {
      console.log(`  Processing item with product ID ${item.product_id}`);
      
      // Check if entitlement already exists
      const { data: existingEntitlement } = await supabase
        .from('user_entitlements')
        .select('id')
        .eq('user_id', purchase.user_id)
        .eq('product_id', item.product_id)
        .eq('source_type', 'purchase')
        .eq('source_id', purchase.id)
        .maybeSingle();
      
      // Skip if entitlement already exists
      if (existingEntitlement) {
        console.log(`  Entitlement already exists for product ${item.product_id}`);
        skipped++;
        continue;
      }
      
      // Create entitlement
      const { data: newEntitlement, error: entitlementError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: purchase.user_id,
          product_id: item.product_id,
          source_type: 'purchase',
          source_id: purchase.id,
          is_active: true,
          valid_from: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (entitlementError) {
        console.error(`  Error creating entitlement for purchase ${purchase.id}, product ${item.product_id}:`, entitlementError);
        errors++;
      } else {
        console.log(`  Created entitlement ${newEntitlement.id} for product ${item.product_id}`);
        created++;
      }
    }
  }
  
  console.log('\nSummary:');
  console.log(`- Created: ${created} entitlements`);
  console.log(`- Skipped: ${skipped} (already existed)`);
  console.log(`- Errors: ${errors}`);
  
  return { created, skipped, errors };
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    // Check if a user ID was provided as a command-line argument
    const userId = process.argv[2];
    
    // Create missing entitlements
    await createMissingEntitlements(userId);
    
    console.log('Process completed successfully');
  } catch (error) {
    console.error('Error running script:', error);
  }
}

// Run the script
main(); 