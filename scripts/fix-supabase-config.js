const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSupabaseConfigTable() {
  console.log('Checking for _supabase_config table...');
  
  try {
    // Check if the table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('_supabase_config')
      .select('*')
      .limit(1);
    
    if (tableCheckError) {
      console.log('_supabase_config table does not exist. Creating it...');
      
      try {
        // Create the table using SQL
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public._supabase_config (
              id SERIAL PRIMARY KEY,
              key TEXT NOT NULL UNIQUE,
              value JSONB NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Add default auth settings
            INSERT INTO public._supabase_config (key, value)
            VALUES ('auth', '{"enable_signup": true, "enable_email_signup": true, "enable_email_autoconfirm": true}')
            ON CONFLICT (key) DO NOTHING;
          `
        });
        
        if (sqlError) {
          console.error('Error creating _supabase_config table:', sqlError);
          
          // Provide instructions for manual fix
          console.log('\nManual steps to fix this issue:');
          console.log('1. Go to the Supabase dashboard');
          console.log('2. Open the SQL editor');
          console.log('3. Run the following SQL:');
          console.log(`
            CREATE TABLE IF NOT EXISTS public._supabase_config (
              id SERIAL PRIMARY KEY,
              key TEXT NOT NULL UNIQUE,
              value JSONB NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Add default auth settings
            INSERT INTO public._supabase_config (key, value)
            VALUES ('auth', '{"enable_signup": true, "enable_email_signup": true, "enable_email_autoconfirm": true}')
            ON CONFLICT (key) DO NOTHING;
          `);
          return false;
        }
      } catch (error) {
        console.log('Error executing RPC function. This is expected if the function does not exist.');
        console.log('Please run the SQL manually in the Supabase dashboard.');
        return false;
      }
      
      console.log('_supabase_config table created successfully!');
      return true;
    } else {
      console.log('_supabase_config table already exists.');
      return true;
    }
  } catch (error) {
    console.error('Error checking for _supabase_config table:', error);
    
    // Provide instructions for manual fix
    console.log('\nManual steps to fix this issue:');
    console.log('1. Go to the Supabase dashboard');
    console.log('2. Open the SQL editor');
    console.log('3. Run the following SQL:');
    console.log(`
      CREATE TABLE IF NOT EXISTS public._supabase_config (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Add default auth settings
      INSERT INTO public._supabase_config (key, value)
      VALUES ('auth', '{"enable_signup": true, "enable_email_signup": true, "enable_email_autoconfirm": true}')
      ON CONFLICT (key) DO NOTHING;
    `);
    return false;
  }
}

async function main() {
  try {
    const success = await createSupabaseConfigTable();
    
    if (success) {
      console.log('Supabase configuration fixed successfully!');
    } else {
      console.log('Failed to fix Supabase configuration automatically. Please follow the manual steps above.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 