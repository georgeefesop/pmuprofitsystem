/**
 * Script to set up RLS functions for user authentication
 * 
 * This script creates a function to set JWT claims for users,
 * which is necessary for RLS policies to work correctly.
 */

require('dotenv').config();
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

async function setupRlsFunctions() {
  console.log('Setting up RLS functions...');

  try {
    // Create the set_claim function for setting JWT claims
    const { error: setClaimError } = await supabase.rpc('create_set_claim_function', {});

    if (setClaimError) {
      if (setClaimError.message.includes('function "create_set_claim_function" does not exist')) {
        // Create the function to create the set_claim function
        const { error: createFunctionError } = await supabase.sql(`
          CREATE OR REPLACE FUNCTION create_set_claim_function()
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            -- Create the set_claim function if it doesn't exist
            CREATE OR REPLACE FUNCTION auth.set_claim(uid uuid, claim text, value jsonb)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = auth, pg_temp
            AS $$
            BEGIN
              UPDATE auth.users
              SET raw_app_meta_data = 
                raw_app_meta_data || 
                json_build_object(claim, value)::jsonb
              WHERE id = uid;
              
              -- Refresh the user's session so the claim is immediately available
              PERFORM auth.refresh_session();
            END;
            $$;
            
            -- Grant execute permission to the authenticated role
            GRANT EXECUTE ON FUNCTION auth.set_claim(uuid, text, jsonb) TO authenticated;
            GRANT EXECUTE ON FUNCTION auth.set_claim(uuid, text, jsonb) TO service_role;
          END;
          $$;
        `);

        if (createFunctionError) {
          console.error('Error creating create_set_claim_function:', createFunctionError);
          return;
        }

        // Now call the function to create the set_claim function
        const { error: callError } = await supabase.rpc('create_set_claim_function');
        
        if (callError) {
          console.error('Error calling create_set_claim_function:', callError);
          return;
        }
        
        console.log('Successfully created set_claim function');
      } else {
        console.error('Error creating set_claim function:', setClaimError);
        return;
      }
    } else {
      console.log('set_claim function already exists');
    }

    // Create the refresh_session function
    const { error: refreshSessionError } = await supabase.sql(`
      CREATE OR REPLACE FUNCTION auth.refresh_session()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = auth, pg_temp
      AS $$
      DECLARE
        _user_id uuid;
      BEGIN
        -- Get the user ID from the current session
        _user_id := auth.uid();
        
        IF _user_id IS NULL THEN
          RAISE EXCEPTION 'No user ID found in the current session';
        END IF;
        
        -- Update the session's last_refreshed_at timestamp
        UPDATE auth.sessions
        SET refreshed_at = now()
        WHERE user_id = _user_id
        AND not revoked;
      END;
      $$;
      
      -- Grant execute permission to the authenticated role
      GRANT EXECUTE ON FUNCTION auth.refresh_session() TO authenticated;
      GRANT EXECUTE ON FUNCTION auth.refresh_session() TO service_role;
    `);

    if (refreshSessionError) {
      console.error('Error creating refresh_session function:', refreshSessionError);
      return;
    }

    console.log('Successfully set up RLS functions');
  } catch (error) {
    console.error('Error setting up RLS functions:', error);
  }
}

// Run the setup function
setupRlsFunctions()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  }); 