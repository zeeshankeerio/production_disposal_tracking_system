import { useState, useEffect } from "react"
import { createClientSupabaseClient, handleSupabaseError } from "@/lib/supabase"
import { retryQuery, isRetryableError } from "@/lib/retry-utils"
import { useToast } from "@/components/ui/use-toast"

type QueryResult<T> = {
  data: T | null
  error: Error | null
  loading: boolean
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T>(
  queryFn: (supabase: ReturnType<typeof createClientSupabaseClient>) => Promise<T>
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClientSupabaseClient()
      
      // Use retry logic for better error handling
      const result = await retryQuery(
        async () => queryFn(supabase),
        {
          maxRetries: 3,
          delay: 1000,
          shouldRetry: isRetryableError,
          onRetry: (err, attempt) => {
            console.warn(`Retrying Supabase query (attempt ${attempt}/3)...`, err.message)
          }
        }
      )
      
      setData(result)
    } catch (err) {
      const error = handleSupabaseError(err)
      setError(error)
      console.error("Error fetching data:", error)
      
      // Show a toast notification for errors
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    error,
    loading,
    refetch: fetchData,
  }
} 