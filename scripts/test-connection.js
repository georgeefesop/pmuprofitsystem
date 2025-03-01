const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Simple query to test connection
    const { data, error } = await supabase.from('_test').select('*').limit(1).maybeSingle();
    
    if (error) {
      if (error.code === 'PGRST301') {
        console.log('✅ Connected to Supabase successfully!');
        console.log('Note: The _test table does not exist, but the connection is working.');
      } else {
        console.error('❌ Error connecting to Supabase:', error.message);
      }
    } else {
      console.log('✅ Connected to Supabase successfully!');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('❌ Error testing connection:', error.message);
  }
}

testConnection(); 