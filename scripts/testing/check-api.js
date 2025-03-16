const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkApi() {
  const userId = '57e5a1a4-150d-4185-afd5-983363d608d9';
  
  console.log('Checking API response for user entitlements...');
  
  try {
    // First check the database directly
    console.log('\nChecking database directly:');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Supabase credentials not found in environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user entitlements from database
    const { data: dbEntitlements, error: dbError } = await supabase
      .from('user_entitlements')
      .select('*, products:product_id(*)')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (dbError) {
      console.error('Error fetching entitlements from database:', dbError.message);
      return;
    }
    
    console.log(`Found ${dbEntitlements.length} active entitlements in database:`);
    dbEntitlements.forEach(entitlement => {
      console.log(`- ${entitlement.products.name} (ID: ${entitlement.product_id})`);
    });
    
    // Now check the API response
    console.log('\nChecking API response:');
    const response = await fetch(`http://localhost:3000/api/user-entitlements?userId=${userId}`, {
      headers: {
        'x-user-id': userId
      }
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const apiData = await response.json();
    
    console.log('API response:', JSON.stringify(apiData, null, 2));
    
    if (apiData.entitlements && apiData.entitlements.length > 0) {
      console.log(`\nFound ${apiData.entitlements.length} entitlements in API response:`);
      apiData.entitlements.forEach(entitlement => {
        console.log(`- ${entitlement.products?.name || 'Unknown'} (ID: ${entitlement.product_id})`);
      });
      
      // Check for discrepancies
      const dbIds = new Set(dbEntitlements.map(e => e.id));
      const apiIds = new Set(apiData.entitlements.map(e => e.id));
      
      const onlyInDb = dbEntitlements.filter(e => !apiIds.has(e.id));
      const onlyInApi = apiData.entitlements.filter(e => !dbIds.has(e.id));
      
      if (onlyInDb.length > 0) {
        console.log('\nEntitlements only in database:');
        onlyInDb.forEach(e => console.log(`- ${e.products.name} (ID: ${e.id})`));
      }
      
      if (onlyInApi.length > 0) {
        console.log('\nEntitlements only in API response:');
        onlyInApi.forEach(e => console.log(`- ${e.products?.name || 'Unknown'} (ID: ${e.id})`));
      }
    } else {
      console.log('No entitlements found in API response');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkApi(); 