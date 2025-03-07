/**
 * Database Setup Script
 * 
 * This script executes the SQL commands in setup-database-schema.sql
 * to set up the database schema for the PMU Profit System.
 * 
 * Usage: node scripts/setup-database.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client with service role key (required for schema changes)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { error };
  }
}

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'setup-database-schema.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the SQL commands by semicolon to execute them separately
    // This is a simple approach and might not work for all SQL commands
    // For more complex scripts, consider using a proper SQL parser
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    console.log(`Found ${commands.length} SQL commands to execute`);

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`Executing command ${i + 1}/${commands.length}...`);
      
      try {
        // Execute SQL directly
        const result = await supabase.rpc('exec_sql', { sql_query: command + ';' });
        
        if (result.error) {
          console.error(`Error executing command ${i + 1}:`, result.error);
        } else {
          console.log(`Command ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Exception executing command ${i + 1}:`, err);
      }
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 