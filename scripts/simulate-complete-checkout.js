require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'defined' : 'undefined');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'defined' : 'undefined');
  process.exit(1);
}

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing Stripe secret key');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

/**
 * Simulate the complete checkout flow
 */
async function simulateCompleteCheckout() {
  try {
    console.log('Simulating complete checkout flow...');
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Create a Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Step 1: Generate test user data
    const testEmail = `test-checkout-${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    const testName = 'Test Checkout User';
    
    console.log(`\nTest user: ${testEmail} with password: ${testPassword}`);
    
    // Step 2: Create a Stripe checkout session
    console.log('\nCreating Stripe checkout session...');
    
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
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'PMU Ad Generator',
            description: 'AI-powered ad copy generator for PMU businesses',
          },
          unit_amount: 2700, // $27.00
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Consultation Success Blueprint',
            description: 'Guide to successful PMU consultations',
          },
          unit_amount: 3300, // $33.00
        },
        quantity: 1,
      }
    ];
    
    // Create metadata for the checkout session
    const metadata = {
      email: testEmail,
      fullName: testName,
      includeAdGenerator: 'true',
      includeBlueprint: 'true',
      hasPassword: 'true'
    };
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
      customer_email: testEmail,
      metadata,
    });
    
    console.log('Checkout session created:', session.id);
    console.log('Checkout URL:', session.url);
    
    // Step 3: Simulate a successful payment
    console.log('\nSimulating successful payment...');
    
    // Create a test PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 9700, // $97.00
      currency: 'usd',
      payment_method_types: ['card'],
      metadata,
    });
    
    console.log('Payment intent created:', paymentIntent.id);
    
    // Confirm the payment intent with a test card
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      {
        payment_method: 'pm_card_visa', // Test card
      }
    );
    
    console.log('Payment intent confirmed:', confirmedPaymentIntent.status);
    
    // Step 4: Manually trigger the webhook event
    console.log('\nManually triggering webhook event...');
    
    // Create a mock checkout.session.completed event
    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: session.id,
          customer_email: testEmail,
          metadata,
        },
      },
    };
    
    console.log('Created mock event:', event.id);
    
    // Process the webhook event
    await processWebhookEvent(event, supabase);
    
    // Step 5: Verify the user was created
    console.log('\nVerifying user creation...');
    
    // Check if the user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      process.exit(1);
    }
    
    const user = userData.users.find(u => u.email === testEmail);
    
    if (user) {
      console.log('User found in auth.users:');
      console.log('  User ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      
      // Check if the user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profileData) {
        console.log('User profile found in public.users:');
        console.log('  Full name:', profileData.full_name);
      } else {
        console.log('User profile not found in public.users');
      }
      
      // Check if the user has any purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id);
      
      if (purchasesError) {
        console.error('Error fetching user purchases:', purchasesError);
      } else if (purchasesData && purchasesData.length > 0) {
        console.log(`Found ${purchasesData.length} purchases for the user`);
      } else {
        console.log('No purchases found for the user');
      }
      
      // Test login with the created user
      console.log('\nTesting login with the created user...');
      
      // Create a regular Supabase client (not admin) to test login
      const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const { data: signInData, error: signInError } = await regularSupabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.error('Error signing in with test user:', signInError);
      } else {
        console.log('Successfully logged in with test user!');
        console.log('User session:', signInData.session ? 'Created' : 'Not created');
      }
      
      // Clean up - delete the test user
      console.log('\nCleaning up - deleting test user...');
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error('Error deleting test user:', deleteError);
      } else {
        console.log('Test user deleted successfully');
      }
    } else {
      console.log(`No user found with email: ${testEmail}`);
    }
    
    console.log('\nSimulation completed');
    
  } catch (error) {
    console.error('Unexpected error during simulation:', error);
    process.exit(1);
  }
}

/**
 * Process a webhook event
 */
async function processWebhookEvent(event, supabase) {
  try {
    console.log(`Processing webhook event: ${event.type}`);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract metadata
      const metadata = session.metadata || {};
      const email = metadata.email || session.customer_email;
      const fullName = metadata.fullName;
      const includeAdGenerator = metadata.includeAdGenerator === 'true';
      const includeBlueprint = metadata.includeBlueprint === 'true';
      const userId = metadata.userId;
      const hasPassword = metadata.hasPassword === 'true';
      
      console.log(`Processing completed checkout for: ${email}`);
      
      // Check if the user exists in auth.users
      let userIdToUse = userId;
      
      if (!userIdToUse && email) {
        // Try to find the user by email
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers) {
          const existingUser = authUsers.users.find(user => user.email === email);
          if (existingUser) {
            userIdToUse = existingUser.id;
            console.log(`Found user by email: ${userIdToUse}`);
            
            // Always mark the email as confirmed for users who have completed checkout
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { email_confirm: true }
            );
            
            if (updateError) {
              console.error('Error confirming user email:', updateError);
            } else {
              console.log('User email confirmed after successful payment');
            }
          } else {
            // User doesn't exist, create a new user
            console.log('User not found, creating new user with email:', email);
            
            // Generate a secure password if one wasn't provided
            const tempPassword = hasPassword ? 'Test123456!' : `Secure${Math.random().toString(36).slice(2)}!${Math.random().toString(36).slice(2)}`;
            
            // Create the user with admin API - always set email_confirm to true
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true, // Always confirm email for checkout users
              user_metadata: {
                full_name: fullName
              }
            });
            
            if (createError) {
              console.error('Error creating new user:', createError);
            } else if (newUser && newUser.user) {
              userIdToUse = newUser.user.id;
              console.log('Created new user with ID:', userIdToUse);
            }
          }
        }
      }
      
      // Create a completed purchase record
      if (userIdToUse) {
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
              user_id: userIdToUse,
              product_id: productId,
              amount: amount,
              status: 'completed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (purchaseError) {
            console.error(`Error creating purchase record for ${productId}:`, purchaseError);
          } else {
            console.log(`Purchase record created successfully for ${productId}`);
          }
        }
        
        console.log('All purchase records created successfully');
        
        // Ensure the user profile exists in the public.users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userIdToUse)
          .single();
          
        if (profileError || !userProfile) {
          // Create the user profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userIdToUse,
              email: email,
              full_name: fullName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating user profile:', insertError);
          } else {
            console.log('User profile created successfully');
          }
        }
      } else {
        console.error('No user ID found for purchase');
      }
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
  }
}

// Run the simulation
simulateCompleteCheckout(); 