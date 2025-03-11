/**
 * Script to update existing users with environment information
 * 
 * This script will:
 * 1. Connect to the Supabase database using the service role key
 * 2. Fetch all users that don't have environment information
 * 3. Intelligently determine the likely environment where each user was created
 * 4. Update them with the appropriate environment tag
 * 
 * Usage:
 * node scripts/database/update-user-environments.js [default_environment] [force]
 * 
 * Where [default_environment] is either 'local' or 'production' (defaults to 'local')
 * And [force] is either 'true' or 'false' (defaults to 'false')
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get environment from command line args or default to 'local'
const defaultEnvironment = process.argv[2] || 'local';
if (!['local', 'production'].includes(defaultEnvironment)) {
  console.error('Error: Environment must be either "local" or "production"');
  process.exit(1);
}

// Get force parameter from command line args or default to false
const force = process.argv[3] === 'true';
console.log(`Force update: ${force ? 'Yes' : 'No'}`);

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Determine the likely environment where a user was created
 * 
 * This function uses heuristics to guess the environment:
 * - Test emails (containing 'test', 'example.com', etc.) are likely from local/development
 * - Users with specific patterns in their email might be from specific environments
 * - If we can't determine, we use the default environment
 * 
 * @param {Object} user - The user object from Supabase
 * @param {string} defaultEnv - The default environment to use if we can't determine
 * @returns {string} - The determined environment ('local' or 'production')
 */
function determineUserEnvironment(user, defaultEnv) {
  const email = user.email.toLowerCase();
  
  // Test emails are likely from local/development environment
  if (email.includes('test') || 
      email.includes('example.com') || 
      email.includes('mismatch')) {
    return 'local';
  }
  
  // Real user emails are likely from production
  // This is a simplification - in reality, you'd need more sophisticated logic
  // based on your specific deployment and user registration patterns
  return 'production';
}

async function updateUserEnvironments() {
  console.log(`Updating users with intelligent environment detection (default: ${defaultEnvironment})`);
  
  try {
    // Get all users
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`Found ${users.users.length} total users`);
    
    // Filter users that don't have environment information or force update all
    const usersToUpdate = force 
      ? users.users 
      : users.users.filter(user => !user.app_metadata?.environment);
    
    console.log(`Found ${usersToUpdate.length} users to update`);
    
    // Update each user
    let successCount = 0;
    let errorCount = 0;
    let environmentCounts = {
      local: 0,
      production: 0
    };
    
    for (const user of usersToUpdate) {
      try {
        // Determine the appropriate environment for this user
        const environment = determineUserEnvironment(user, defaultEnvironment);
        environmentCounts[environment]++;
        
        console.log(`Updating user ${user.id} (${user.email}) with environment: ${environment}`);
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            app_metadata: {
              ...user.app_metadata,
              environment,
              environment_updated_at: new Date().toISOString()
            }
          }
        );
        
        if (updateError) {
          console.error(`Error updating user ${user.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`Successfully updated user ${user.id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nUpdate Summary:');
    console.log(`- Total users: ${users.users.length}`);
    console.log(`- Users to update: ${usersToUpdate.length}`);
    console.log(`- Successfully updated: ${successCount}`);
    console.log(`- Failed to update: ${errorCount}`);
    console.log(`- Set to 'local' environment: ${environmentCounts.local}`);
    console.log(`- Set to 'production' environment: ${environmentCounts.production}`);
    
  } catch (error) {
    console.error('Error updating user environments:', error);
    process.exit(1);
  }
}

updateUserEnvironments()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 