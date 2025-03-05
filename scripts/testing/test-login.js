require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testLogin() {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    // Use the anon key for client-side authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const userEmail = 'george.efesop@gmail.com';
    const password = 'Password123!';
    
    console.log(`Attempting to sign in as ${userEmail}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });
    
    if (error) {
      console.error('Error signing in:', error);
      return;
    }
    
    console.log('Sign in successful!');
    console.log('User:', data.user);
    console.log('Session:', data.session);
    
    // Check if the user has any purchases
    console.log('Checking if user has any purchases...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', data.user.id);
      
    if (purchasesError) {
      console.error('Error checking purchases:', purchasesError);
      return;
    }
    
    if (purchases.length > 0) {
      console.log('User has purchases:', purchases);
    } else {
      console.log('User has no purchases');
    }
    
    // Sign out
    console.log('Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Error signing out:', signOutError);
    } else {
      console.log('Sign out successful!');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testLogin(); 