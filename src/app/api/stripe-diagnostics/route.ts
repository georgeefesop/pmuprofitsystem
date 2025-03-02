import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    // Check environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Mask keys for security
    const maskKey = (key: string | undefined) => {
      if (!key) return 'Not set';
      if (key.length < 10) return 'Invalid (too short)';
      return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };
    
    // Check if Stripe can be initialized
    let stripeInitialized = false;
    let stripeBalance = null;
    let stripeError = null;
    
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey.trim(), {
          apiVersion: '2022-11-15' as any,
        });
        
        stripeInitialized = true;
        
        // Try to make a simple API call
        try {
          stripeBalance = await stripe.balance.retrieve();
        } catch (error: any) {
          stripeError = {
            message: error.message,
            type: error.type || 'unknown',
            code: error.code || 'unknown',
          };
        }
      } catch (error: any) {
        stripeError = {
          message: error.message,
          location: 'initialization',
        };
      }
    }
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      vercelEnvironment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'unknown',
      stripeConfiguration: {
        secretKey: {
          present: !!stripeSecretKey,
          masked: maskKey(stripeSecretKey),
          valid: stripeSecretKey?.startsWith('sk_'),
          length: stripeSecretKey?.length || 0,
          hasWhitespace: stripeSecretKey ? stripeSecretKey.trim() !== stripeSecretKey : false,
        },
        publishableKey: {
          present: !!stripePublishableKey,
          masked: maskKey(stripePublishableKey),
          valid: stripePublishableKey?.startsWith('pk_'),
          length: stripePublishableKey?.length || 0,
          hasWhitespace: stripePublishableKey ? stripePublishableKey.trim() !== stripePublishableKey : false,
        },
        webhookSecret: {
          present: !!stripeWebhookSecret,
          masked: maskKey(stripeWebhookSecret),
          valid: stripeWebhookSecret?.startsWith('whsec_'),
          length: stripeWebhookSecret?.length || 0,
        },
      },
      stripeStatus: {
        initialized: stripeInitialized,
        balance: stripeBalance,
        error: stripeError,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to diagnose Stripe configuration',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 