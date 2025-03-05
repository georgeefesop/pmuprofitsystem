require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'defined' : 'undefined');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'defined' : 'undefined');
  process.exit(1);
}

// Get the email to check from command line arguments
const emailToCheck = process.argv[2];

if (!emailToCheck) {
  console.error('Please provide an email to check as a command line argument');
  console.log('Usage: node scripts/verify-user-creation.js <email>');
  process.exit(1);
}

/**
 * Verify if a user with the specified email exists in the database
 */
async function verifyUserCreation(email) {
  try {
    console.log(`Verifying user creation for email: ${email}`);
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Create a Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Step 1: Check if the user exists in auth.users
    console.log('Checking if user exists in auth.users...');
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      process.exit(1);
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (user) {
      console.log('User found in auth.users:');
      console.log('  User ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      console.log('  Created at:', user.created_at);
      console.log('  Last sign in:', user.last_sign_in_at || 'Never');
      
      // Step 2: Check if the user profile exists in public.users
      console.log('\nChecking if user profile exists in public.users...');
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
        console.log('  Email:', profileData.email);
        console.log('  Created at:', profileData.created_at);
        console.log('  Updated at:', profileData.updated_at);
      } else {
        console.log('User profile not found in public.users');
      }
      
      // Step 3: Check if the user has any purchases
      console.log('\nChecking if user has any purchases...');
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id);
      
      if (purchasesError) {
        console.error('Error fetching user purchases:', purchasesError);
      } else if (purchasesData && purchasesData.length > 0) {
        console.log(`Found ${purchasesData.length} purchases for the user:`);
        purchasesData.forEach((purchase, index) => {
          console.log(`\nPurchase ${index + 1}:`);
          console.log('  Purchase ID:', purchase.id);
          console.log('  Product ID:', purchase.product_id);
          console.log('  Amount:', purchase.amount);
          console.log('  Status:', purchase.status);
          console.log('  Created at:', purchase.created_at);
          console.log('  Updated at:', purchase.updated_at);
        });
      } else {
        console.log('No purchases found for the user');
      }
      
      // Step 4: Try to sign in with the user
      console.log('\nTesting if user can sign in...');
      console.log('Note: This test will fail as we do not have the user\'s password');
      console.log('This is just to verify the auth system is working');
      
      const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const { error: signInError } = await regularSupabase.auth.signInWithPassword({
        email: email,
        password: 'this-will-fail-as-we-dont-know-the-password'
      });
      
      if (signInError) {
        console.log('Sign-in failed as expected (we don\'t have the password)');
        console.log('Error message:', signInError.message);
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('This is the expected error for a valid user with incorrect password');
          console.log('This confirms the user exists in the auth system');
        }
      } else {
        console.log('WARNING: Sign-in succeeded unexpectedly!');
      }
      
    } else {
      console.log(`No user found with email: ${email}`);
    }
    
    console.log('\nVerification completed');
  } catch (error) {
    console.error('Unexpected error during verification:', error);
    process.exit(1);
  }
}

// Run the verification
verifyUserCreation(emailToCheck); 