import { NextRequest, NextResponse } from 'next/server';
import { stripe, safeStripeOperation } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { getSecureSiteUrl } from '@/lib/utils';

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
    if (!email || !fullName || !userId) {
      return NextResponse.json(
        { error: 'Email, full name, and userId are required' },
        { status: 400 }
      );
    }
    
    console.log('Creating checkout session for user:', userId, email);
    
    // Use the service role client for admin operations
    const supabase = getServiceSupabase();
    
    // Verify the user exists
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData?.user) {
        console.error('Error verifying user during checkout:', userError);
        return NextResponse.json(
          { error: 'User verification failed' },
          { status: 400 }
        );
      }
      
      // Ensure email is confirmed for the user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error('Error confirming email for user:', updateError);
        // Continue anyway, this is not critical
      } else {
        console.log('Email confirmed for user:', userId);
      }
    } catch (userCheckError) {
      console.error('Error checking user during checkout:', userCheckError);
      return NextResponse.json(
        { error: 'User verification failed' },
        { status: 400 }
      );
    }
    
    // Generate line items for Stripe
    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'PMU Profit System',
            description: 'Complete PMU Profit System',
          },
          unit_amount: 3700, // €37.00
        },
        quantity: 1,
      },
    ];
    
    // Add optional products if selected
    if (includeAdGenerator) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'PMU Ad Generator',
            description: 'PMU Ad Generator Add-on',
          },
          unit_amount: 2700, // €27.00
        },
        quantity: 1,
      });
    }
    
    if (includeBlueprint) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Consultation Success Blueprint',
            description: 'Consultation Success Blueprint Add-on',
          },
          unit_amount: 3300, // €33.00
        },
        quantity: 1,
      });
    }
    
    // Create metadata for the checkout session
    const metadata: Record<string, string> = {
      email: email,
      fullName: fullName,
      includeAdGenerator: includeAdGenerator ? 'true' : 'false',
      includeBlueprint: includeBlueprint ? 'true' : 'false',
      userId: userId,
      // User is already authenticated, so no need for userCreatedDuringCheckout flag
    };
    
    // Create the checkout session
    const session = await safeStripeOperation(() => 
      stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${getSecureSiteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getSecureSiteUrl()}/checkout`,
        customer_email: email, // Set customer email for better UX
        metadata: metadata,
        client_reference_id: userId, // Ensure the user ID is passed as client_reference_id
        allow_promotion_codes: true,
      })
    );
    
    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
    
    // Return both sessionId and URL for flexibility
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 