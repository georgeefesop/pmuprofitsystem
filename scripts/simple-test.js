console.log('Simple test script is running');
console.log('Current working directory:', process.cwd());
console.log('Environment variables:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));

try {
  // Try to require dotenv
  require('dotenv').config({ path: '.env.local' });
  console.log('Dotenv loaded successfully');
  
  // Check if Supabase environment variables are loaded
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Try to require Supabase
  const { createClient } = require('@supabase/supabase-js');
  console.log('Supabase client imported successfully');
  
} catch (error) {
  console.error('Error in simple test:', error);
} 