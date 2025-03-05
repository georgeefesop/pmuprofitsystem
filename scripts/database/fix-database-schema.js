const fetch = require('node-fetch');

async function fixDatabaseSchema() {
  const MCP_SERVER_URL = 'http://localhost:3100';
  
  try {
    console.log('Checking if pending_purchases table exists...');
    
    // Check if pending_purchases table exists
    const checkTableResponse = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'pending_purchases'
          );
        `
      }),
    });
    
    const checkTableResult = await checkTableResponse.json();
    const tableExists = checkTableResult.data[0].exists;
    
    if (!tableExists) {
      console.log('pending_purchases table does not exist, creating it...');
      
      // Create the pending_purchases table
      const createTableResponse = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS public.pending_purchases (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              email TEXT NOT NULL,
              full_name TEXT,
              include_ad_generator BOOLEAN DEFAULT false,
              include_blueprint BOOLEAN DEFAULT false,
              total_price DECIMAL(10, 2) NOT NULL,
              user_id UUID REFERENCES auth.users(id),
              checkout_session_id TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }),
      });
      
      const createTableResult = await createTableResponse.json();
      
      if (createTableResult.error) {
        console.error('Error creating pending_purchases table:', createTableResult.error);
      } else {
        console.log('Successfully created pending_purchases table');
      }
    } else {
      console.log('pending_purchases table already exists');
    }
    
    // Check purchases table schema
    console.log('Checking purchases table schema...');
    
    const checkColumnsResponse = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'purchases';
        `
      }),
    });
    
    const checkColumnsResult = await checkColumnsResponse.json();
    const columns = checkColumnsResult.data;
    
    console.log('Purchases table columns:', columns);
    
    // Check if we need to add missing columns
    const requiredColumns = [
      { name: 'email', type: 'TEXT' },
      { name: 'full_name', type: 'TEXT' },
      { name: 'include_ad_generator', type: 'BOOLEAN DEFAULT false' },
      { name: 'include_blueprint', type: 'BOOLEAN DEFAULT false' },
      { name: 'checkout_session_id', type: 'TEXT' },
      { name: 'payment_status', type: 'TEXT' },
      { name: 'payment_intent', type: 'TEXT' },
      { name: 'amount_total', type: 'DECIMAL(10, 2)' }
    ];
    
    const existingColumns = columns.map(col => col.column_name);
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding missing column ${column.name} to purchases table...`);
        
        const addColumnResponse = await fetch(MCP_SERVER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              ALTER TABLE public.purchases 
              ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
            `
          }),
        });
        
        const addColumnResult = await addColumnResponse.json();
        
        if (addColumnResult.error) {
          console.error(`Error adding column ${column.name}:`, addColumnResult.error);
        } else {
          console.log(`Successfully added column ${column.name} to purchases table`);
        }
      }
    }
    
    console.log('Database schema check and fix completed');
  } catch (err) {
    console.error('Exception:', err);
  }
}

fixDatabaseSchema(); 