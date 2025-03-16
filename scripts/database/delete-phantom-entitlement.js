require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function deletePhantomEntitlement() {
  console.log('Deleting phantom entitlement...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not found in environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // First check if the entitlement exists
  const { data: entitlement, error: checkError } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('id', 'fd47761f-5280-4787-a5e5-ebaa8bfb67ee')
    .maybeSingle();
  
  if (checkError) {
    console.error('Error checking for entitlement:', checkError);
    return;
  }
  
  if (!entitlement) {
    console.log('Entitlement not found in database, nothing to delete');
    return;
  }
  
  console.log('Found entitlement:', entitlement);
  
  // Delete the entitlement
  const { error: deleteError } = await supabase
    .from('user_entitlements')
    .delete()
    .eq('id', 'fd47761f-5280-4787-a5e5-ebaa8bfb67ee');
  
  if (deleteError) {
    console.error('Error deleting entitlement:', deleteError);
    return;
  }
  
  console.log('Successfully deleted phantom entitlement');
  
  // Verify it's gone
  const { data: checkAfter, error: checkAfterError } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('id', 'fd47761f-5280-4787-a5e5-ebaa8bfb67ee')
    .maybeSingle();
  
  if (checkAfterError) {
    console.error('Error verifying deletion:', checkAfterError);
    return;
  }
  
  if (checkAfter) {
    console.error('Entitlement still exists after deletion!');
  } else {
    console.log('Verified entitlement is deleted');
  }
}

deletePhantomEntitlement().catch(console.error); 