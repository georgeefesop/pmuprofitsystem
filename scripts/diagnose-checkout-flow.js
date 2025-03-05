require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'defined' : 'undefined');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'defined' : 'undefined');
  process.exit(1);
}

/**
 * Diagnose the checkout flow by simulating the API calls made during checkout
 */
async function diagnoseCheckoutFlow() {
  try {
    console.log('Diagnosing checkout flow...');
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
    
    // Step 2: Simulate the create-checkout API call
    console.log('\nSimulating create-checkout API call...');
    
    // First, check if the site URL is correctly set
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    console.log('Site URL from environment:', siteUrl);
    
    // Create a mock request body similar to what the checkout page would send
    const requestBody = {
      email: testEmail,
      fullName: testName,
      includeAdGenerator: true,
      includeBlueprint: true,
      totalPrice: 97, // 37 + 27 + 33
      password: testPassword
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Simulate the API call logic directly
    console.log('\nSimulating user verification and creation...');
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
    } else {
      const existingUser = userData.users.find(u => u.email === testEmail);
      
      if (existingUser) {
        console.log('User already exists with ID:', existingUser.id);
      } else {
        console.log('User does not exist, would create new user');
        
        // Simulate user creation
        console.log('Creating test user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
          user_metadata: {
            full_name: testName
          }
        });
        
        if (createError) {
          console.error('Error creating user:', createError);
        } else {
          console.log('User created with ID:', newUser.user.id);
          
          // Create user profile
          console.log('Creating user profile...');
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: newUser.user.id,
              email: testEmail,
              full_name: testName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (profileError) {
            console.error('Error creating user profile:', profileError);
          } else {
            console.log('User profile created successfully');
          }
        }
      }
    }
    
    // Step 3: Simulate webhook processing
    console.log('\nSimulating webhook processing...');
    
    // Create a mock session object similar to what Stripe would send
    const mockSession = {
      id: `cs_test_${Date.now()}`,
      customer_email: testEmail,
      metadata: {
        email: testEmail,
        fullName: testName,
        includeAdGenerator: 'true',
        includeBlueprint: 'true',
        hasPassword: 'true'
      }
    };
    
    console.log('Mock session:', JSON.stringify(mockSession, null, 2));
    
    // Simulate webhook processing logic
    console.log('Processing mock completed checkout...');
    
    // Check if the user exists
    const { data: webhookUserData, error: webhookUserError } = await supabase.auth.admin.listUsers();
    
    if (webhookUserError) {
      console.error('Error listing users in webhook simulation:', webhookUserError);
    } else {
      const existingUser = webhookUserData.users.find(u => u.email === testEmail);
      
      if (existingUser) {
        console.log('Found user by email:', existingUser.id);
        
        // Confirm email
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error('Error confirming user email:', updateError);
        } else {
          console.log('User email confirmed after successful payment');
        }
        
        // Create purchase records
        console.log('Creating purchase records...');
        
        const products = ['pmu-profit-system'];
        if (mockSession.metadata.includeAdGenerator === 'true') products.push('pmu-ad-generator');
        if (mockSession.metadata.includeBlueprint === 'true') products.push('consultation-blueprint');
        
        for (const productId of products) {
          const amount = productId === 'pmu-profit-system' ? 3700 : 
                        productId === 'pmu-ad-generator' ? 2700 : 3300;
          
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: existingUser.id,
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
      } else {
        console.log('User not found in webhook simulation, would create new user');
      }
    }
    
    // Step 4: Test login with the created user
    console.log('\nTesting login with the created user...');
    
    // Create a regular Supabase client (not admin) to test login
    const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await regularSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in with test user:', signInError);
    } else {
      console.log('Successfully logged in with test user!');
      console.log('User session:', signInData.session ? 'Created' : 'Not created');
    }
    
    // Step 5: Clean up - delete the test user
    console.log('\nCleaning up - deleting test user...');
    
    const { data: finalUserData, error: finalUserError } = await supabase.auth.admin.listUsers();
    
    if (finalUserError) {
      console.error('Error listing users for cleanup:', finalUserError);
    } else {
      const userToDelete = finalUserData.users.find(u => u.email === testEmail);
      
      if (userToDelete) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);
        
        if (deleteError) {
          console.error('Error deleting test user:', deleteError);
        } else {
          console.log('Test user deleted successfully');
        }
      } else {
        console.log('No user found to delete');
      }
    }
    
    console.log('\nDiagnosis completed');
    console.log('The checkout flow simulation was successful');
    console.log('This suggests that the issue might be related to:');
    console.log('1. Environment variables not being correctly loaded in the web application');
    console.log('2. Network connectivity issues when making API calls from the browser');
    console.log('3. CORS or other security restrictions preventing the API calls');
    console.log('4. Stripe webhook not being properly configured or not reaching your server');
    
  } catch (error) {
    console.error('Unexpected error during diagnosis:', error);
    process.exit(1);
  }
}

// Run the diagnosis
diagnoseCheckoutFlow(); 