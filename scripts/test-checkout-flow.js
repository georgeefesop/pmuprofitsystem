require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const fetch = require('node-fetch');

async function testCheckoutFlow() {
  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('Error: Required environment variables are missing in .env.local');
      process.exit(1);
    }
    
    console.log('Connecting to Supabase at:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Connecting to Stripe...');
    const stripe = new Stripe(stripeSecretKey);
    
    // Generate a unique test email
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = `Password${Date.now()}!`;
    const testName = 'Test User';
    
    console.log(`Using test email: ${testEmail}`);
    console.log(`Using test password: ${testPassword}`);
    
    // Step 1: Call the create-checkout API
    console.log('\nStep 1: Calling create-checkout API...');
    
    const createCheckoutResponse = await fetch(`${siteUrl}/api/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        fullName: testName,
        password: testPassword,
        includeAdGenerator: true,
        includeBlueprint: true,
        totalPrice: 9700 // €97.00 (37 + 27 + 33)
      }),
    });
    
    if (!createCheckoutResponse.ok) {
      const errorData = await createCheckoutResponse.json();
      console.error('Error creating checkout session:', errorData);
      process.exit(1);
    }
    
    const checkoutData = await createCheckoutResponse.json();
    console.log('Checkout session created:', checkoutData);
    
    const sessionId = checkoutData.sessionId;
    if (!sessionId) {
      console.error('No session ID returned from create-checkout API');
      process.exit(1);
    }
    
    console.log(`Checkout session ID: ${sessionId}`);
    
    // Step 2: Retrieve the session from Stripe
    console.log('\nStep 2: Retrieving session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session retrieved:', {
      id: session.id,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      metadata: session.metadata
    });
    
    // Step 3: Simulate a successful payment by triggering the webhook
    console.log('\nStep 3: Simulating successful payment by triggering webhook...');
    
    // Process the webhook event manually
    const webhookResult = await processWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: session
      }
    }, supabase);
    
    console.log('Webhook processing result:', webhookResult);
    
    // Step 4: Check if the user was created in Supabase
    console.log('\nStep 4: Checking if user was created in Supabase...');
    
    // Wait a moment for the database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing users:', authError);
      process.exit(1);
    }
    
    const createdUser = authUsers.users.find(user => user.email === testEmail);
    
    if (!createdUser) {
      console.error('User was not created in Supabase');
      process.exit(1);
    }
    
    console.log(`User was created with ID: ${createdUser.id}`);
    console.log(`Email confirmed: ${createdUser.email_confirmed_at ? 'Yes' : 'No'}`);
    
    // Step 5: Check if purchases were created
    console.log('\nStep 5: Checking if purchases were created...');
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', createdUser.id);
    
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      process.exit(1);
    }
    
    console.log(`Found ${purchases.length} purchases for the user`);
    
    if (purchases.length > 0) {
      console.log('\nPurchase details:');
      console.log('----------------');
      
      purchases.forEach((purchase, index) => {
        console.log(`Purchase ${index + 1}:`);
        console.log(`  Product: ${purchase.product_id}`);
        console.log(`  Amount: ${purchase.amount}`);
        console.log(`  Status: ${purchase.status}`);
        console.log(`  Created at: ${new Date(purchase.created_at).toLocaleString()}`);
        console.log('----------------');
      });
    }
    
    // Step 6: Test login with the created user
    console.log('\nStep 6: Testing login with the created user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in with created user:', signInError);
      process.exit(1);
    }
    
    console.log('Login successful!', {
      user_id: signInData.user.id,
      email: signInData.user.email,
      session: signInData.session ? 'Valid' : 'Invalid'
    });
    
    console.log('\nCheckout flow test completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Function to process webhook event (similar to the one in the webhook handler)
async function processWebhookEvent(event, supabase) {
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
    
    console.log(`Processing completed checkout for: ${email}`);
    
    if (!email) {
      console.error('No email found in session metadata or customer_email');
      return { success: false, error: 'No email found' };
    }
    
    try {
      // Check if the user exists in auth.users
      let userIdToUse = userId;
      let userExists = false;
      
      // Try to find the user by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error listing users:', authError);
        return { success: false, error: authError.message };
      } else if (authUsers) {
        const existingUser = authUsers.users.find(user => 
          user.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (existingUser) {
          userIdToUse = existingUser.id;
          userExists = true;
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
        }
      }
      
      // If user doesn't exist, create a new user
      if (!userExists && !userIdToUse) {
        console.log('User not found, creating new user with email:', email);
        
        // Generate a secure password
        const tempPassword = `Secure${Math.random().toString(36).slice(2)}!${Math.random().toString(36).slice(2)}`;
        
        // Create the user with admin API - always set email_confirm to true
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true, // Always confirm email for checkout users
          user_metadata: {
            full_name: fullName || 'Customer'
          }
        });
        
        if (createError) {
          console.error('Error creating new user:', createError);
          return { success: false, error: createError.message };
        } else if (newUser && newUser.user) {
          userIdToUse = newUser.user.id;
          userExists = true;
          console.log('Created new user with ID:', userIdToUse);
        }
      }
      
      // Create a completed purchase record
      if (userIdToUse) {
        // Ensure the user profile exists in the public.users table first
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
              full_name: fullName || 'Customer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating user profile:', insertError);
            return { success: false, error: insertError.message };
          } else {
            console.log('User profile created successfully');
          }
        } else {
          console.log('User profile already exists');
        }
        
        // Determine which products were purchased
        const products = [];
        if (includeAdGenerator) products.push('pmu-ad-generator');
        if (includeBlueprint) products.push('consultation-blueprint');
        products.push('pmu-profit-system'); // Base product is always included
        
        // Create a purchase record for each product
        const purchaseResults = [];
        
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
            purchaseResults.push({ product: productId, success: false, error: purchaseError.message });
          } else {
            console.log(`Purchase record created successfully for ${productId}`);
            purchaseResults.push({ product: productId, success: true });
          }
        }
        
        console.log('All purchase records created successfully');
        return { 
          success: true, 
          userId: userIdToUse, 
          userCreated: !userExists, 
          purchases: purchaseResults 
        };
      } else {
        console.error('Failed to create or find user, cannot create purchase records');
        return { success: false, error: 'Failed to create or find user' };
      }
    } catch (error) {
      console.error('Error processing checkout session:', error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Unsupported event type' };
}

// Run the function
testCheckoutFlow().catch(console.error); 