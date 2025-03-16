/**
 * Script to create the verified_sessions table in Supabase
 * 
 * Usage:
 * 1. Make sure you have the required environment variables set:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 2. Run the script with: node scripts/create-verified-sessions-table.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if available
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    });
    console.log('Loaded environment variables from .env.local');
  }
} catch (error) {
  console.error('Error loading environment variables:', error);
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL script
const sqlPath = path.resolve(__dirname, 'create-verified-sessions-table.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function createTable() {
  try {
    console.log('Creating verified_sessions table...');
    
    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.error('The exec_sql function does not exist in your Supabase project.');
        console.error('You need to create this function first or run the SQL directly in the Supabase SQL editor.');
        console.error('SQL script has been saved to:', sqlPath);
      } else {
        console.error('Error creating table:', error);
      }
      process.exit(1);
    }
    
    console.log('Table created successfully!');
    
    // Verify the table exists
    const { data, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'verified_sessions')
      .single();
      
    if (verifyError) {
      console.error('Error verifying table creation:', verifyError);
      process.exit(1);
    }
    
    if (data) {
      console.log('Verified table exists:', data.table_name);
    } else {
      console.error('Table verification failed: table does not exist');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createTable(); 