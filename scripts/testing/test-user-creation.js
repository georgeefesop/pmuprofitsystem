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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing Stripe secret key');
  process.exit(1);
}

/**
 * Test user creation and login without email confirmation
 */
async function testUserCreation() {
  try {
    console.log('Starting user creation and login test...');
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Create a Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Generate a test email and password
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    const testName = 'Test User';
    
    console.log(`Test user: ${testEmail} with password: ${testPassword}`);
    
    // Step 1: Create a test user with email_confirm set to true
    console.log('Creating test user...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Set email as confirmed
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
    
    // Step 2: Create a test purchase for the user
    console.log('Creating test purchase...');
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: 'pmu-profit-system',
        amount: 3700,
        status: 'completed'
      });
      
    if (purchaseError) {
      console.error('Error creating test purchase:', purchaseError);
    } else {
      console.log('Test purchase created successfully');
    }
    
    // Step 3: Verify the user can log in without email confirmation
    console.log('Testing login with the created user...');
    
    // Create a regular Supabase client (not admin) to test login
    const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await regularSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in with test user:', signInError);
      process.exit(1);
    }
    
    console.log('Successfully logged in with test user!');
    console.log('User session:', signInData.session ? 'Created' : 'Not created');
    
    // Step 4: Verify the user's email confirmation status
    const { data: userInfo, error: userInfoError } = await supabase.auth.admin.getUserById(userId);
    
    if (userInfoError) {
      console.error('Error getting user info:', userInfoError);
    } else {
      console.log('User email confirmation status:', userInfo.user.email_confirmed_at ? 'Confirmed' : 'Not confirmed');
    }
    
    // Step 5: Clean up - delete the test user
    console.log('Cleaning up - deleting test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Error deleting test user:', deleteError);
    } else {
      console.log('Test user deleted successfully');
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  }
}

// Run the test
testUserCreation(); 