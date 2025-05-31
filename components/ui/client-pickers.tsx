"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePickerWrapper, DateRangePickerWrapper } from "@/components/ui/date-picker-wrapper"

// Export the wrapper components directly - they're already marked with "use client"
export { DatePickerWrapper, DateRangePickerWrapper }

// Create a fallback loading component
export function DatePickerFallback({ className }: { className?: string }) {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) return null
  
  return (
    <div className={className}>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
} 