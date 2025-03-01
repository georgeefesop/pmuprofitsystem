import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: Request) {
  try {
    // Check if Stripe secret key is set
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const hasStripeKey = !!stripeKey;
    
    // Mask the key for security
    const maskedKey = stripeKey ? 
      `${stripeKey.substring(0, 7)}...${stripeKey.substring(stripeKey.length - 4)}` : 
      'Not set';
    
    // Try to initialize Stripe
    let stripeInitialized = false;
    
    if (hasStripeKey) {
      try {
        // Initialize Stripe without specifying API version
        const stripe = new Stripe(stripeKey!);
        stripeInitialized = true;
      } catch (error) {
        console.error('Error initializing Stripe:', error);
      }
    }
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      stripeKeyPresent: hasStripeKey,
      stripeKeyMasked: maskedKey,
      stripeInitialized,
      publicKeyPresent: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      publicKeyMasked: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
        `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.length - 4)}` : 
        'Not set',
      webhookSecretPresent: !!process.env.STRIPE_WEBHOOK_SECRET,
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to debug Stripe configuration' },
      { status: 500 }
    );
  }
} 