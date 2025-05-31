"use client"

import { ReactNode } from "react"
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "./error-fallback"

interface ErrorBoundaryProps {
  children: ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  )
} 