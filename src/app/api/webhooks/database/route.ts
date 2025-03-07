import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { PRODUCT_IDS, legacyToUuidProductId, isValidLegacyProductId } from '@/lib/product-ids';

// Function to create entitlements from a purchase
async function createEntitlementsFromPurchase(purchase: any) {
  if (!purchase || !purchase.user_id) {
    console.error('Cannot create entitlements: Invalid purchase data');
    return { error: 'Invalid purchase data' };
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  const entitlements = [];
  const userId = purchase.user_id;

  try {
    // Check if this is a legacy purchase with product_id field
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
        console.error('Error creating entitlement from legacy purchase in database webhook:', entitlementError);
      } else {
        console.log('Created entitlement from legacy purchase in database webhook:', entitlement);
        entitlements.push(entitlement);
      }
    } else {
      // Standard purchase with include_* fields
      // Always create entitlement for the main product (PMU Profit System)
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
        console.log('Created main product entitlement from database webhook:', mainEntitlement);
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
          console.log('Created ad generator entitlement from database webhook:', adEntitlement);
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
          console.log('Created blueprint entitlement from database webhook:', blueprintEntitlement);
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
      console.error('Error updating purchase status in database webhook:', updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error('Error creating entitlements in database webhook:', error);
    return { error };
  }
}

// Handle POST requests from Supabase database webhooks
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    
    // Check if this is a purchase insert event
    if (body.type === 'INSERT' && body.table === 'purchases') {
      const purchase = body.record;
      
      // Check if the purchase already has entitlements
      if (purchase.entitlements_created) {
        return NextResponse.json({ message: 'Entitlements already created' });
      }
      
      // Check if the purchase has a user ID
      if (!purchase.user_id) {
        return NextResponse.json({ error: 'Purchase has no user ID' }, { status: 400 });
      }
      
      // Create entitlements for the purchase
      const result = await createEntitlementsFromPurchase(purchase);
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Entitlements created successfully', 
        entitlements: result.entitlements 
      });
    }
    
    // If not a purchase insert event, just acknowledge
    return NextResponse.json({ message: 'Event received but not processed' });
  } catch (error) {
    console.error('Error processing database webhook:', error);
    
    let errorMessage = 'Failed to process database webhook';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 