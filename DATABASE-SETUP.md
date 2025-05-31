# Database Setup Instructions

This document explains how to set up the required database tables and sample data for the Padokka Analytics application.

## Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your [Supabase project dashboard](https://app.supabase.com)
2. Navigate to the "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of the `setup-database.sql` file and paste it into the SQL editor
5. Click "Run" to execute the query

This will create all the necessary tables with proper relationships and add sample data.

## Option 2: Using the Setup Script

If you prefer to use a script, follow these steps:

1. Make sure your `.env` file contains the correct Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. Install the required dependencies:
   ```bash
   pnpm add dotenv @supabase/supabase-js
   ```

3. Run the setup script:
   ```bash
   node setup-database.js
   ```

## Database Schema

The database includes the following tables:

### products
- `id`: UUID (Primary Key)
- `name`: TEXT (Required)
- `category`: TEXT
- `unit`: TEXT (Required)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### production_entries
- `id`: UUID (Primary Key)
- `product_id`: UUID (Foreign Key to products.id)
- `quantity`: NUMERIC
- `production_date`: DATE
- `batch_number`: TEXT
- `notes`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### disposal_entries
- `id`: UUID (Primary Key)
- `product_id`: UUID (Foreign Key to products.id)
- `quantity`: NUMERIC
- `disposal_date`: DATE
- `reason`: TEXT
- `disposal_method`: TEXT
- `notes`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## Sample Data

The setup script adds:
- 10 sample products across different categories
- 30 sample production entries (3 per product)
- 20 sample disposal entries (2 per product)

## Troubleshooting

If you encounter any errors:

1. Check that your Supabase credentials are correct
2. Ensure your Supabase project is active
3. Make sure you have the necessary permissions to create tables and policies
4. If using the script, ensure Node.js is installed and all dependencies are available

For more help, refer to the [Supabase documentation](https://supabase.com/docs). 