# Supabase Setup Guide

This guide will help you properly set up Supabase for the Production Tracker application.

## 1. Create a Supabase Project

1. Sign up or log in at [Supabase](https://app.supabase.com/)
2. Create a new project
3. Choose a name for your project (e.g., "production-tracker")
4. Set a secure database password
5. Choose a region close to your users
6. Wait for your database to be provisioned (typically a few minutes)

## 2. Get Your Supabase Credentials

Once your project is set up, you need to gather the following credentials:

1. Go to your Supabase project dashboard
2. Navigate to Project Settings (gear icon in the sidebar)
3. Go to the "API" section
4. Copy the following values:
   - **Project URL**: Use this for `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **Service Role Key**: Use this for `SUPABASE_SERVICE_ROLE_KEY` (Keep this secret!)
   - **anon public**: Use this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Set Up Environment Variables

Create a `.env` file in the root of your project with the following content:

```
# Supabase Server-side Environment Variables
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Client-side Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with your actual Supabase credentials.

## 4. Initialize Your Database

You have two options to set up your database tables:

### Option A: Using the SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of the `setup-database.sql` file from this project
5. Paste it into the SQL editor
6. Click "Run" to execute the query

### Option B: Using the Setup Script

1. Make sure your `.env` file is properly configured
2. Open a terminal
3. Navigate to the project root directory
4. Run the following command:
   ```bash
   node setup-database.js
   ```

## 5. Verify Your Setup

To verify that Supabase is properly configured:

1. Make sure your `.env` file is set up correctly
2. Open a terminal
3. Navigate to the project root directory
4. Run the test connection script:
   ```bash
   node test-supabase-connection.js
   ```

If everything is set up correctly, you should see confirmation messages showing successful connection and table verification.

## 6. Common Issues and Solutions

### "Unable to connect to the database"
- Make sure your Supabase project is active
- Verify that your credentials in the `.env` file are correct
- Check if your IP is allowed in the Supabase dashboard

### "Table does not exist"
- Run the SQL setup script as described in step 4
- Check if you have the necessary permissions for your Supabase user

### "PostgreSQL function pg_sql_raw does not exist"
- This function is needed to run SQL scripts. You may need to create it first:
  ```sql
  CREATE OR REPLACE FUNCTION pg_sql_raw(query text) RETURNS void AS $$
  BEGIN
    EXECUTE query;
    RETURN;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

## 7. Next Steps

After setting up Supabase:

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Access the application at [http://localhost:3000](http://localhost:3000)
3. Start adding products, production entries, and disposal entries
4. Explore the dashboard and analytics features

For more information, refer to the [Supabase documentation](https://supabase.com/docs). 