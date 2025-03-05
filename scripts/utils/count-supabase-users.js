require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function countSupabaseUsers() {
  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Error: Supabase URL or service role key is missing in .env.local');
      process.exit(1);
    }
    
    console.log('Connecting to Supabase at:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Count users in auth.users table
    console.log('Counting users in auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      process.exit(1);
    }
    
    console.log(`Total users in auth.users: ${authUsers.users.length}`);
    
    // Count users in public.users table
    console.log('Counting users in public.users table...');
    const { count: publicUsersCount, error: publicError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (publicError) {
      console.error('Error fetching public users:', publicError);
    } else {
      console.log(`Total users in public.users: ${publicUsersCount}`);
    }
    
    // List all users with their details
    console.log('\nUser details:');
    console.log('-------------');
    
    authUsers.users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created at: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`  Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log('-------------');
    });
    
    // Check for purchases
    console.log('\nChecking for purchases...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*');
    
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    } else {
      console.log(`Total purchases: ${purchases.length}`);
      
      if (purchases.length > 0) {
        console.log('\nPurchase details:');
        console.log('----------------');
        
        purchases.forEach((purchase, index) => {
          console.log(`Purchase ${index + 1}:`);
          console.log(`  User ID: ${purchase.user_id}`);
          console.log(`  Product: ${purchase.product_id}`);
          console.log(`  Amount: ${purchase.amount}`);
          console.log(`  Status: ${purchase.status}`);
          console.log(`  Created at: ${new Date(purchase.created_at).toLocaleString()}`);
          console.log('----------------');
        });
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the function
countSupabaseUsers().catch(console.error); 