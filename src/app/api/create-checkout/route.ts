import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';

// Initialize Stripe with improved configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15' as any,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      fullName, 
      includeAdGenerator, 
      includeBlueprint, 
      totalPrice,
      userId 
    } = body;
    
    // Validate required fields
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }
    
    console.log('Creating checkout session for:', email);
    
    // Use the service role client for admin operations
    const supabase = getServiceSupabase();
    
    // Verify the user exists and is not banned
    let userVerified = false;
    
    if (userId) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData) {
          const user = userData.users.find(u => u.id === userId);
          
          if (user) {
            // Check if the user is banned
            if ((user as any).banned_until) {
              // Unban the user
              const { error: updateError } = await supabase.auth.admin.updateUserById(
                user.id,
                { ban_duration: '0' }
              );
              
              if (updateError) {
                console.error('Error unbanning user during checkout:', updateError);
              } else {
                console.log('Unbanned user during checkout:', user.id);
              }
            }
            
            userVerified = true;
          }
        }
      } catch (userCheckError) {
        console.error('Error checking user during checkout:', userCheckError);
        // Continue with checkout even if user check fails
      }
    }
    
    // Create line items for Stripe
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'PMU Profit System',
            description: 'Complete course for PMU business growth',
          },
          unit_amount: 3700, // $37.00
        },
        quantity: 1,
      },
    ];
    
    // Add upsells if selected
    if (includeAdGenerator) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'PMU Ad Generator',
            description: 'AI-powered ad copy generator for PMU businesses',
          },
          unit_amount: 2700, // $27.00
        },
        quantity: 1,
      });
    }
    
    if (includeBlueprint) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Consultation Success Blueprint',
            description: 'Guide to successful PMU consultations',
          },
          unit_amount: 3300, // $33.00
        },
        quantity: 1,
      });
    }
    
    // Create metadata for the checkout session
    const metadata: Record<string, string> = {
      email,
      fullName,
      includeAdGenerator: includeAdGenerator ? 'true' : 'false',
      includeBlueprint: includeBlueprint ? 'true' : 'false',
    };
    
    if (userId) {
      metadata.userId = userId;
    }
    
    if (!userVerified) {
      metadata.requiresVerification = 'true';
    }
    
    // Create the Stripe checkout session with retry logic
    console.log('Creating Stripe checkout session...');
    const session = await safeStripeOperation(() => 
      stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.nextUrl.origin}/checkout/success${!userVerified ? '?registration=pending' : ''}`,
        cancel_url: `${req.nextUrl.origin}/checkout?cancelled=true`,
        customer_email: email,
        metadata,
      })
    );
    console.log('Checkout session created:', session.id);
    
    // Store the pending purchase information in Supabase
    try {
      const { error: purchaseError } = await supabase
        .from('pending_purchases')
        .insert({
          email,
          full_name: fullName,
          include_ad_generator: includeAdGenerator,
          include_blueprint: includeBlueprint,
          total_price: totalPrice,
          user_id: userId || null,
          checkout_session_id: session.id,
          created_at: new Date().toISOString(),
        });
        
      if (purchaseError) {
        console.error('Error storing pending purchase:', purchaseError);
      }
    } catch (purchaseStoreError) {
      console.error('Exception storing pending purchase:', purchaseStoreError);
      // Continue with checkout even if storing fails
    }
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create checkout session';
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