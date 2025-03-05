require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'defined' : 'undefined');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'defined' : 'undefined');
  process.exit(1);
}

/**
 * Create a manual user and purchase
 */
async function createManualUser() {
  try {
    const email = 'george.efesop@gmail.com';
    const password = 'Test123456!';
    const fullName = 'George Efesop';
    
    console.log(`Creating manual user with email: ${email}`);
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Create a Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Check if user already exists
    console.log('Checking if user already exists...');
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      process.exit(1);
    }
    
    const existingUser = userData.users.find(u => u.email === email);
    
    let userId;
    
    if (existingUser) {
      console.log('User already exists with ID:', existingUser.id);
      userId = existingUser.id;
      
      // Update the user to ensure email is confirmed
      console.log('Updating user to ensure email is confirmed...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error('Error updating user:', updateError);
      } else {
        console.log('User updated successfully');
      }
    } else {
      // Create the user
      console.log('Creating new user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        process.exit(1);
      }
      
      userId = newUser.user.id;
      console.log('User created with ID:', userId);
    }
    
    // Check if user profile exists
    console.log('Checking if user profile exists...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking user profile:', profileError);
    }
    
    if (!profileData) {
      // Create user profile
      console.log('Creating user profile...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating user profile:', insertError);
      } else {
        console.log('User profile created successfully');
      }
    } else {
      console.log('User profile already exists');
    }
    
    // Create purchase record
    console.log('Creating purchase record...');
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: 'pmu-profit-system',
        amount: 3700,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
    } else {
      console.log('Purchase record created successfully');
    }
    
    // Verify the user can log in
    console.log('\nTesting login with the created user...');
    
    // Create a regular Supabase client (not admin) to test login
    const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await regularSupabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('Error signing in with user:', signInError);
    } else {
      console.log('Successfully logged in with user!');
      console.log('User session:', signInData.session ? 'Created' : 'Not created');
    }
    
    console.log('\nManual user creation completed');
    console.log('You can now log in with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Unexpected error during user creation:', error);
    process.exit(1);
  }
}

// Run the function
createManualUser(); 