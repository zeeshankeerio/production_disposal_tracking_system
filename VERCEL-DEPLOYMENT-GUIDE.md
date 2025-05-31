# Vercel Deployment Guide with Supabase

This guide will help you properly deploy the Production Tracker application to Vercel with Supabase database integration.

## 1. Fork or Clone the Repository

1. If you haven't already, fork or clone this repository to your GitHub account
2. Make sure you have the latest changes from the main branch

## 2. Set Up Your Supabase Project

Ensure your Supabase project is properly configured:

1. Sign up or log in at [Supabase](https://app.supabase.com/)
2. Create a new project if you haven't already
3. Make note of your Supabase project URL and API keys (found in Project Settings > API)

## 3. Deploy to Vercel

1. Go to [Vercel](https://vercel.com/) and sign up or log in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project with the following settings:

### Build and Output Settings
- Framework Preset: Next.js
- Build Command: `npm run vercel-build` (this runs environment checks before building)
- Output Directory: (leave as default)
- Install Command: (leave as default)

### Environment Variables
Add the following environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use these values from your Supabase project:
- **SUPABASE_URL**: Use your Supabase project URL (e.g., https://tehupaygyujwxbdygirq.supabase.co)
- **SUPABASE_SERVICE_ROLE_KEY**: Use your service role key (keep this secret!)
- **NEXT_PUBLIC_SUPABASE_URL**: Same as SUPABASE_URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Use your anon/public key

5. Click "Deploy"
6. Wait for the deployment to complete

## 4. After Deployment

1. Once deployed, navigate to your Vercel project URL
2. Go to the "Settings" page in the application
3. In the Database tab, verify your Supabase connection by clicking "Check Connection"
4. If connected successfully, click "Initialize Database" to set up the required tables

If the connection check fails:
- Double-check your environment variables in the Vercel project settings
- Make sure your Supabase project is active
- Verify that the correct API keys are being used

## 5. Updating Your Deployment

To update your deployment after making changes:

1. Push your changes to your GitHub repository
2. Vercel will automatically detect changes and redeploy your application

For manual redeployment:
1. Go to your project in the Vercel dashboard
2. Click "Deployments"
3. Click "Redeploy" on the latest deployment

## 6. Monitoring and Logs

To monitor your application and view logs:

1. Go to your project in the Vercel dashboard
2. Click "Deployments" and select the latest deployment
3. Click "Functions" to see serverless function logs
4. Click "Logs" to view build and runtime logs

## 7. Custom Domain (Optional)

To set up a custom domain:

1. Go to your project in the Vercel dashboard
2. Click "Settings" > "Domains"
3. Add your custom domain and follow the verification steps

## Troubleshooting

If you encounter issues:

1. Check the Vercel deployment logs for error messages
2. Verify all environment variables are correctly set
3. Make sure your Supabase database is properly initialized
4. Test your application locally with the same environment variables

## 8. Initialize Your Database

After deploying to Vercel, you need to set up your database:

1. Access your deployed application
2. Navigate to the Settings page (use the navigation menu)
3. On the Database tab, click "Check Connection" to verify Supabase connectivity
4. If connected successfully, click "Initialize Database" to set up the required tables

If the UI initialization doesn't work, you can manually set up the database:

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of the `setup-database.sql` file from this project
5. Paste it into the SQL editor
6. Click "Run" to execute the query

## 9. Verify Your Setup

To verify that everything is working:

1. Create a test product through the application
2. Add a production entry for that product
3. Check the dashboard to see if the data appears

If you encounter any issues, check the following:

- Verify that all environment variables are set correctly in Vercel
- Check the application logs in Vercel for any errors
- Make sure your Supabase project is active
- Ensure that the database tables were created correctly

## 10. Common Issues and Solutions

### "Unable to connect to the database"
- Double-check your environment variables in Vercel
- Verify that your Supabase project is active
- Try reinitializing the database from the Settings page

### "Missing pg_sql_raw function"
If the database initialization fails with this error, you'll need to create the function manually:

1. Go to your Supabase SQL Editor
2. Run the following SQL:
   ```sql
   CREATE OR REPLACE FUNCTION pg_sql_raw(query text) RETURNS void AS $$
   BEGIN
     EXECUTE query;
     RETURN;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```
3. Then try to initialize the database again

### "API routes return 500 errors"
- Check your Vercel logs for details
- Verify that your database tables exist and have the correct structure
- Make sure your Supabase service role key has the necessary permissions

## 11. Clearing Data (If Needed)

If you need to clear all data and start fresh:

1. Go to your Supabase SQL Editor
2. Run the following SQL:
   ```sql
   DELETE FROM disposal_entries;
   DELETE FROM production_entries;
   DELETE FROM products;
   ```

This will clear all entries while preserving the table structure. 