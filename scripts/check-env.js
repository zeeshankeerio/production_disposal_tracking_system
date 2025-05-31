#!/usr/bin/env node

/**
 * This script checks that all required environment variables are set
 * before building or deploying the application.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

function checkEnvVars() {
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  // Check URL format
  const supabaseUrl = process.env.SUPABASE_URL;
  const nextPublicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (supabaseUrl && supabaseUrl.startsWith('postgresql://')) {
    console.warn('⚠️ Warning: SUPABASE_URL is set to a PostgreSQL connection string instead of an HTTP URL.');
    console.warn('⚠️ Use the HTTP URL for Supabase (e.g., https://your-project-id.supabase.co)');
    console.warn('⚠️ The app will attempt to fix this automatically, but it\'s better to update your environment variables.');
  }
  
  if (nextPublicSupabaseUrl && nextPublicSupabaseUrl.startsWith('postgresql://')) {
    console.warn('⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL is set to a PostgreSQL connection string instead of an HTTP URL.');
    console.warn('⚠️ Use the HTTP URL for Supabase (e.g., https://your-project-id.supabase.co)');
    console.warn('⚠️ The app will attempt to fix this automatically, but it\'s better to update your environment variables.');
  }
  
  if (missing.length > 0) {
    console.error('❌ Error: Missing required environment variables:');
    missing.forEach(env => {
      console.error(`   - ${env}`);
    });
    console.error('\nPlease make sure these variables are set in your .env.local file or deployment environment.');
    console.error('You can use .env.local.example as a template.');
    
    // In development, we'll allow continuing with missing variables
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1') {
      console.error('\n❌ Exiting build process due to missing environment variables in production.');
      process.exit(1);
    } else if (process.env.VERCEL === '1') {
      // On Vercel, we'll log a warning but continue
      console.warn('\n⚠️ Building on Vercel with missing environment variables.');
      console.warn('⚠️ Please make sure to add these variables in the Vercel project settings.');
      console.warn('⚠️ The application will use mock data until environment variables are set.');
    } else {
      console.warn('\n⚠️ Continuing in development mode with missing environment variables.');
      console.warn('⚠️ The application will use mock data instead of connecting to Supabase.');
    }
  } else {
    console.log('✅ All required environment variables are set!');
  }
}

checkEnvVars(); 