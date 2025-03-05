require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkAndCreateUser() {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const userEmail = 'george.efesop@gmail.com';
    
    // Check if the user exists in auth.users
    console.log(`Checking if user ${userEmail} exists in auth.users...`);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth users:', authError);
      return;
    }
    
    const existingAuthUser = authUsers.users.find(user => user.email === userEmail);
    
    if (existingAuthUser) {
      console.log('User exists in auth.users:', existingAuthUser);
    } else {
      console.log('User does not exist in auth.users');
      
      // Create the user
      console.log(`Creating user ${userEmail}...`);
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: 'Password123!',
        email_confirm: true
      });
      
      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }
      
      console.log('User created successfully:', userData.user.id);
    }
    
    // Check if the user exists in public.users
    console.log(`Checking if user ${userEmail} exists in public.users...`);
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail);
      
    if (publicError) {
      console.error('Error checking public users:', publicError);
      return;
    }
    
    if (publicUsers.length > 0) {
      console.log('User exists in public.users:', publicUsers[0]);
      
      // Check if the user has any purchases
      console.log('Checking if user has any purchases...');
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', publicUsers[0].id);
        
      if (purchasesError) {
        console.error('Error checking purchases:', purchasesError);
        return;
      }
      
      if (purchases.length > 0) {
        console.log('User has purchases:', purchases);
      } else {
        console.log('User has no purchases');
        
        // Create a purchase record for the user
        console.log('Creating purchase record...');
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: publicUsers[0].id,
            product_id: 'pmu-profit-system',
            amount: 37.00,
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
          
        if (purchaseError) {
          console.error('Error creating purchase record:', purchaseError);
        } else {
          console.log('Purchase record created successfully:', purchaseData);
        }
      }
    } else {
      console.log('User does not exist in public.users');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkAndCreateUser(); 