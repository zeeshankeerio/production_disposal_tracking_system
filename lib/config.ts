/**
 * Application Configuration
 * 
 * This file contains all the configuration settings for the application.
 * Edit these values to customize the behavior of the application.
 */

// Data Source Configuration
// Set to true to use mock data, false to use JSON database API
export const USE_MOCK_DATA = !isSupabaseConfigured();

// API Endpoints
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  PRODUCTION: '/api/production',
  DISPOSAL: '/api/disposal'
};

// Mock Data Configuration
// Refresh interval for mock data in milliseconds (5 minutes)
export const MOCK_DATA_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// UI Configuration
export const UI_CONFIG = {
  // Number of items to show per page in lists
  ITEMS_PER_PAGE: 10,
  
  // Date format for displaying dates
  DATE_FORMAT: 'MMM dd, yyyy',
  
  // Theme colors
  THEME: {
    PRIMARY: '#4f46e5', // Indigo
    SECONDARY: '#10b981', // Emerald
    DANGER: '#ef4444', // Red
  }
}; 

// Dashboard refresh interval in milliseconds (default: 60 seconds)
export const DASHBOARD_REFRESH_INTERVAL = 60 * 1000

// Number of items to show in the recent entries lists
export const RECENT_ENTRIES_LIMIT = 5

// Timezone configuration
export const DEFAULT_TIMEZONE = 'America/New_York'; // Force US Eastern timezone for testing
export const DATE_FORMAT = "yyyy-MM-dd";

// Format options for different date display styles
export const DATE_FORMAT_OPTIONS = {
  short: {
    month: 'numeric' as const,
    day: 'numeric' as const,
    year: '2-digit' as const,
  },
  medium: {
    month: 'short' as const,
    day: 'numeric' as const,
    year: 'numeric' as const,
  },
  long: {
    weekday: 'long' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    year: 'numeric' as const,
  }
};

// Default chart colors
export const CHART_COLORS = {
  primary: "#0891b2", // Cyan
  secondary: "#6d28d9", // Purple
  success: "#10b981", // Emerald
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
  gray: "#6b7280", // Gray
}

// Number of days to look back for dashboard stats
export const DASHBOARD_DAYS_LOOKBACK = 30

// Check if we have the necessary environment variables for Supabase
export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') {
    // Server-side check
    return Boolean(
      process.env.SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  } else {
    // Client-side check
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
} 