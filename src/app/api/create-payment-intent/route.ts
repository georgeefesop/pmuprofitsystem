import { NextResponse } from 'next/server';
import { stripe, safeStripeOperation } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

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
    
    const { amount, email, name, includeAdGenerator, includeBlueprint, userId } = body;

    if (!amount || !email || !name) {
      console.error('Missing required parameters:', { amount, email, name });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert amount to cents (Stripe requires amounts in cents)
    const amountInCents = Math.round(amount * 100);
    console.log('Amount in cents:', amountInCents);

    // Create a description based on what the user is purchasing
    let description = 'PMU Profit System';
    if (includeAdGenerator) {
      description += ' + PMU Ad Generator Tool';
    }
    if (includeBlueprint) {
      description += ' + Consultation Success Blueprint';
    }
    console.log('Description:', description);

    // Create a payment intent with retry logic
    console.log('Creating payment intent with Stripe...');
    const paymentIntent = await safeStripeOperation(() => 
      stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        description,
        metadata: {
          email,
          name,
          userId: userId || '', // Include the user ID in metadata
          includeAdGenerator: includeAdGenerator ? 'true' : 'false',
          includeBlueprint: includeBlueprint ? 'true' : 'false',
        },
        receipt_email: email,
      })
    );
    
    console.log('Payment intent created:', paymentIntent.id);
    console.log('Payment intent metadata:', paymentIntent.metadata);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
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