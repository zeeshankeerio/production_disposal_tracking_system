# Supabase Connection Troubleshooting

This guide will help you troubleshoot common Supabase connection issues when setting up the Production Tracker.

## Common Connection Issues

### Wrong URL Format Error

If you see this error:

```
Connection Failed
TypeError: Request cannot be constructed from a URL that includes credentials: 
postgresql://postgres.tehupaygyujwxbdygirq:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true%2Frest%2Fv1%2Fproducts&select=count%28%29&limit=1
```

This means you're using a PostgreSQL connection string instead of the Supabase HTTP URL.

### How to Fix:

1. You need to use the Supabase HTTP URL in your environment variables:

   ```
   # Correct format (✅)
   SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   
   # Wrong format (❌)
   SUPABASE_URL=postgresql://postgres.YOUR-PROJECT-ID:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

2. Find your Supabase HTTP URL in the Supabase dashboard:
   - Go to https://app.supabase.com
   - Select your project
   - Go to Project Settings > API
   - Copy the "Project URL"

3. Update your environment variables:
   - In your `.env.local` file
   - In your Vercel project settings if deployed
   - In the vercel.json file if using one

## Using Different Connection Types

The Production Tracker app uses two different connections to Supabase:

1. **Supabase REST API connection** - This is used for database operations in the app and requires the HTTP URL (https://your-project-id.supabase.co)

2. **Direct database connection** - Only needed for migrations or direct database operations (postgresql://...)

For this app, you primarily need the HTTP URL for the SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL environment variables.

## Connection Security

Never expose your database connection string (postgresql://...) in client-side code or environment variables like NEXT_PUBLIC_* as it contains sensitive credentials.

## Automatic Fix

The latest version of the app includes automatic sanitization of URLs to prevent this error, but it's still recommended to use the correct URL format in your environment variables.

## SSL Issues

If you encounter SSL certificate errors when connecting to Supabase, make sure:

1. Your server's time is correctly set
2. You're not behind a corporate firewall that performs SSL inspection
3. You're using an up-to-date version of Node.js

## Getting Help

If you continue to have connection issues:

1. Check the Supabase status page: https://status.supabase.com/
2. Visit the Supabase forum: https://github.com/supabase/supabase/discussions
3. Join the Discord community: https://discord.supabase.com/ 