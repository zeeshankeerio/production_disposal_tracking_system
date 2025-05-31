require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  // Get credentials from environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase environment variables.');
    console.log('Please make sure you have the following in your .env file:');
    console.log('SUPABASE_URL=your_supabase_project_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    process.exit(1);
  }

  console.log('Supabase environment variables found.');
  console.log(`SUPABASE_URL: ${supabaseUrl.substring(0, 8)}...`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Testing connection to Supabase...');
    
    // Simple health check query
    const { data, error } = await supabase.from('products').select('count()', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('Failed to connect to Supabase:');
      console.error(error);
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log(`Found ${data[0].count} products in the database.`);
    
    // Check all required tables
    console.log('\nVerifying required tables:');
    const tables = ['products', 'production_entries', 'disposal_entries'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact' });
      
      if (error) {
        console.error(`❌ Table '${table}' check failed:`, error);
      } else {
        console.log(`✅ Table '${table}' exists with ${data[0].count} records.`);
      }
    }
    
    console.log('\nSuabase connection test completed successfully!');
    console.log('Your database is properly configured.');
    
  } catch (error) {
    console.error('Unexpected error during connection test:');
    console.error(error);
    process.exit(1);
  }
}

testSupabaseConnection(); 