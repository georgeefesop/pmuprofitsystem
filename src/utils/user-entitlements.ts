import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';

// Initialize Supabase URL and keys for service role operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize admin Supabase client for server-side operations
const getServiceSupabase = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Fetches user entitlements with product details
 * @param userId The user's ID
 * @returns An array of entitlements with product details
 */
export async function getUserEntitlements(userId: string) {
  if (!userId) return { data: null, error: new Error('User ID is required') };

  const { data, error } = await supabase
    .from('user_entitlements')
    .select(`
      *,
      products:product_id(
        id,
        name,
        description,
        price,
        type
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  return { data, error };
}

/**
 * Fetches user purchases with product details
 * @param userId The user's ID
 * @returns An array of purchases with product details
 */
export async function getUserPurchases(userId: string) {
  if (!userId) return { data: null, error: new Error('User ID is required') };

  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      purchase_items(
        id,
        product_id,
        quantity,
        unit_amount,
        subtotal,
        products:product_id(
          id,
          name,
          description,
          type
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Checks if a user has access to a specific product
 * @param userId The user's ID
 * @param productId The product ID to check
 * @returns Boolean indicating if the user has access
 */
export async function hasProductAccess(userId: string, productId: string) {
  if (!userId || !productId) return false;

  const { data, error } = await supabase
    .from('user_entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

/**
 * Fetches all products available in the system
 * @returns An array of products
 */
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('price', { ascending: true });

  return { data, error };
}

/**
 * Creates a user entitlement
 * @param userId The user's ID
 * @param productId The product ID
 * @param sourceType The source type (purchase, subscription, manual)
 * @param sourceId The source ID (purchase_id or subscription_id)
 * @returns The created entitlement
 */
export async function createUserEntitlement(
  userId: string,
  productId: string,
  sourceType: 'purchase' | 'subscription' | 'manual',
  sourceId?: string
) {
  const { data, error } = await supabase
    .from('user_entitlements')
    .upsert({
      user_id: userId,
      product_id: productId,
      source_type: sourceType,
      source_id: sourceId,
      is_active: true,
      valid_from: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Deactivates a user entitlement
 * @param entitlementId The entitlement ID to deactivate
 * @returns The updated entitlement
 */
export async function deactivateUserEntitlement(entitlementId: string) {
  const { data, error } = await supabase
    .from('user_entitlements')
    .update({
      is_active: false,
      valid_until: new Date().toISOString(),
    })
    .eq('id', entitlementId)
    .select()
    .single();

  return { data, error };
}

/**
 * Creates entitlements for all completed purchases that don't have entitlements yet
 * This is useful for fixing missing entitlements or migrating data
 * @param userId Optional user ID to limit to a specific user
 * @returns Object with counts of created entitlements and any errors
 */
export async function createMissingEntitlements(userId?: string) {
  const adminSupabase = getServiceSupabase();
  
  // Get all completed purchases
  const purchasesQuery = adminSupabase
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
  
  let created = 0;
  let errors = 0;
  
  // Process each purchase
  for (const purchase of purchases) {
    // Skip purchases without items
    if (!purchase.purchase_items || purchase.purchase_items.length === 0) {
      continue;
    }
    
    // Process each purchase item
    for (const item of purchase.purchase_items) {
      // Check if entitlement already exists
      const { data: existingEntitlement } = await adminSupabase
        .from('user_entitlements')
        .select('id')
        .eq('user_id', purchase.user_id)
        .eq('product_id', item.product_id)
        .eq('source_type', 'purchase')
        .eq('source_id', purchase.id)
        .maybeSingle();
      
      // Skip if entitlement already exists
      if (existingEntitlement) {
        continue;
      }
      
      // Create entitlement
      const { error: entitlementError } = await adminSupabase
        .from('user_entitlements')
        .insert({
          user_id: purchase.user_id,
          product_id: item.product_id,
          source_type: 'purchase',
          source_id: purchase.id,
          is_active: true,
          valid_from: new Date().toISOString(),
        });
      
      if (entitlementError) {
        console.error(`Error creating entitlement for purchase ${purchase.id}, product ${item.product_id}:`, entitlementError);
        errors++;
      } else {
        created++;
      }
    }
  }
  
  return { created, errors, message: `Created ${created} entitlements with ${errors} errors` };
} 