require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // Get credentials from environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running database setup script...');
    
    // Execute SQL
    const { data, error } = await supabase.rpc('pg_sql_raw', { query: sqlContent });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }

    console.log('Database setup completed successfully!');
    
    // Verify tables were created
    const tables = ['products', 'production_entries', 'disposal_entries'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact' });
      
      if (error) {
        console.error(`Error verifying table ${table}:`, error);
      } else {
        console.log(`Table ${table} created with ${data[0].count} records.`);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

setupDatabase(); 