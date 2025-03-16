import { NextRequest, NextResponse } from 'next/server';
import { stripe, safeStripeOperation } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { getSecureSiteUrl } from '@/lib/utils';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Product information
const PRODUCTS = {
  'consultation-success-blueprint': {
    name: 'Consultation Success Blueprint',
    description: 'Transform your consultations into bookings with our proven framework',
    price: 3300, // €33.00 in cents
  },
  'pricing-template': {
    name: 'Premium Pricing Template',
    description: 'Create professional, conversion-optimized pricing packages in minutes',
    price: 2700, // €27.00 in cents
  },
  'pmu-ad-generator': {
    name: 'PMU Ad Generator',
    description: 'Create high-converting PMU ads in minutes',
    price: 2700, // €27.00 in cents
  }
};

// Helper function to generate a secure state token
function generateStateToken(userId: string | null, authSession: any) {
  const timestamp = Date.now();
  const randomId = uuidv4();
  
  // Include more authentication data in the state token
  const tokenData = {
    userId,
    timestamp,
    randomId,
    // Include auth tokens if available
    accessToken: authSession?.access_token || null,
    refreshToken: authSession?.refresh_token || null,
    email: authSession?.user?.email || null,
    // Add more user information for better session restoration
    userMetadata: authSession?.user?.user_metadata || null,
    authProvider: authSession?.user?.app_metadata?.provider || 'email',
    lastSignInAt: authSession?.user?.last_sign_in_at || null
  };
  
  console.log('Generated state token with data:', {
    userId,
    timestamp,
    hasAccessToken: !!authSession?.access_token,
    hasRefreshToken: !!authSession?.refresh_token,
    email: authSession?.user?.email || null
  });
  
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, successUrl, cancelUrl, userId, email } = body;
    
    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Validate product exists
    if (!PRODUCTS[productId as keyof typeof PRODUCTS]) {
      return NextResponse.json(
        { error: 'Invalid product selected' },
        { status: 400 }
      );
    }
    
    console.log('Creating checkout session for add-on product:', productId);
    
    const product = PRODUCTS[productId as keyof typeof PRODUCTS];
    
    // Get current user from session if available
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const currentUserId = authSession?.user?.id || userId || null;
    
    console.log('User information for checkout:', {
      currentUserId,
      hasAuthSession: !!authSession,
      userEmail: authSession?.user?.email || email || null
    });
    
    // Generate a state token for authentication persistence
    const stateToken = generateStateToken(currentUserId, authSession);
    
    // Generate line items for Stripe
    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ];
    
    // Create a pending purchase record in the database
    let purchaseId = null;
    if (currentUserId || email) {
      const supabase = getServiceSupabase();
      
      try {
        // Create a purchase record with status 'pending'
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: currentUserId || null,
            product_id: productId,
            amount: product.price / 100, // Convert cents to euros
            status: 'pending',
            metadata: {
              email: email || (authSession?.user?.email || null),
              product_name: product.name,
              product_description: product.description,
              created_at: new Date().toISOString(),
              state_token: stateToken, // Store the state token in metadata
              auth_user_id: currentUserId // Store the user ID explicitly
            }
          })
          .select()
          .single();
        
        if (purchaseError) {
          console.error('Error creating pending purchase record:', purchaseError);
        } else {
          console.log('Created pending purchase record:', purchase.id);
          purchaseId = purchase.id;
        }
      } catch (dbError) {
        console.error('Error creating pending purchase record:', dbError);
        // Continue with checkout even if creating the pending purchase fails
      }
    }
    
    // Create metadata for the checkout session
    const metadata: Record<string, string> = {
      productId: productId,
      stateToken: stateToken // Include state token in metadata
    };
    
    // Add user ID to metadata if available
    if (currentUserId) {
      metadata.userId = currentUserId;
    }
    
    // Add email to metadata if available
    if (email || authSession?.user?.email) {
      metadata.email = email || authSession?.user?.email || '';
    }
    
    // Add purchase ID to metadata if available
    if (purchaseId) {
      metadata.purchaseId = purchaseId;
    }
    
    // Ensure the success URL includes all necessary parameters
    const enhancedSuccessUrl = successUrl || 
      `${getSecureSiteUrl()}/checkout/success?product=${productId}&purchase_id=${purchaseId || ''}&session_id={CHECKOUT_SESSION_ID}&state=${encodeURIComponent(stateToken)}&auth_user_id=${currentUserId || ''}`;
    
    console.log('Using success URL:', enhancedSuccessUrl);
    
    // Create the checkout session
    const stripeSession = await safeStripeOperation(() => 
      stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: enhancedSuccessUrl,
        cancel_url: cancelUrl || `${getSecureSiteUrl()}/dashboard`,
        metadata: metadata,
        allow_promotion_codes: true,
        customer_email: email || authSession?.user?.email || undefined,
      })
    );
    
    if (!stripeSession) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
    
    // Update the pending purchase with the session ID if available
    if (purchaseId) {
      const supabase = getServiceSupabase();
      
      try {
        const { error: updateError } = await supabase
          .from('purchases')
          .update({
            stripe_checkout_session_id: stripeSession.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', purchaseId);
        
        if (updateError) {
          console.error('Error updating pending purchase with session ID:', updateError);
        } else {
          console.log('Updated pending purchase with session ID:', stripeSession.id);
        }
      } catch (updateError) {
        console.error('Error updating pending purchase with session ID:', updateError);
        // Continue even if the update fails
      }
    }
    
    // Return both sessionId and URL for flexibility
    return NextResponse.json({ 
      sessionId: stripeSession.id,
      url: stripeSession.url,
      purchaseId: purchaseId
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 