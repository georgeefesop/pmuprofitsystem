import { NextResponse } from 'next/server';
import { stripe, safeStripeOperation } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { getServiceSupabase } from '@/lib/supabase';
import { PRODUCT_IDS } from '@/lib/product-ids';

// Helper function to extract a name from email
function extractNameFromEmail(email: string): string {
  if (!email) return 'Customer';
  
  // Extract the part before @ and replace dots/underscores with spaces
  const namePart = email.split('@')[0];
  
  // Convert to title case (capitalize first letter of each word)
  return namePart
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function POST(request: Request) {
  try {
    console.log('Creating payment intent...');
    
    // Log if Stripe key is present (masked for security)
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    console.log('Stripe key present:', !!stripeKey);
    if (stripeKey) {
      console.log('Stripe key starts with:', stripeKey.substring(0, 3) + '...');
      console.log('Stripe key length:', stripeKey.length);
    }
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { amount, email, name, includeAdGenerator, includeBlueprint, userId, productId, currency } = body;

    if (!amount || !email) {
      console.error('Missing required parameters:', { amount, email });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Use a default name if not provided
    const customerName = name || extractNameFromEmail(email);

    // Convert amount to cents (Stripe requires amounts in cents)
    const amountInCents = Math.round(amount * 100);
    console.log('Amount in cents:', amountInCents);
    
    // Always use EUR currency regardless of what's passed in the request
    const paymentCurrency = 'eur';
    console.log('Using currency:', paymentCurrency);

    // Create a description based on what the user is purchasing
    let description;
    
    // If productId is provided, this is an add-on purchase
    if (productId) {
      switch (productId) {
        case 'consultation-success-blueprint':
          description = 'Consultation Success Blueprint';
          break;
        case 'pricing-template':
          description = 'Premium Pricing Template';
          break;
        case 'pmu-ad-generator':
          description = 'PMU Ad Generator Tool';
          break;
        default:
          description = 'PMU Profit System Add-on';
      }
    } else {
      // This is the main product purchase
      description = 'PMU Profit System';
      if (includeAdGenerator) {
        description += ' + PMU Ad Generator Tool';
      }
      if (includeBlueprint) {
        description += ' + Consultation Success Blueprint';
      }
    }
    
    console.log('Description:', description);

    // Create a payment intent with retry logic
    console.log('Creating payment intent with Stripe...');
    const paymentIntent = await safeStripeOperation(() => 
      stripe.paymentIntents.create({
        amount: amountInCents,
        currency: paymentCurrency,
        description,
        metadata: {
          email,
          name: customerName,
          userId: userId || '', // Include the user ID in metadata
          productId: productId || '', // Include the product ID in metadata for add-on purchases
          includeAdGenerator: includeAdGenerator ? 'true' : 'false',
          includeBlueprint: includeBlueprint ? 'true' : 'false',
        },
        receipt_email: email,
        payment_method_options: {
          card: {
            setup_future_usage: 'on_session',
          }
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      })
    );
    
    console.log('Payment intent created:', paymentIntent.id);
    console.log('Payment intent metadata:', paymentIntent.metadata);
    
    // Create a pending purchase record in the database
    if (userId) {
      const serviceSupabase = getServiceSupabase();
      
      try {
        // Create a purchase record with status 'pending'
        const purchaseData: {
          user_id: string;
          product_id: string;
          amount: number;
          status: string;
          stripe_payment_intent_id: string;
          metadata: {
            email: string;
            name: string;
            product_name: string;
            created_at: string;
            payment_intent_id: string;
            include_ad_generator?: boolean;
            include_blueprint?: boolean;
          };
        } = {
          user_id: userId,
          product_id: productId || 'pmu-profit-system',
          amount: amount,
          status: 'pending',
          stripe_payment_intent_id: paymentIntent.id,
          metadata: {
            email,
            name: customerName,
            product_name: description,
            created_at: new Date().toISOString(),
            payment_intent_id: paymentIntent.id
          }
        };
        
        // Add add-on flags if this is the main product
        if (!productId) {
          purchaseData.metadata.include_ad_generator = !!includeAdGenerator;
          purchaseData.metadata.include_blueprint = !!includeBlueprint;
        }
        
        const { data: purchase, error: purchaseError } = await serviceSupabase
          .from('purchases')
          .insert(purchaseData)
          .select()
          .single();
        
        if (purchaseError) {
          console.error('Error creating pending purchase record:', purchaseError);
        } else {
          console.log('Created pending purchase record:', purchase.id);
          
          // Return the payment intent with the purchase ID
          return NextResponse.json({ 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            purchaseId: purchase.id
          });
        }
      } catch (dbError) {
        console.error('Error creating pending purchase record:', dbError);
        // Continue with payment intent even if creating the pending purchase fails
      }
    }

    // If we didn't return above, return without a purchase ID
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      purchaseId: null
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create payment intent';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // If it's a Stripe error, provide more details
      if ('type' in error) {
        const stripeError = error as any;
        errorMessage = `Stripe error (${stripeError.type}): ${stripeError.message}`;
        
        // Add more context for connection errors
        if (stripeError.type === 'StripeConnectionError') {
          errorMessage += '. This may be due to network issues. Please check your internet connection and try again.';
        }
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 