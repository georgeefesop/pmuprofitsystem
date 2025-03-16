import { NextRequest, NextResponse } from 'next/server';
import { stripe, safeStripeOperation } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { PRODUCT_IDS, legacyToUuidProductId, isValidLegacyProductId, uuidToLegacyProductId, normalizeProductId } from '@/lib/product-ids';
import { findPurchaseByPaymentIntent } from "@/lib/purchases";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Function to create user entitlements based on purchase
async function createUserEntitlements(userId: string, includeAdGenerator: boolean, includeBlueprint: boolean, purchaseId: string, specificProductId?: string) {
  if (!userId) {
    console.error('Cannot create entitlements: No user ID provided');
    return { error: 'No user ID provided' };
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  const entitlements = [];

  try {
    // If a specific product ID is provided, only create an entitlement for that product
    if (specificProductId) {
      console.log(`Creating entitlement for specific product: ${specificProductId}`);
      const normalizedProductId = normalizeProductId(specificProductId);
      
      const { data: specificEntitlement, error: specificError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: normalizedProductId,
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (specificError) {
        console.error('Error creating specific product entitlement:', specificError);
      } else {
        console.log('Created specific product entitlement:', specificEntitlement);
        entitlements.push(specificEntitlement);
      }
      
      // Update the purchase record to mark entitlements as created
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ entitlements_created: true })
        .eq('id', purchaseId);
        
      if (updateError) {
        console.error('Error updating purchase record:', updateError);
      }
      
      return { entitlements };
    }

    // Otherwise, create entitlements based on the includeAdGenerator and includeBlueprint flags
    // Always create entitlement for the main product (PMU Profit System)
    const { data: mainEntitlement, error: mainError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: userId,
        product_id: PRODUCT_IDS['pmu-profit-system'],
        source_type: 'purchase',
        source_id: purchaseId,
        valid_from: now,
        is_active: true
      })
      .select()
      .single();

    if (mainError) {
      console.error('Error creating main product entitlement:', mainError);
    } else {
      console.log('Created main product entitlement:', mainEntitlement);
      entitlements.push(mainEntitlement);
    }

    // Create entitlement for Ad Generator if included
    if (includeAdGenerator) {
      const { data: adEntitlement, error: adError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['pmu-ad-generator'],
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (adError) {
        console.error('Error creating ad generator entitlement:', adError);
      } else {
        console.log('Created ad generator entitlement:', adEntitlement);
        entitlements.push(adEntitlement);
      }
    }

    // Create entitlement for Blueprint if included
    if (includeBlueprint) {
      const { data: blueprintEntitlement, error: blueprintError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['consultation-success-blueprint'],
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (blueprintError) {
        console.error('Error creating blueprint entitlement:', blueprintError);
      } else {
        console.log('Created blueprint entitlement:', blueprintEntitlement);
        entitlements.push(blueprintEntitlement);
      }
    }
    
    // Update the purchase record to mark entitlements as created
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ entitlements_created: true })
      .eq('id', purchaseId);
      
    if (updateError) {
      console.error('Error updating purchase record:', updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error('Error creating entitlements:', error);
    return { error };
  }
}

// Function to create entitlements from legacy purchases
async function createEntitlementsFromLegacyPurchase(purchase: any) {
  if (!purchase || !purchase.user_id) {
    console.error('Cannot create entitlements: Invalid purchase data');
    return { error: 'Invalid purchase data' };
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  const entitlements = [];
  const userId = purchase.user_id;

  try {
    // Check if the purchase has a product_id field (legacy format)
    if (purchase.product_id) {
      // Convert legacy product ID to UUID if needed
      let productId = purchase.product_id;
      
      // If it's a legacy string ID, convert to UUID
      if (isValidLegacyProductId(productId)) {
        const uuidProductId = legacyToUuidProductId(productId);
        if (uuidProductId) {
          productId = uuidProductId;
        } else {
          console.error(`Could not convert legacy product ID: ${productId}`);
          return { error: `Invalid product ID: ${productId}` };
        }
      }

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
        console.error('Error creating entitlement from legacy purchase:', entitlementError);
      } else {
        console.log('Created entitlement from legacy purchase:', entitlement);
        entitlements.push(entitlement);
      }
    } else {
      // If no product_id, use the include_* fields
      // Create entitlement for the main product (PMU Profit System)
      const { data: mainEntitlement, error: mainError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['pmu-profit-system'],
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (mainError) {
        console.error('Error creating main product entitlement:', mainError);
      } else {
        console.log('Created main product entitlement from legacy purchase:', mainEntitlement);
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
          console.error('Error creating ad generator entitlement:', adError);
        } else {
          console.log('Created ad generator entitlement from legacy purchase:', adEntitlement);
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
          console.error('Error creating blueprint entitlement:', blueprintError);
        } else {
          console.log('Created blueprint entitlement from legacy purchase:', blueprintEntitlement);
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
      console.error('Error updating purchase status:', updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error('Error creating entitlements from legacy purchase:', error);
    return { error };
  }
}

/**
 * API route to verify a purchase by payment intent ID
 * @param req The request object
 * @returns A JSON response with the result of the verification
 */
export async function GET(req: NextRequest) {
  try {
    // Get the product and payment intent ID from the query parameters
    const url = new URL(req.url);
    const product = url.searchParams.get('product');
    const paymentIntentId = url.searchParams.get('payment_intent_id');
    const purchaseId = url.searchParams.get('purchase_id');
    
    console.log(`API: Verifying purchase for product ${product}, payment intent ${paymentIntentId}, purchase ID ${purchaseId}`);
    
    // Validate the required parameters
    if (!paymentIntentId && !purchaseId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either payment intent ID or purchase ID is required' 
      }, { status: 400 });
    }
    
    let result;
    
    // If we have a purchase ID, use that to find the purchase
    if (purchaseId) {
      const supabase = getServiceSupabase();
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();
        
      if (error) {
        console.error('Error finding purchase by ID:', error);
        return NextResponse.json({
          success: false,
          error: `Error finding purchase: ${error.message}`
        }, { status: 500 });
      }
      
      if (!purchase) {
        return NextResponse.json({
          success: false,
          verified: false,
          error: `No purchase found with ID: ${purchaseId}`
        }, { status: 404 });
      }
      
      result = {
        success: true,
        exists: true,
        purchase
      };
    } else {
      // Otherwise, find the purchase by payment intent ID
      result = await findPurchaseByPaymentIntent(paymentIntentId!);
    }
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message 
      }, { status: 500 });
    }

    // If no purchase was found, return a 404 response
    if (!result.exists) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: purchaseId 
          ? `No purchase found with ID: ${purchaseId}` 
          : `No purchase found for payment intent: ${paymentIntentId}`
      }, { status: 404 });
    }
        
        // Determine the redirect URL based on the product
        let redirectUrl = '/dashboard';
        
    if (product) {
      // Normalize the product ID to ensure consistent format
      const normalizedProductId = normalizeProductId(product);
      
      // Check if the purchase is for the requested product
      const purchaseProductId = result.purchase.product_id;
      const requestedProductUuid = PRODUCT_IDS[product as keyof typeof PRODUCT_IDS];
      
      const isMatchingProduct = 
        purchaseProductId === product || 
        purchaseProductId === requestedProductUuid ||
        normalizeProductId(purchaseProductId) === normalizedProductId;
      
      if (!isMatchingProduct) {
        console.log(`API: Purchase product ID ${purchaseProductId} does not match requested product ${product}`);
        // Still return success but with a warning
      }
      
      // Set the redirect URL based on the product
      if (product === 'consultation-success-blueprint') {
        redirectUrl = '/dashboard/blueprint';
      } else if (product === 'pricing-template') {
        redirectUrl = '/dashboard/pricing-template';
      } else if (product === 'pmu-ad-generator') {
        redirectUrl = '/dashboard/ad-generator';
          }
        }
        
        return NextResponse.json({
          success: true,
          verified: true,
      purchase: result.purchase,
      paymentIntentId,
      redirectUrl
    });
  } catch (error) {
    console.error('API: Error verifying purchase:', error);
    return NextResponse.json({
        success: false, 
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error verifying purchase' 
    }, { status: 500 });
  }
}

// Helper function to get the display name for a product
function getProductDisplayName(productId: string): string {
  switch (productId) {
    case 'pmu-profit-system':
      return 'PMU Profit System';
    case 'consultation-success-blueprint':
      return 'Consultation Success Blueprint';
    case 'pricing-template':
      return 'Pricing Template';
    case 'pmu-ad-generator':
      return 'PMU Ad Generator';
    default:
      return productId;
  }
} 