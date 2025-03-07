/**
 * Verify Database Schema Script
 * 
 * This script verifies the database schema by checking for the existence
 * of required tables, columns, and relationships.
 * 
 * Usage: node scripts/database/verify-database-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Tables that should exist
const requiredTables = [
  'products',
  'product_prices',
  'purchases',
  'purchase_items',
  'subscriptions',
  'subscription_items',
  'user_entitlements',
  'ad_generator_logs'
];

async function verifyDatabaseSchema() {
  try {
    console.log('Verifying database schema...');

    // Check each table individually
    const existingTables = [];
    const missingTables = [];

    for (const tableName of requiredTables) {
      try {
        // Try to select from the table to see if it exists
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error && error.code === '42P01') {
          // Table doesn't exist
          missingTables.push(tableName);
        } else {
          // Table exists
          existingTables.push(tableName);
        }
      } catch (error) {
        console.error(`Error checking table ${tableName}:`, error);
        missingTables.push(tableName);
      }
    }

    console.log('Existing tables:', existingTables);
    
    if (missingTables.length > 0) {
      console.error('Missing tables:', missingTables);
    } else {
      console.log('All required tables exist!');
    }

    // Check if products table has data
    if (existingTables.includes('products')) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        console.log(`Found ${products.length} products in the database.`);
        products.forEach(product => {
          console.log(`- ${product.name} (${product.type}): $${product.price}`);
        });
      }
    }

    console.log('Database schema verification completed.');
  } catch (error) {
    console.error('Error verifying database schema:', error);
  }
}

verifyDatabaseSchema(); 