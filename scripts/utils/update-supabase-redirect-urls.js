require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function updateSupabaseRedirectUrls() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Error: Required environment variables are missing in .env.local');
      console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
      process.exit(1);
    }
    
    console.log('Connecting to Supabase at:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test user creation to verify redirect URLs
    console.log('\nTesting user creation to verify redirect URLs...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: `Password${Date.now()}!`,
      email_confirm: true
    });
    
    if (userError) {
      console.error('Error creating test user:', userError.message);
      
      if (userError.message.includes('redirect_url')) {
        console.log('\nThe error indicates an issue with redirect URLs in Supabase.');
        console.log('Recommendation: Add the following URLs to your Supabase redirect URLs:');
        console.log(`1. ${siteUrl}`);
        console.log(`2. ${siteUrl}/auth/callback`);
        console.log(`3. ${siteUrl}/login`);
        console.log(`4. ${siteUrl}/success`);
        console.log('\nYou can add these URLs in the Supabase dashboard:');
        console.log('1. Go to Authentication > URL Configuration');
        console.log('2. Add the URLs to the "Redirect URLs" section');
        console.log('3. Click "Save"');
      }
      
      process.exit(1);
    }
    
    console.log('Test user created successfully');
    console.log('Redirect URLs are configured correctly');
    
    // Clean up the test user
    if (userData && userData.user) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.user.id);
      if (deleteError) {
        console.error('Error deleting test user:', deleteError.message);
      } else {
        console.log('Test user deleted successfully');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the function
updateSupabaseRedirectUrls().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
}); 