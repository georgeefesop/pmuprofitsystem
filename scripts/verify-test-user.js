const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTestUser() {
  try {
    // Get the test user ID from command line arguments
    const testUserId = process.argv[2];
    
    if (!testUserId) {
      console.error('Please provide a test user ID as a command line argument');
      console.error('Usage: node scripts/verify-test-user.js <test-user-id>');
      return;
    }
    
    console.log(`Verifying test user with ID: ${testUserId}`);
    
    // Get the test user from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(testUserId);
    
    if (userError) {
      console.error('Error getting test user:', userError);
      return;
    }
    
    if (!userData.user) {
      console.error('Test user not found in auth.users');
      return;
    }
    
    console.log('Test user found in auth.users:', userData.user.email);
    
    // Get the test user from public.users
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (profileError) {
      console.error('Error getting test user profile:', profileError);
    } else if (profileData) {
      console.log('Test user profile found in public.users:', profileData);
    } else {
      console.log('Test user profile not found in public.users');
    }
    
    // Get the test user's purchases
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', testUserId);
    
    if (purchasesError) {
      console.error('Error getting test user purchases:', purchasesError);
    } else if (purchasesData && purchasesData.length > 0) {
      console.log(`Found ${purchasesData.length} purchases for test user:`);
      purchasesData.forEach((purchase, index) => {
        console.log(`Purchase ${index + 1}:`, purchase);
      });
    } else {
      console.log('No purchases found for test user');
    }
    
  } catch (error) {
    console.error('Error verifying test user:', error);
  }
}

verifyTestUser(); 