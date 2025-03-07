/**
 * Script to set up a database webhook for purchases
 * 
 * This script runs the SQL to create a database webhook that will trigger
 * when a new purchase is inserted. The webhook will call our API endpoint
 * to create entitlements.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Read the SQL file
const sqlFilePath = path.join(__dirname, '..', 'sql', 'setup-database-webhook.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

async function setupDatabaseWebhook() {
  console.log('Setting up database webhook for purchases...');
  
  try {
    // Execute the SQL directly
    const { error } = await supabase.from('_sql').select('*').execute(sql);
    
    if (error) {
      console.error('Error setting up database webhook:', error);
      process.exit(1);
    }
    
    console.log('Database webhook set up successfully!');
    console.log('Webhook will trigger when a new purchase is inserted');
    console.log('It will call the API endpoint to create entitlements');
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
}

// Run the script
setupDatabaseWebhook(); 