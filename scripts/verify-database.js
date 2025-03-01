const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabase() {
  try {
    console.log('Verifying database setup...');
    
    // Check if tables exist
    console.log('\nChecking tables:');
    
    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (usersError) {
      console.error('Error checking users table:', usersError.message);
    } else {
      console.log('✅ Users table exists');
    }
    
    // Check purchases table
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .limit(1);
      
    if (purchasesError) {
      console.error('Error checking purchases table:', purchasesError.message);
    } else {
      console.log('✅ Purchases table exists');
    }
    
    // Check email_logs table
    const { data: emailLogsData, error: emailLogsError } = await supabase
      .from('email_logs')
      .select('*')
      .limit(1);
      
    if (emailLogsError) {
      console.error('Error checking email_logs table:', emailLogsError.message);
    } else {
      console.log('✅ Email logs table exists');
    }
    
    // Check RLS policies
    console.log('\nNote: RLS policies cannot be directly verified through the JavaScript client.');
    console.log('Please check the RLS policies in the Supabase dashboard under Authentication > Policies.');
    
    console.log('\nVerification complete. If any tables are missing, please run the SQL script in the Supabase SQL Editor.');
    
  } catch (error) {
    console.error('Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase(); 