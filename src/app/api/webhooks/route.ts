import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15' as any,
});

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    if (!endpointSecret) {
      console.warn('Webhook secret not configured. Skipping signature verification.');
      event = JSON.parse(payload) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Get Supabase client
  const supabase = getServiceSupabase();

  // Handle the event
  console.log(`Webhook event type: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract metadata
      const metadata = session.metadata || {};
      const email = metadata.email;
      const fullName = metadata.fullName;
      const includeAdGenerator = metadata.includeAdGenerator === 'true';
      const includeBlueprint = metadata.includeBlueprint === 'true';
      const userId = metadata.userId;
      const requiresVerification = metadata.requiresVerification === 'true';
      
      console.log(`Processing completed checkout for: ${email}`);
      
      try {
        // Find the pending purchase
        const { data: pendingPurchase, error: findError } = await supabase
          .from('pending_purchases')
          .select('*')
          .eq('checkout_session_id', session.id)
          .single();
          
        if (findError) {
          console.error('Error finding pending purchase:', findError);
        }
        
        // Create a completed purchase record
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            email,
            full_name: fullName,
            include_ad_generator: includeAdGenerator,
            include_blueprint: includeBlueprint,
            user_id: userId || null,
            checkout_session_id: session.id,
            payment_status: 'completed',
            payment_intent: session.payment_intent as string,
            amount_total: session.amount_total ? session.amount_total / 100 : null,
            created_at: new Date().toISOString(),
          });
          
        if (purchaseError) {
          console.error('Error creating purchase record:', purchaseError);
        } else {
          console.log('Purchase record created successfully');
          
          // Delete the pending purchase if it exists
          if (pendingPurchase) {
            const { error: deleteError } = await supabase
              .from('pending_purchases')
              .delete()
              .eq('id', pendingPurchase.id);
              
            if (deleteError) {
              console.error('Error deleting pending purchase:', deleteError);
            }
          }
          
          // If the user is new and requires verification, we don't need to do anything else
          // They will verify their email and then be able to access their purchase
          
          // If the user already exists, we can update their account to reflect the purchase
          if (userId && !requiresVerification) {
            // Update user metadata to reflect purchase
            const { error: updateError } = await supabase
              .from('user_profiles')
              .upsert({
                user_id: userId,
                has_purchased: true,
                include_ad_generator: includeAdGenerator,
                include_blueprint: includeBlueprint,
                updated_at: new Date().toISOString(),
              });
              
            if (updateError) {
              console.error('Error updating user profile:', updateError);
            }
          }
        }
      } catch (error) {
        console.error('Error processing checkout completion:', error);
      }
      
      break;
    }
    
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      break;
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed: ${paymentIntent.last_payment_error?.message}`);
      break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 