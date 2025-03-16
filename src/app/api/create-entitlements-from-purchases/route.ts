import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';
import { PRODUCT_IDS } from '@/lib/product-ids';

/**
 * API route to create entitlements from purchases
 * This is called asynchronously when a user has purchases but no entitlements
 */
export async function POST(req: NextRequest) {
  console.log('API: Creating entitlements from purchases');
  
  // Get user ID from request headers or query params
  const userIdHeader = req.headers.get('x-user-id');
  const url = new URL(req.url);
  const queryUserId = url.searchParams.get('userId');
  const userId = userIdHeader || queryUserId;
  
  if (!userId) {
    console.error('API: No user ID provided');
    return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
  }
  
  console.log(`API: Creating entitlements for user: ${userId}`);
  
  try {
    // Use the service role client to bypass RLS
    const serviceClient = await createServiceClient();
    
    // Get the user's purchases
    const { data: purchases, error: purchasesError } = await serviceClient
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (purchasesError) {
      console.error('API: Error getting purchases:', purchasesError);
      return NextResponse.json({ error: 'Error getting purchases' }, { status: 500 });
    }
    
    if (!purchases || purchases.length === 0) {
      console.log(`API: No purchases found for user ${userId}`);
      return NextResponse.json({ message: 'No purchases found' }, { status: 200 });
    }
    
    console.log(`API: Found ${purchases.length} purchases for user ${userId}`);
    
    // Get existing entitlements to avoid duplicates
    const { data: existingEntitlements, error: entitlementsError } = await serviceClient
      .from('user_entitlements')
      .select('product_id')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (entitlementsError) {
      console.error('API: Error checking existing entitlements:', entitlementsError);
      return NextResponse.json({ error: 'Error checking existing entitlements' }, { status: 500 });
    }
    
    // Create a set of product IDs that the user already has entitlements for
    const existingProductIds = new Set(existingEntitlements?.map(e => e.product_id) || []);
    console.log(`API: User already has entitlements for ${existingProductIds.size} products:`, Array.from(existingProductIds));
    
    // Create entitlements for each purchase
    const createdEntitlements = [];
    const now = new Date().toISOString();
    
    for (const purchase of purchases) {
      console.log(`API: Processing purchase ${purchase.id}`);
      
      // Determine which products to create entitlements for
      let productIds = [];
      
      // If purchase has a product_id, use that
      if (purchase.product_id) {
        // Only add if the user doesn't already have an entitlement for this product
        if (!existingProductIds.has(purchase.product_id)) {
          productIds.push(purchase.product_id);
        } else {
          console.log(`API: User already has entitlement for product ${purchase.product_id}, skipping`);
        }
      } else {
        // Otherwise, use the main product ID
        const mainProductId = PRODUCT_IDS['pmu-profit-system'];
        if (!existingProductIds.has(mainProductId)) {
          productIds.push(mainProductId);
        } else {
          console.log(`API: User already has entitlement for main product, skipping`);
        }
        
        // Check metadata for add-ons - ONLY add if the value is explicitly true
        const metadata = purchase.metadata || {};
        
        // For Ad Generator, check if include_ad_generator is explicitly true
        if (metadata.include_ad_generator === true || metadata.includeAdGenerator === true || metadata.includeAdGenerator === 'true') {
          const adGeneratorId = PRODUCT_IDS['pmu-ad-generator'];
          if (!existingProductIds.has(adGeneratorId)) {
            productIds.push(adGeneratorId);
          } else {
            console.log(`API: User already has entitlement for Ad Generator, skipping`);
          }
        } else {
          console.log(`API: Purchase ${purchase.id} does not include Ad Generator (metadata: ${JSON.stringify(metadata)})`);
        }
        
        // For Blueprint, check if include_blueprint is explicitly true
        if (metadata.include_blueprint === true || metadata.includeBlueprint === true || metadata.includeBlueprint === 'true') {
          const blueprintId = PRODUCT_IDS['consultation-success-blueprint'];
          if (!existingProductIds.has(blueprintId)) {
            productIds.push(blueprintId);
          } else {
            console.log(`API: User already has entitlement for Blueprint, skipping`);
          }
        } else {
          console.log(`API: Purchase ${purchase.id} does not include Blueprint (metadata: ${JSON.stringify(metadata)})`);
        }
      }
      
      // Create entitlements for each product
      for (const productId of productIds) {
        console.log(`API: Creating entitlement for product ${productId}`);
        
        const { data: entitlement, error: entitlementError } = await serviceClient
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
          console.error(`API: Error creating entitlement for product ${productId}:`, entitlementError);
        } else {
          console.log(`API: Created entitlement ${entitlement.id} for product ${productId}`);
          createdEntitlements.push(entitlement);
          // Add to the set of existing product IDs to avoid duplicates in future iterations
          existingProductIds.add(productId);
        }
      }
      
      // Update the purchase to mark entitlements as created
      const { error: updateError } = await serviceClient
        .from('purchases')
        .update({
          entitlements_created: true,
          updated_at: now
        })
        .eq('id', purchase.id);
      
      if (updateError) {
        console.error(`API: Error updating purchase ${purchase.id}:`, updateError);
      }
    }
    
    console.log(`API: Created ${createdEntitlements.length} entitlements for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      entitlements: createdEntitlements,
      entitlementCount: createdEntitlements.length
    }, { status: 200 });
  } catch (error) {
    console.error('API: Error creating entitlements:', error);
    return NextResponse.json({ 
      error: 'Error creating entitlements',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 