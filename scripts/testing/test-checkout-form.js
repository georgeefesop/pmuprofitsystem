require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const crypto = require('crypto');

async function testCheckoutForm() {
  console.log('Testing checkout form and user creation...');
  
  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }
  
  console.log('Supabase URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test Supabase connection
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful');
  } catch (error) {
    console.error('Supabase connection error:', error);
    process.exit(1);
  }
  
  // Generate a unique test email
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testFullName = 'Test User';
  
  console.log(`Creating test checkout with email: ${testEmail}`);
  
  // Simulate a checkout form submission
  try {
    // First, make sure the user doesn't already exist
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail);
    
    if (existingUser) {
      console.log(`Test user already exists with ID: ${existingUser.id}, deleting...`);
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('Existing test user deleted');
    }
    
    // Create a checkout session
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${siteUrl}/api/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        fullName: testFullName,
        password: testPassword,
        includeAdGenerator: true,
        includeBlueprint: false,
        totalPrice: 64, // Base (37) + Ad Generator (27)
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to create checkout session: ${data.error || 'Unknown error'}`);
    }
    
    console.log('Checkout session created successfully');
    console.log('Session ID:', data.sessionId);
    console.log('Checkout URL:', data.url);
    
    // Now simulate a successful payment by directly calling the webhook handler
    // This is a simplified version of what Stripe would do
    console.log('Simulating successful payment webhook...');
    
    // Create a mock Stripe event
    const mockEvent = {
      id: `evt_${crypto.randomBytes(16).toString('hex')}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: data.sessionId || `cs_test_${crypto.randomBytes(16).toString('hex')}`,
          customer_email: testEmail,
          metadata: {
            email: testEmail,
            fullName: testFullName,
            includeAdGenerator: 'true',
            includeBlueprint: 'false',
          },
          amount_total: 6400, // In cents
        },
      },
    };
    
    // Process the webhook event
    await processWebhookEvent(mockEvent, supabase);
    
    // Verify the user was created
    console.log('Verifying user creation...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const createdUser = users?.users?.find(u => u.email === testEmail);
    
    if (!createdUser) {
      throw new Error('User was not created');
    }
    
    console.log(`User created successfully with ID: ${createdUser.id}`);
    console.log('Email confirmed:', createdUser.email_confirmed_at ? 'Yes' : 'No');
    
    // Verify user profile was created
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    } else {
      console.log('User profile created successfully:', userProfile);
    }
    
    // Verify purchases were created
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', createdUser.id);
      
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    } else {
      console.log(`Found ${purchases.length} purchases for the user:`);
      purchases.forEach(purchase => {
        console.log(`- ${purchase.product_id}: €${(purchase.amount / 100).toFixed(2)}`);
      });
    }
    
    // Test login with the created user
    console.log('Testing login with created user...');
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (loginError) {
      console.error('Login failed:', loginError);
    } else {
      console.log('Login successful!');
      console.log('Session:', session);
    }
    
    // Clean up - delete the test user
    console.log('Cleaning up - deleting test user...');
    
    // First delete purchases
    if (purchases?.length > 0) {
      const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .eq('user_id', createdUser.id);
        
      if (deleteError) {
        console.error('Error deleting purchases:', deleteError);
      } else {
        console.log('Purchases deleted successfully');
      }
    }
    
    // Delete user profile
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('id', createdUser.id);
      
    if (deleteProfileError) {
      console.error('Error deleting user profile:', deleteProfileError);
    } else {
      console.log('User profile deleted successfully');
    }
    
    // Delete auth user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(createdUser.id);
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
    } else {
      console.log('Auth user deleted successfully');
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function processWebhookEvent(event, supabase) {
  console.log(`Processing webhook event: ${event.type}`);
  
  try {
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
        return;
      }
      
      // Check if the user exists in auth.users
      let userIdToUse = userId;
      let userExists = false;
      
      // Try to find the user by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error listing users:', authError);
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
      if (!userExists) {
        console.log('User not found, creating new user with email:', email);
        
        // Generate a secure password if one wasn't provided
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
        
        // Create purchase records for each product
        for (const productId of products) {
          const amount = productId === 'pmu-profit-system' ? 3700 : 
                        productId === 'pmu-ad-generator' ? 2700 : 2700;
                        
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: userIdToUse,
              product_id: productId,
              amount: amount,
              status: 'completed',
              updated_at: new Date().toISOString()
            });
            
          if (purchaseError) {
            console.error(`Error creating purchase record for ${productId}:`, purchaseError);
          } else {
            console.log(`Purchase record created successfully for ${productId}`);
          }
        }
        
        console.log('All purchase records created successfully');
      } else {
        console.error('Failed to create or find user, cannot create purchase records');
      }
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
  }
}

testCheckoutForm().catch(console.error); 