import { NextResponse } from 'next/server';
import { stripe, safeStripeOperation, checkStripeConfiguration } from '@/lib/stripe';

export async function GET() {
  try {
    console.log('Testing Stripe connection...');
    
    // Log if Stripe key is present (masked for security)
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    console.log('Stripe key present:', !!stripeKey);
    if (stripeKey) {
      console.log('Stripe key starts with:', stripeKey.substring(0, 3) + '...');
      console.log('Stripe key length:', stripeKey.length);
    }
    
    // Check the Stripe configuration
    const configCheck = await checkStripeConfiguration();
    
    if (!configCheck.success) {
      return NextResponse.json({
        success: false,
        message: configCheck.message,
        details: configCheck.details,
        stripeKeyInfo: {
          present: !!stripeKey,
          length: stripeKey ? stripeKey.length : 0,
          prefix: stripeKey ? stripeKey.substring(0, 3) + '...' : 'N/A'
        }
      }, { status: 500 });
    }
    
    // Test the connection by making a simple API call
    console.log('Making test API call to Stripe...');
    const balance = await safeStripeOperation(() => stripe.balance.retrieve());
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe connection successful',
      balanceAvailable: balance.available.map(b => ({ amount: b.amount, currency: b.currency })),
      balancePending: balance.pending.map(b => ({ amount: b.amount, currency: b.currency })),
      stripeKeyInfo: {
        present: !!stripeKey,
        length: stripeKey ? stripeKey.length : 0,
        prefix: stripeKey ? stripeKey.substring(0, 3) + '...' : 'N/A'
      }
    });
  } catch (error) {
    console.error('Error testing Stripe connection:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to connect to Stripe';
    let errorType = 'unknown';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // If it's a Stripe error, provide more details
      if ('type' in error) {
        const stripeError = error as any;
        errorType = stripeError.type;
        errorMessage = `Stripe error (${stripeError.type}): ${stripeError.message}`;
      }
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      errorType,
      stripeKeyInfo: {
        present: !!process.env.STRIPE_SECRET_KEY,
        length: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
        prefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 3) + '...' : 'N/A'
      }
    }, { status: 500 });
  }
} 