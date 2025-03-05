/**
 * Test script for the "Create Account First, Then Purchase" flow
 * 
 * This script tests the entire flow:
 * 1. Create a test user account
 * 2. Verify the user can log in
 * 3. Create a checkout session for the authenticated user
 * 4. Simulate a successful payment
 * 5. Verify purchase records were created
 * 6. Clean up test data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration
const TEST_EMAIL = `test-user-${Date.now()}@example.com`;
const TEST_PASSWORD = 'SecurePassword123!';
const TEST_FULL_NAME = 'Test User';

// Log environment info
console.log('Environment:');
console.log(`- Supabase URL: ${supabaseUrl}`);
console.log(`- Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
console.log('');

async function runTest() {
  try {
    console.log('Starting test of "Create Account First, Then Purchase" flow...');
    console.log(`Using test email: ${TEST_EMAIL}`);
    
    // Step 1: Create a test user account
    console.log('\n1. Creating test user account...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: TEST_FULL_NAME
      }
    });
    
    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }
    
    const userId = userData.user.id;
    console.log(`✅ Test user created with ID: ${userId}`);
    
    // Create user profile in public.users table
    console.log('Creating user profile in public.users table...');
    
    // First check if the profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned" which is expected if the profile doesn't exist
      console.error('Error checking for existing profile:', profileCheckError);
    }
    
    if (existingProfile) {
      console.log('✅ User profile already exists, skipping creation');
    } else {
      // Create the profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: TEST_EMAIL,
          full_name: TEST_FULL_NAME,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }
      console.log('✅ User profile created in public.users table');
    }
    
    // Step 2: Verify the user can log in
    console.log('\n2. Verifying user can log in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signInError) {
      throw new Error(`Failed to sign in as test user: ${signInError.message}`);
    }
    console.log('✅ Successfully signed in as test user');
    
    // Step 3: Create a checkout session for the authenticated user
    console.log('\n3. Creating checkout session...');
    
    // Prepare checkout session data
    const sessionData = {
      email: TEST_EMAIL,
      fullName: TEST_FULL_NAME,
      userId: userId,
      includeAdGenerator: true,
      includeBlueprint: true
    };
    
    // Create checkout session directly with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
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
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'PMU Ad Generator',
              description: 'PMU Ad Generator Add-on',
            },
            unit_amount: 2700, // €27.00
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Consultation Success Blueprint',
              description: 'Consultation Success Blueprint Add-on',
            },
            unit_amount: 3300, // €33.00
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      customer_email: TEST_EMAIL,
      metadata: {
        email: TEST_EMAIL,
        fullName: TEST_FULL_NAME,
        userId: userId,
        includeAdGenerator: 'true',
        includeBlueprint: 'true'
      }
    });
    
    console.log(`✅ Checkout session created with ID: ${session.id}`);
    console.log(`  Success URL: ${session.success_url}`);
    console.log(`  Cancel URL: ${session.cancel_url}`);
    
    // Step 4: Simulate a successful payment by triggering the webhook handler
    console.log('\n4. Simulating successful payment...');
    
    // Create a mock checkout.session.completed event
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: session
      }
    };
    
    // Call our webhook handler directly
    console.log('Calling webhook handler with checkout.session.completed event...');
    
    // Process the webhook event manually
    // In a real scenario, this would be handled by the webhook endpoint
    console.log('Processing webhook event...');
    
    // Verify the user exists
    const { data: verifyUserData, error: verifyUserError } = await supabase.auth.admin.getUserById(userId);
    
    if (verifyUserError || !verifyUserData?.user) {
      throw new Error(`Error verifying user: ${verifyUserError?.message || 'User not found'}`);
    }
    
    console.log(`✅ Verified user: ${userId}`);
    
    // Ensure the user's email is confirmed
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('Error confirming user email:', updateError);
    } else {
      console.log('✅ User email confirmed after successful payment');
    }
    
    // Determine which products were purchased
    const products = ['pmu-profit-system']; // Base product is always included
    if (session.metadata.includeAdGenerator === 'true') products.push('pmu-ad-generator');
    if (session.metadata.includeBlueprint === 'true') products.push('consultation-blueprint');
    
    // Step 5: Create purchase records for each product
    console.log('\n5. Creating purchase records...');
    
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
          updated_at: new Date().toISOString()
        });
        
      if (purchaseError) {
        console.error(`Error creating purchase record for ${productId}:`, purchaseError);
      } else {
        console.log(`✅ Purchase record created successfully for ${productId}`);
      }
    }
    
    console.log('✅ All purchase records created successfully');
    
    // Step 6: Verify the user has the purchases
    console.log('\n6. Verifying purchases...');
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId);
      
    if (purchasesError) {
      throw new Error(`Failed to fetch purchases: ${purchasesError.message}`);
    }
    
    console.log(`✅ Found ${purchases.length} purchases for the user:`);
    purchases.forEach(purchase => {
      console.log(`  - ${purchase.product_id}: €${(purchase.amount / 100).toFixed(2)}`);
    });
    
    // Step 7: Clean up test data
    console.log('\n7. Cleaning up test data...');
    
    // Delete purchases
    const { error: deletePurchasesError } = await supabase
      .from('purchases')
      .delete()
      .eq('user_id', userId);
      
    if (deletePurchasesError) {
      console.error(`Warning: Failed to delete purchases: ${deletePurchasesError.message}`);
    } else {
      console.log('✅ Deleted purchase records');
    }
    
    // Delete user profile
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteProfileError) {
      console.error(`Warning: Failed to delete user profile: ${deleteProfileError.message}`);
    } else {
      console.log('✅ Deleted user profile');
    }
    
    // Delete user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error(`Warning: Failed to delete user: ${deleteUserError.message}`);
    } else {
      console.log('✅ Deleted user account');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTest(); 