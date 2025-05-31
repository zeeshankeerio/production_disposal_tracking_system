import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import { retryQuery } from "./retry-utils"
import { logDatabaseError, ERROR_TYPES } from "./errorLogger"

interface SupabaseError extends Error {
  code?: string
  details?: string
  hint?: string
}

// Helper to ensure we're using an HTTP URL, not a direct DB connection string
const sanitizeSupabaseUrl = (url: string): string => {
  // Check if this is a PostgreSQL connection string
  if (url.startsWith('postgresql://')) {
    console.warn('PostgreSQL connection string detected instead of Supabase URL. Using default Supabase URL.');
    return 'https://tehupaygyujwxbdygirq.supabase.co';
  }
  
  // Ensure URL starts with https protocol
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  
  return url;
};

// Create a single supabase client for server-side usage
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables. Please check your .env file.")
  }

  const sanitizedUrl = sanitizeSupabaseUrl(supabaseUrl);
  
  const client = createClient<Database>(sanitizedUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "production-tracker",
      },
    },
  })

  return client
}

// Create a singleton client for client-side usage
let clientSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const createClientSupabaseClient = () => {
  if (clientSupabaseInstance) return clientSupabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables. Please check your .env file.")
  }

  const sanitizedUrl = sanitizeSupabaseUrl(supabaseUrl);
  
  const client = createClient<Database>(sanitizedUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "production-tracker",
      },
    },
  })

  clientSupabaseInstance = client
  return clientSupabaseInstance
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown): Error => {
  const supabaseError = error as SupabaseError
  let errorType = ERROR_TYPES.DATABASE
  let userMessage = "An unexpected database error occurred. Please try again later."
  
  // Log the error with details
  logDatabaseError(error, {
    code: supabaseError.code,
    details: supabaseError.details,
    hint: supabaseError.hint,
  })
  
  if (supabaseError.code === "PGRST301") {
    userMessage = "Unable to connect to the database. Please check your internet connection and try again."
  }
  
  else if (supabaseError.code === "PGRST116") {
    userMessage = "Invalid request. Please check your input and try again."
    errorType = ERROR_TYPES.VALIDATION
  }

  else if (supabaseError.code === "23505") {
    userMessage = "A record with this information already exists."
    errorType = ERROR_TYPES.VALIDATION
  }

  else if (supabaseError.code === "23503") {
    userMessage = "Referenced record not found. Please check your input."
    errorType = ERROR_TYPES.VALIDATION
  }

  else if (supabaseError.code === "42501") {
    userMessage = "You don't have permission to perform this action."
    errorType = ERROR_TYPES.AUTHORIZATION
  }

  else if (supabaseError.hint) {
    userMessage = `${supabaseError.message}. Hint: ${supabaseError.hint}`
  }
  
  else if (supabaseError.message) {
    userMessage = supabaseError.message
  }
  
  return new Error(userMessage)
}

// Helper function to execute a query with retry logic
export async function executeQuery<T>(
  query: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  return retryQuery(query, {
    maxRetries: options.maxRetries,
    delay: options.delay,
    onRetry: (error, attempt) => {
      logDatabaseError(error, { attempt, retryInfo: "Query retry attempt" })
      if (options.onRetry) {
        options.onRetry(error, attempt)
      }
    },
  })
}

