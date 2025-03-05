require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTestPurchase() {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Generate a unique email with timestamp
    const testEmail = `test-user-${Date.now()}@example.com`;
    
    console.log(`Creating test user with email: ${testEmail}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'Password123!',
      email_confirm: true
    });
    
    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }
    
    console.log('User created successfully:', userData.user.id);
    
    // Create a purchase record for the user
    console.log('Creating purchase record...');
    
    // Check the schema of the purchases table
    console.log('Checking purchases table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('purchases')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.error('Error checking purchases table schema:', schemaError);
    } else {
      console.log('Purchases table schema:', schemaData.length > 0 ? Object.keys(schemaData[0]) : 'No records found');
    }
    
    // Create a purchase record based on the actual schema
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userData.user.id,
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
    
    // Check if the purchase record exists
    console.log('Checking if purchase record exists...');
    const { data: purchaseCheckData, error: purchaseCheckError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userData.user.id);
      
    if (purchaseCheckError) {
      console.error('Error checking purchase record:', purchaseCheckError);
    } else {
      console.log('Purchase records for user:', purchaseCheckData);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

createTestPurchase(); 