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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract metadata
        const metadata = session.metadata || {};
        const email = metadata.email || session.customer_email;
        const fullName = metadata.fullName;
        const includeAdGenerator = metadata.includeAdGenerator === 'true';
        const includeBlueprint = metadata.includeBlueprint === 'true';
        const userId = metadata.userId;
        
        console.log(`Processing completed checkout for user: ${userId}, email: ${email}`);
        
        if (!userId || !email) {
          console.error('No userId or email found in session metadata');
          return NextResponse.json({ error: 'Missing user information in session' }, { status: 400 });
        }
        
        try {
          // Verify the user exists
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
          
          if (userError || !userData?.user) {
            console.error('Error verifying user:', userError);
            return NextResponse.json({ error: 'User verification failed' }, { status: 400 });
          }
          
          console.log(`Verified user: ${userId}`);
          
          // Ensure the user's email is confirmed
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
          );
          
          if (updateError) {
            console.error('Error confirming user email:', updateError);
            // Continue anyway, this is not critical
          } else {
            console.log('User email confirmed after successful payment');
          }
          
          // Determine which products were purchased
          const products = ['pmu-profit-system']; // Base product is always included
          if (includeAdGenerator) products.push('pmu-ad-generator');
          if (includeBlueprint) products.push('consultation-blueprint');
          
          // Create purchase records for each product
          for (const productId of products) {
            const amount = productId === 'pmu-profit-system' ? 3700 : 
                          productId === 'pmu-ad-generator' ? 2700 : 3300;
                          
            const { error: purchaseError } = await supabase
              .from('purchases')
              .insert({
                user_id: userId,
                product_id: productId,
                amount: amount,
                status: 'completed',
                updated_at: new Date().toISOString()
              });
              
            if (purchaseError) {
              console.error(`Error creating purchase record for ${productId}:`, purchaseError);
            } else {
              console.log(`Purchase record created successfully for ${productId}`);
            }
          }
          
          console.log('All purchase records created successfully');
        } catch (error) {
          console.error('Error processing checkout session:', error);
          return NextResponse.json({ error: 'Error processing checkout session' }, { status: 500 });
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
        console.log(`PaymentIntent for ${paymentIntent.amount} failed!`);
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return NextResponse.json({ error: 'Error processing webhook event' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
} 