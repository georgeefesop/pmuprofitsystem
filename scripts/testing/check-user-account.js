const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUserAccount() {
  // Get email from command line arguments
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address as an argument.');
    console.error('Usage: node scripts/check-user-account.js user@example.com');
    process.exit(1);
  }
  
  console.log(`Checking account for email: ${email}`);
  
  // Initialize Supabase client with service role key for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase URL or service role key is missing in environment variables.');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // First check if user exists in public.users
    console.log('\nChecking public.users table...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (publicError) {
      console.error('Error fetching from public.users:', publicError.message);
    } else if (!publicUsers || publicUsers.length === 0) {
      console.log('❌ User not found in public.users table.');
    } else {
      const publicUser = publicUsers[0];
      console.log('✅ User found in public.users table:');
      console.log('  ID:', publicUser.id);
      console.log('  Email:', publicUser.email);
      console.log('  Full name:', publicUser.full_name || 'Not set');
      console.log('  Created at:', new Date(publicUser.created_at).toLocaleString());
      console.log('  Updated at:', new Date(publicUser.updated_at).toLocaleString());
      
      // Now check auth status using RPC
      console.log('\nChecking auth status...');
      const { data: authStatus, error: authError } = await supabase.rpc('check_user_auth_status', { 
        user_email: email 
      });
      
      if (authError) {
        console.error('Error checking auth status:', authError.message);
        console.log('\nAttempting to check auth status directly...');
        
        // Alternative approach: try to list all auth users (requires admin privileges)
        const { data: authUsers, error: listError } = await supabase
          .from('auth.users')
          .select('*')
          .eq('email', email);
        
        if (listError) {
          console.error('Error accessing auth.users:', listError.message);
          console.log('Note: Direct access to auth.users may be restricted.');
        } else if (!authUsers || authUsers.length === 0) {
          console.log('❌ User not found in auth.users table.');
        } else {
          const authUser = authUsers[0];
          console.log('✅ User found in auth.users table:');
          console.log('  Email confirmed:', authUser.email_confirmed_at ? '✅ Yes' : '❌ No');
          console.log('  Created at:', new Date(authUser.created_at).toLocaleString());
          console.log('  Last sign in:', authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never');
          
          if (authUser.banned_until) {
            console.log('  ❌ User is banned until:', new Date(authUser.banned_until).toLocaleString());
          }
        }
      } else {
        console.log('Auth status:', authStatus);
      }
      
      // Check if user has any purchases
      console.log('\nChecking purchases table...');
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', publicUser.id);
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError.message);
      } else if (!purchases || purchases.length === 0) {
        console.log('ℹ️ No purchases found for this user.');
      } else {
        console.log(`✅ Found ${purchases.length} purchase(s) for this user:`);
        purchases.forEach((purchase, index) => {
          console.log(`  Purchase ${index + 1}:`);
          console.log('    ID:', purchase.id);
          console.log('    Product:', purchase.product_id);
          console.log('    Amount:', purchase.amount);
          console.log('    Status:', purchase.status);
          console.log('    Created at:', new Date(purchase.created_at).toLocaleString());
        });
      }
    }
    
    console.log('\nPossible issues that could prevent login:');
    console.log('1. Email not confirmed (verification email not clicked)');
    console.log('2. User is banned or disabled in Supabase');
    console.log('3. Password was not set correctly during registration');
    console.log('4. User profile missing in public.users table');
    console.log('5. Incorrect email or password being entered during login attempt');
    
    // Let's create a function to help fix common issues
    console.log('\nTo fix common issues, you can run:');
    console.log(`node scripts/fix-user-account.js ${email}`);
    
  } catch (error) {
    console.error('Error during account check:', error.message);
    process.exit(1);
  }
}

// Execute the function
checkUserAccount(); 