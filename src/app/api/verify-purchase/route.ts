import { NextRequest, NextResponse } from 'next/server';
import { stripe, safeStripeOperation } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { PRODUCT_IDS, legacyToUuidProductId, isValidLegacyProductId } from '@/lib/product-ids';

// Force this route to be dynamic since it uses request.url
export const dynamic = 'force-dynamic';

// Function to create user entitlements based on purchase
async function createUserEntitlements(userId: string, includeAdGenerator: boolean, includeBlueprint: boolean, purchaseId: string) {
  if (!userId) {
    console.error('Cannot create entitlements: No user ID provided');
    return { error: 'No user ID provided' };
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  const entitlements = [];

  try {
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

export async function GET(req: NextRequest) {
  try {
    // Get the session ID from the query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Verifying purchase for session/payment:', sessionId);
    
    // Determine if this is a checkout session ID or payment intent ID
    const isPaymentIntent = sessionId.startsWith('pi_');
    
    // Get the Stripe session or payment intent
    let session;
    let paymentIntent;
    
    if (isPaymentIntent) {
      // Retrieve the payment intent
      paymentIntent = await safeStripeOperation(() => 
        stripe.paymentIntents.retrieve(sessionId, {
          expand: ['customer', 'invoice']
        })
      );
      
      if (!paymentIntent) {
        return NextResponse.json(
          { error: 'Payment intent not found' },
          { status: 404 }
        );
      }
      
      // Check if the payment was successful
      const paymentStatus = paymentIntent.status;
      const isPaymentSuccessful = paymentStatus === 'succeeded';
      
      // Extract user ID from metadata
      const metadata = paymentIntent.metadata || {};
      const userId = metadata.userId || '';
      
      console.log('Payment intent metadata:', metadata);
      console.log('Extracted user ID from payment intent:', userId);
      
      // Return the verification result for payment intent with redirect URL
      return NextResponse.json({
        success: true,
        verified: isPaymentSuccessful,
        paymentStatus,
        userId,
        includeAdGenerator: metadata.includeAdGenerator === 'true',
        includeBlueprint: metadata.includeBlueprint === 'true',
        redirectUrl: `/dashboard?purchase_success=true&session_id=${sessionId}`,
        sessionDetails: {
          id: paymentIntent.id,
          customer_email: paymentIntent.receipt_email || '',
          amount_total: paymentIntent.amount ? paymentIntent.amount / 100 : null,
          currency: paymentIntent.currency,
          payment_status: paymentStatus,
          status: paymentStatus,
        }
      });
    } else {
      // Retrieve the checkout session
      session = await safeStripeOperation(() => 
        stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent', 'line_items']
        })
      );
      
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      
      // Check if the payment was successful
      const paymentStatus = session.payment_status;
      const isPaymentSuccessful = paymentStatus === 'paid';
      
      // Get the Supabase client
      const supabase = getServiceSupabase();
      
      // Check if we have a record of this purchase in our database
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('checkout_session_id', sessionId)
        .single();
      
      // Check if we have a pending purchase record
      const { data: pendingPurchase, error: pendingError } = await supabase
        .from('pending_purchases')
        .select('*')
        .eq('checkout_session_id', sessionId)
        .single();
      
      // If we don't have a purchase record but the payment was successful,
      // create one from the pending purchase or from the session metadata
      let newPurchase = null;
      let userId = null;
      let includeAdGenerator = false;
      let includeBlueprint = false;
      
      if (!purchaseData && isPaymentSuccessful) {
        const metadata = session.metadata || {};
        const email = metadata.email || (pendingPurchase?.email || '');
        const fullName = metadata.fullName || (pendingPurchase?.full_name || '');
        userId = metadata.userId || (pendingPurchase?.user_id || null);
        includeAdGenerator = metadata.includeAdGenerator === 'true' || pendingPurchase?.include_ad_generator || false;
        includeBlueprint = metadata.includeBlueprint === 'true' || pendingPurchase?.include_blueprint || false;
        
        if (email) {
          // Create a purchase record
          const { data: createdPurchase, error: createError } = await supabase
            .from('purchases')
            .insert({
              email,
              full_name: fullName,
              include_ad_generator: includeAdGenerator,
              include_blueprint: includeBlueprint,
              user_id: userId,
              checkout_session_id: sessionId,
              payment_status: paymentStatus,
              payment_intent: session.payment_intent as string,
              amount_total: session.amount_total ? session.amount_total / 100 : null,
              created_at: new Date().toISOString(),
              status: 'completed'
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating purchase record:', createError);
          } else {
            console.log('Created purchase record:', createdPurchase);
            newPurchase = createdPurchase;
            
            // Create user entitlements based on the purchase
            if (userId) {
              const entitlementResult = await createUserEntitlements(
                userId, 
                includeAdGenerator, 
                includeBlueprint,
                createdPurchase.id
              );
              
              if (entitlementResult.error) {
                console.error('Error creating entitlements:', entitlementResult.error);
              } else {
                console.log('Created entitlements:', entitlementResult.entitlements);
                
                // Update purchase status to indicate entitlements were created
                const { error: updateError } = await supabase
                  .from('purchases')
                  .update({ status: 'completed', entitlements_created: true })
                  .eq('id', createdPurchase.id);
                
                if (updateError) {
                  console.error('Error updating purchase status:', updateError);
                }
              }
            }
          }
        }
      } else if (purchaseData && isPaymentSuccessful) {
        // If we already have a purchase record but no entitlements, create them
        userId = purchaseData.user_id;
        includeAdGenerator = purchaseData.include_ad_generator;
        includeBlueprint = purchaseData.include_blueprint;
        
        const { data: existingEntitlements, error: entitlementsError } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', purchaseData.user_id)
          .eq('is_active', true);
        
        if (entitlementsError) {
          console.error('Error checking existing entitlements:', entitlementsError);
        } else if (!existingEntitlements || existingEntitlements.length === 0) {
          // No entitlements found, create them
          // Check if this is a legacy purchase with product_id
          if (purchaseData.product_id) {
            const entitlementResult = await createEntitlementsFromLegacyPurchase(purchaseData);
            
            if (entitlementResult.error) {
              console.error('Error creating entitlements from legacy purchase:', entitlementResult.error);
            } else {
              console.log('Created entitlements from legacy purchase:', entitlementResult.entitlements);
            }
          } else {
            // Standard purchase with include_* fields
            const entitlementResult = await createUserEntitlements(
              purchaseData.user_id, 
              purchaseData.include_ad_generator, 
              purchaseData.include_blueprint,
              purchaseData.id
            );
            
            if (entitlementResult.error) {
              console.error('Error creating entitlements from existing purchase:', entitlementResult.error);
            } else {
              console.log('Created entitlements from existing purchase:', entitlementResult.entitlements);
              
              // Update purchase status to indicate entitlements were created
              const { error: updateError } = await supabase
                .from('purchases')
                .update({ status: 'completed', entitlements_created: true })
                .eq('id', purchaseData.id);
              
              if (updateError) {
                console.error('Error updating purchase status:', updateError);
              }
            }
          }
        } else {
          console.log('User already has entitlements:', existingEntitlements.length);
          
          // Update purchase status to indicate entitlements were already created
          if (!purchaseData.entitlements_created) {
            const { error: updateError } = await supabase
              .from('purchases')
              .update({ status: 'completed', entitlements_created: true })
              .eq('id', purchaseData.id);
            
            if (updateError) {
              console.error('Error updating purchase status:', updateError);
            }
          }
        }
      }
      
      // Return the verification result for checkout session with redirect URL
      return NextResponse.json({
        success: true,
        verified: isPaymentSuccessful,
        paymentStatus,
        purchaseExists: !!purchaseData,
        pendingPurchaseExists: !!pendingPurchase,
        newPurchaseCreated: !!newPurchase,
        redirectUrl: `/dashboard?purchase_success=true&session_id=${sessionId}`,
        userId,
        includeAdGenerator,
        includeBlueprint,
        sessionDetails: {
          id: session.id,
          customer_email: session.customer_email,
          amount_total: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency,
          payment_status: session.payment_status,
          status: session.status,
        }
      });
    }
  } catch (error) {
    console.error('Error verifying purchase:', error);
    
    let errorMessage = 'Failed to verify purchase';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 