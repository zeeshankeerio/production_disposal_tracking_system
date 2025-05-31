import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware that doesn't introduce build issues
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add basic response headers
  response.headers.set('x-app-version', '1.0.0')
  return response
}

// Limit middleware to specific paths to reduce potential issues
export const config = {
  matcher: [
    '/api/:path*',
  ],
} 