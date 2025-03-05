import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';

// Configure this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get the Supabase client
    const supabase = getServiceSupabase();
    
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe secret key is missing' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
    });
    
    // Generate test user data
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    const testName = 'Test User';
    
    // Step 1: Create a test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName
      }
    });
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Failed to create test user', 
        details: userError 
      }, { status: 500 });
    }
    
    const userId = userData.user.id;
    
    // Create user profile in the public.users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: testEmail,
        full_name: testName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (profileError) {
      console.error('Error creating user profile:', profileError);
    }
    
    // Step 2: Create a test checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PMU Profit System Test',
              description: 'Test product for checkout flow',
            },
            unit_amount: 3700, // $37.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?cancelled=true`,
      customer_email: testEmail,
      metadata: {
        email: testEmail,
        fullName: testName,
        userId: userId,
        includeAdGenerator: 'true',
        includeBlueprint: 'true',
        test: 'true'
      },
    });
    
    // Step 3: Simulate a successful payment (in test mode)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 3700, // $37.00
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        checkout_session_id: session.id,
      },
    });
    
    // Confirm the payment intent with a test card
    await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: 'pm_card_visa', // Test card token
    });
    
    // Step 4: Simulate the webhook event for completed checkout
    const event = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: session.id,
          object: 'checkout.session',
          customer_email: testEmail,
          metadata: {
            email: testEmail,
            fullName: testName,
            userId: userId,
            includeAdGenerator: 'true',
            includeBlueprint: 'true',
            test: 'true'
          },
          payment_status: 'paid',
          amount_total: 3700,
        },
      },
      type: 'checkout.session.completed',
    };
    
    // Process the webhook event - we already know the user exists
    const webhookResult = await processWebhookEvent(event as any, true);
    
    // Step 5: Verify the user and purchase records
    const { data: verifyUser, error: verifyUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (verifyUserError) {
      return NextResponse.json({ 
        error: 'Failed to verify user record', 
        details: verifyUserError 
      }, { status: 500 });
    }
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId);
    
    if (purchasesError) {
      return NextResponse.json({ 
        error: 'Failed to verify purchase records', 
        details: purchasesError 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      testUser: {
        email: testEmail,
        password: testPassword,
        userId: userId
      },
      checkoutSession: {
        id: session.id,
        url: session.url
      },
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status
      },
      webhookResult,
      verification: {
        user: verifyUser,
        purchases: purchases
      }
    });
    
  } catch (error) {
    console.error('Error in test checkout flow API:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to process webhook events
async function processWebhookEvent(event: any, skipUserCreation = false) {
  try {
    const supabase = getServiceSupabase();
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract metadata
      const metadata = session.metadata || {};
      const email = metadata.email || session.customer_email;
      const fullName = metadata.fullName;
      const userId = metadata.userId;
      const includeAdGenerator = metadata.includeAdGenerator === 'true';
      const includeBlueprint = metadata.includeBlueprint === 'true';
      
      // If skipUserCreation is true, we assume the user exists and just create the purchase
      if (skipUserCreation && userId) {
        console.log('Skipping user creation, using existing user:', userId);
        
        // Determine which products were purchased
        const products = [];
        if (includeAdGenerator) products.push('pmu-ad-generator');
        if (includeBlueprint) products.push('consultation-blueprint');
        products.push('pmu-profit-system'); // Base product is always included
        
        // Create a purchase record for each product
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
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (purchaseError) {
            console.error(`Error creating purchase record for ${productId}:`, purchaseError);
            return { error: `Failed to create purchase record for ${productId}`, details: purchaseError };
          } else {
            console.log(`Purchase record created successfully for ${productId}`);
          }
        }
        
        console.log('All purchase records created successfully');
        return { success: true, userId: userId, action: 'purchase_created' };
      }
      
      // Normal flow - check if the user exists
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        return { error: 'Failed to list users', details: userError };
      }
      
      const user = userData.users.find(u => u.id === userId || u.email === email);
      
      if (user) {
        // User exists, update their email confirmation status
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });
        
        // Check if user profile exists in public.users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          // Create the user profile if it doesn't exist
          const { error: createProfileError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: email,
              full_name: fullName || user.user_metadata?.full_name || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (createProfileError) {
            console.error('Error creating user profile:', createProfileError);
          }
        }
        
        // Determine which products were purchased
        const products = [];
        if (includeAdGenerator) products.push('pmu-ad-generator');
        if (includeBlueprint) products.push('consultation-blueprint');
        products.push('pmu-profit-system'); // Base product is always included
        
        // Create a purchase record for each product
        for (const productId of products) {
          const amount = productId === 'pmu-profit-system' ? 3700 : 
                        productId === 'pmu-ad-generator' ? 2700 : 3300;
                        
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: user.id,
              product_id: productId,
              amount: amount,
              status: 'completed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (purchaseError) {
            console.error(`Error creating purchase record for ${productId}:`, purchaseError);
            return { error: `Failed to create purchase record for ${productId}`, details: purchaseError };
          } else {
            console.log(`Purchase record created successfully for ${productId}`);
          }
        }
        
        console.log('All purchase records created successfully');
        return { success: true, userId: user.id, action: 'updated' };
      } else {
        // User doesn't exist, create a new user with a random password
        // Use a timestamp-based password that meets requirements
        const randomPassword = `Test${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || 'New User'
          }
        });
        
        if (createError) {
          return { error: 'Failed to create user', details: createError };
        }
        
        // Create the user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: newUser.user.id,
            email: email,
            full_name: fullName || 'New User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
        
        // Determine which products were purchased
        const products = [];
        if (includeAdGenerator) products.push('pmu-ad-generator');
        if (includeBlueprint) products.push('consultation-blueprint');
        products.push('pmu-profit-system'); // Base product is always included
        
        // Create a purchase record for each product
        for (const productId of products) {
          const amount = productId === 'pmu-profit-system' ? 3700 : 
                        productId === 'pmu-ad-generator' ? 2700 : 3300;
                        
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: newUser.user.id,
              product_id: productId,
              amount: amount,
              status: 'completed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (purchaseError) {
            console.error(`Error creating purchase record for ${productId}:`, purchaseError);
            return { error: `Failed to create purchase record for ${productId}`, details: purchaseError };
          } else {
            console.log(`Purchase record created successfully for ${productId}`);
          }
        }
        
        console.log('All purchase records created successfully');
        return { 
          success: true, 
          userId: newUser.user.id, 
          action: 'created',
          password: randomPassword // Include the generated password in the response
        };
      }
    }
    
    return { success: false, message: 'Unhandled event type' };
  } catch (error) {
    return { 
      error: 'Error processing webhook event', 
      details: error instanceof Error ? error.message : String(error)
    };
  }
} 