/**
 * Script to run database updates
 * 
 * Usage:
 * 1. Make sure you have the required environment variables set:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 2. Run the script with: node scripts/run-database-updates.js
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

// List of SQL scripts to run
const scripts = [
  'create-exec-sql-function.sql',
  'create-verified-sessions-table.sql',
  'add-entitlements-created-column.sql'
];

async function runScripts() {
  // First, create the exec_sql function directly
  try {
    console.log('Creating exec_sql function...');
    const execSqlPath = path.resolve(__dirname, 'create-exec-sql-function.sql');
    const execSqlContent = fs.readFileSync(execSqlPath, 'utf8');
    
    // Execute the SQL directly
    const { error: execSqlError } = await supabase.rpc('exec_sql', { sql: execSqlContent });
    
    if (execSqlError && !execSqlError.message.includes('already exists')) {
      console.error('Error creating exec_sql function:', execSqlError);
      // Continue anyway, as we'll try to use it for the other scripts
    } else {
      console.log('exec_sql function created or already exists');
    }
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    // Continue anyway
  }
  
  // Run each script
  for (const scriptName of scripts) {
    try {
      console.log(`Running script: ${scriptName}...`);
      const scriptPath = path.resolve(__dirname, scriptName);
      
      if (!fs.existsSync(scriptPath)) {
        console.error(`Script not found: ${scriptPath}`);
        continue;
      }
      
      const sqlContent = fs.readFileSync(scriptPath, 'utf8');
      
      // Try to use the exec_sql function
      const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
      
      if (error) {
        console.error(`Error running script ${scriptName}:`, error);
        
        // If the error is that the function doesn't exist, try running the SQL directly
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log(`Trying to run ${scriptName} directly through SQL editor...`);
          console.log(`Please run the following SQL in the Supabase SQL editor:`);
          console.log('---');
          console.log(sqlContent);
          console.log('---');
        }
      } else {
        console.log(`Script ${scriptName} executed successfully`);
      }
    } catch (error) {
      console.error(`Error running script ${scriptName}:`, error);
    }
  }
  
  console.log('All scripts processed');
}

runScripts(); 