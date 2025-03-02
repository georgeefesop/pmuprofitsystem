import { NextRequest, NextResponse } from 'next/server';
import { stripe, safeStripeOperation } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';

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
      
      // Return the verification result for payment intent
      return NextResponse.json({
        success: true,
        verified: isPaymentSuccessful,
        paymentStatus,
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
      if (!purchaseData && isPaymentSuccessful) {
        const metadata = session.metadata || {};
        const email = metadata.email || (pendingPurchase?.email || '');
        const fullName = metadata.fullName || (pendingPurchase?.full_name || '');
        const userId = metadata.userId || (pendingPurchase?.user_id || null);
        
        if (email) {
          // Create a purchase record
          const { data: newPurchase, error: createError } = await supabase
            .from('purchases')
            .insert({
              email,
              full_name: fullName,
              include_ad_generator: metadata.includeAdGenerator === 'true' || pendingPurchase?.include_ad_generator || false,
              include_blueprint: metadata.includeBlueprint === 'true' || pendingPurchase?.include_blueprint || false,
              user_id: userId,
              checkout_session_id: sessionId,
              payment_status: paymentStatus,
              payment_intent: session.payment_intent as string,
              amount_total: session.amount_total ? session.amount_total / 100 : null,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating purchase record:', createError);
          } else {
            console.log('Created purchase record:', newPurchase);
          }
        }
      }
      
      // Return the verification result for checkout session
      return NextResponse.json({
        success: true,
        verified: isPaymentSuccessful,
        paymentStatus,
        purchaseExists: !!purchaseData,
        pendingPurchaseExists: !!pendingPurchase,
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