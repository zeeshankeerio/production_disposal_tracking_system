"use client"

import { RefreshCw } from "lucide-react"

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-destructive/10 rounded-lg">
      <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
      <p className="text-muted-foreground text-center max-w-md">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  )
} 