import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Initialize Stripe with the secret key and improved configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15' as any, // Use the same version as before but with improved config
  timeout: 30000, // 30 seconds timeout
  maxNetworkRetries: 3, // Automatically retry failed requests
  httpAgent: undefined, // Let Stripe handle the HTTP agent
});

// Helper function to safely execute Stripe API calls with custom retry logic
async function safeStripeOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      retryCount++;
      
      // Log the retry attempt
      console.warn(`Stripe operation failed (attempt ${retryCount}/${maxRetries}):`, error.message);
      
      // Check if the error is retryable
      if (
        error.type === 'StripeConnectionError' || 
        error.type === 'StripeAPIError' ||
        error.type === 'StripeTimeoutError' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND'
      ) {
        // Exponential backoff with jitter
        const delay = Math.min(Math.pow(2, retryCount) * 100 + Math.random() * 100, 3000);
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Non-retryable error, throw immediately
      throw error;
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
}

export async function POST(request: Request) {
  try {
    console.log('Creating payment intent...');
    
    // Log if Stripe key is present (masked for security)
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    console.log('Stripe key present:', !!stripeKey);
    if (stripeKey) {
      console.log('Stripe key starts with:', stripeKey.substring(0, 3) + '...');
    }
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { amount, email, name, includeAdGenerator, includeBlueprint } = body;

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
          includeAdGenerator: includeAdGenerator ? 'true' : 'false',
          includeBlueprint: includeBlueprint ? 'true' : 'false',
        },
        receipt_email: email,
      })
    );
    
    console.log('Payment intent created:', paymentIntent.id);

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