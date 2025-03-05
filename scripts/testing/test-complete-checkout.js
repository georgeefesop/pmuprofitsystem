require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function testCompleteCheckout() {
  try {
    // Load environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    console.log('Environment variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'undefined');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[REDACTED]' : 'undefined');
    console.log('- STRIPE_SECRET_KEY:', stripeSecretKey ? '[REDACTED]' : 'undefined');
    console.log('- NEXT_PUBLIC_SITE_URL:', siteUrl);

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('Missing required environment variables. Please check your .env.local file.');
      process.exit(1);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized');

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey);
    console.log('Stripe client initialized');

    // Test connection to Supabase
    console.log('Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase.from('users').select('count').limit(1);
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError.message);
      console.log('Please check your Supabase URL and service role key.');
      process.exit(1);
    }
    
    console.log('Supabase connection successful');

    // Create a test user email
    const testEmail = `test-${Date.now()}@example.com`;
    const testFullName = 'Test User';
    const testPassword = 'Password123!';

    console.log(`Creating test user with email: ${testEmail}`);

    // Create a test user in Supabase
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testFullName
      }
    });

    if (userError) {
      console.error('Error creating test user:', userError.message);
      process.exit(1);
    }

    const userId = userData.user.id;
    console.log(`Test user created with ID: ${userId}`);

    // Create user profile
    console.log('Creating user profile...');
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: testFullName,
        email: testEmail
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      // Continue anyway, as this might be handled by the webhook
    } else {
      console.log('User profile created successfully');
    }

    // Create a test checkout session
    console.log('Creating test checkout session...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'PMU Profit System',
            },
            unit_amount: 3700,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'PMU Ad Generator',
            },
            unit_amount: 2700,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
      customer_email: testEmail,
      metadata: {
        userId: userId,
        fullName: testFullName,
        includeAdGenerator: 'true',
        includeBlueprint: 'false',
      },
    });

    console.log(`Test checkout session created with ID: ${session.id}`);
    console.log(`Success URL: ${session.success_url}`);
    console.log(`Cancel URL: ${session.cancel_url}`);

    // Simulate a checkout.session.completed event
    console.log('Simulating checkout.session.completed webhook event...');
    
    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'checkout.session.completed',
      data: {
        object: session
      }
    };

    // Process the webhook event
    console.log('Processing webhook event...');
    const webhookResult = await processWebhookEvent(event, supabase);
    console.log('Webhook result:', webhookResult);

    // Check if purchases were created
    console.log('Checking if purchases were created...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId);

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError.message);
    } else if (!purchases || purchases.length === 0) {
      console.log('No purchases found for the test user');
    } else {
      console.log(`Found ${purchases.length} purchases for the test user:`);
      purchases.forEach((purchase, index) => {
        console.log(`Purchase ${index + 1}:`);
        console.log(`- Product ID: ${purchase.product_id}`);
        console.log(`- Amount: ${purchase.amount}`);
        console.log(`- Status: ${purchase.status}`);
        console.log(`- Created at: ${purchase.created_at}`);
      });
    }

    // Test user login
    console.log('\nTesting user login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('Error signing in with test user:', signInError.message);
    } else {
      console.log('Successfully signed in with test user');
      console.log('User session:', signInData.session ? 'Created' : 'Not created');
    }

    // Clean up - delete the test user and associated data
    console.log('\nCleaning up test data...');
    
    // Delete purchases
    const { error: deletePurchasesError } = await supabase
      .from('purchases')
      .delete()
      .eq('user_id', userId);
      
    if (deletePurchasesError) {
      console.warn('Warning: Could not delete purchases:', deletePurchasesError.message);
    } else {
      console.log('Deleted purchases for test user');
    }
    
    // Delete user profile
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteProfileError) {
      console.warn('Warning: Could not delete user profile:', deleteProfileError.message);
    } else {
      console.log('Deleted user profile for test user');
    }
    
    // Delete auth user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('Error deleting test user:', deleteUserError.message);
    } else {
      console.log('Deleted test user');
    }

    console.log('\nTest completed successfully');
    
  } catch (error) {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  }
}

async function processWebhookEvent(event, supabase) {
  try {
    if (event.type !== 'checkout.session.completed') {
      return { success: false, message: `Event type ${event.type} not handled` };
    }

    const session = event.data.object;
    
    // Extract metadata from the session
    const { userId, fullName, includeAdGenerator, includeBlueprint } = session.metadata || {};
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
      return { success: false, message: 'No customer email found in session' };
    }

    console.log(`Processing checkout for email: ${customerEmail}`);

    // Check if user exists
    let user;
    
    if (userId) {
      // If userId is provided in metadata, check if that user exists
      const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (!userError && existingUser?.user) {
        user = existingUser.user;
        console.log(`Found existing user with ID: ${user.id}`);
      }
    }
    
    if (!user) {
      // If no user found by ID, look up by email
      const { data: userByEmail, error: emailError } = await supabase.auth.admin.listUsers();
      
      if (!emailError && userByEmail?.users) {
        user = userByEmail.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
        
        if (user) {
          console.log(`Found existing user with email: ${customerEmail}`);
        }
      }
    }

    // If user still not found, create a new user
    if (!user) {
      console.log(`No existing user found for email: ${customerEmail}. Creating new user...`);
      
      // Generate a random password if none provided
      const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || customerEmail.split('@')[0]
        }
      });
      
      if (createError) {
        console.error(`Error creating user: ${createError.message}`);
        return { success: false, message: `Failed to create user: ${createError.message}` };
      }
      
      user = newUser.user;
      console.log(`Created new user with ID: ${user.id}`);
    }

    // Create user profile if it doesn't exist
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`Error checking user profile: ${profileError.message}`);
    }
    
    if (!existingProfile) {
      console.log(`Creating user profile for user ID: ${user.id}`);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          full_name: fullName || user.user_metadata?.full_name || customerEmail.split('@')[0],
          email: customerEmail
        });
        
      if (insertError) {
        console.error(`Error creating user profile: ${insertError.message}`);
      } else {
        console.log(`Created user profile for user ID: ${user.id}`);
      }
    }

    // Create purchase records
    console.log('Creating purchase records...');
    
    // Always create the main product purchase
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        product_id: 'pmu-profit-system',
        amount: 3700,
        status: 'completed',
        updated_at: new Date().toISOString()
      });
      
    if (purchaseError) {
      console.error(`Error creating purchase record for main product: ${purchaseError.message}`);
    } else {
      console.log('Created purchase record for PMU Profit System');
    }
    
    // Create purchase record for Ad Generator if included
    if (includeAdGenerator === 'true') {
      const { error: adGenError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          product_id: 'pmu-ad-generator',
          amount: 2700,
          status: 'completed',
          updated_at: new Date().toISOString()
        });
        
      if (adGenError) {
        console.error(`Error creating purchase record for ad generator: ${adGenError.message}`);
      } else {
        console.log('Created purchase record for PMU Ad Generator');
      }
    }
    
    // Create purchase record for Blueprint if included
    if (includeBlueprint === 'true') {
      const { error: blueprintError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          product_id: 'consultation-blueprint',
          amount: 2700,
          status: 'completed',
          updated_at: new Date().toISOString()
        });
        
      if (blueprintError) {
        console.error(`Error creating purchase record for blueprint: ${blueprintError.message}`);
      } else {
        console.log('Created purchase record for Consultation Blueprint');
      }
    }

    return { 
      success: true, 
      message: 'Webhook processed successfully',
      userId: user.id,
      email: customerEmail,
      purchasedProducts: [
        'pmu-profit-system',
        ...(includeAdGenerator === 'true' ? ['pmu-ad-generator'] : []),
        ...(includeBlueprint === 'true' ? ['consultation-blueprint'] : [])
      ]
    };
    
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return { success: false, message: `Error processing webhook: ${error.message}` };
  }
}

testCompleteCheckout()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }); 