
    const { Client } = require('pg');
    
    async function testConnection() {
      const client = new Client({
        connectionString: 'postgresql://postgres.duxqazuhozfejdocxiyl:Na1T9JIMg0ODMZKp@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
      });
      
      try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected to database successfully!');
        
        const result = await client.query('SELECT current_database(), current_user');
        console.log('Query result:', result.rows[0]);
        
        await client.end();
        console.log('Connection closed.');
        return true;
      } catch (err) {
        console.error('Error connecting to database:', err.message);
        return false;
      }
    }
    
    testConnection()
      .then(success => process.exit(success ? 0 : 1))
      .catch(err => {
        console.error('Unexpected error:', err);
        process.exit(1);
      });
  