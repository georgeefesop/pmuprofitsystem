require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function testWebhookDirect() {
  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
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
    
    // Create a test user in Supabase
    console.log('\nStep 1: Creating test user in Supabase...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName
      }
    });
    
    if (userError) {
      console.error('Error creating test user:', userError);
      process.exit(1);
    }
    
    const userId = userData.user.id;
    console.log(`Test user created with ID: ${userId}`);
    
    // Create a test checkout session directly with Stripe
    console.log('\nStep 2: Creating test checkout session with Stripe...');
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout`,
      customer_email: testEmail,
      metadata: {
        email: testEmail,
        fullName: testName,
        userId: userId,
        includeAdGenerator: 'true',
        includeBlueprint: 'true'
      }
    });
    
    console.log(`Test checkout session created with ID: ${session.id}`);
    
    // Simulate a successful checkout by creating a checkout.session.completed event
    console.log('\nStep 3: Simulating checkout.session.completed event...');
    
    // Process the webhook event manually
    const webhookResult = await processWebhookEvent({
      type: 'checkout.session.completed',
      data: {
        object: session
      }
    }, supabase);
    
    console.log('Webhook processing result:', webhookResult);
    
    // Check if purchases were created
    console.log('\nStep 4: Checking if purchases were created...');
    
    // Wait a moment for the database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId);
    
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      process.exit(1);
    }
    
    console.log(`Found ${purchases.length} purchases for the test user`);
    
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
    
    // Test login with the created user
    console.log('\nStep 5: Testing login with the created user...');
    
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
    
    console.log('\nTest completed successfully!');
    
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
testWebhookDirect().catch(console.error); 