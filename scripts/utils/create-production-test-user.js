require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createProductionTestUser() {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Generate a unique email with timestamp
    const testEmail = `test-prod-user-${Date.now()}@example.com`;
    
    console.log(`Creating production test user with email: ${testEmail}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'Password123!',
      email_confirm: true,
      app_metadata: {
        environment: 'production',
        environment_updated_at: new Date().toISOString()
      }
    });
    
    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('Production user created successfully:', data);
      
      // Check if the user exists in the public.users table
      console.log('Checking if user exists in public.users table...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id);
        
      if (userError) {
        console.error('Error checking user in public.users table:', userError);
      } else {
        console.log('User in public.users table:', userData);
      }
      
      // Verify the environment metadata
      console.log('User environment:', data.user.app_metadata?.environment || 'Not set');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

createProductionTestUser(); 