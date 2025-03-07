// Script to update product prices and clean up user data
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client with service role key (needed for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key is missing in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'update-prices-and-cleanup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { data, error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error(`Error executing statement: ${statement}`);
        console.error(error);
      } else {
        console.log('Statement executed successfully');
        if (data) {
          console.log('Result:', data);
        }
      }
    }
    
    console.log('All statements executed successfully');
    
    // Verify product prices
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, currency');
    
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      console.log('Updated product prices:');
      console.table(data);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 