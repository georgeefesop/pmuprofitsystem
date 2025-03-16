const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://duxqazuhozfejdocxiyl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHFhenVob3pmZWpkb2N4aXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY2MjA1NzcsImV4cCI6MjAyMjE5NjU3N30.Nh1qdoK3yFLhYJr5xR7PVzZh0aeq-JyYQP9zvwJW-QE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function queryUser(email) {
  try {
    // Query the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    console.log('User:', user);
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // Query user's purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id);
    
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    } else {
      console.log('Purchases:', purchases);
    }
    
    // Query user's entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', user.id);
    
    if (entitlementsError) {
      console.error('Error fetching entitlements:', entitlementsError);
    } else {
      console.log('Entitlements:', entitlements);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2] || 'george.efesopk@gmail.com';
queryUser(email); 