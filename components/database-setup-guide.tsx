"use client"

import { useState } from "react"
import { AlertCircle, Database, FileText, Terminal, CheckCircle } from "lucide-react"
import Link from "next/link"

interface DatabaseSetupGuideProps {
  errorMessage: string
}

export function DatabaseSetupGuide({ errorMessage }: DatabaseSetupGuideProps) {
  const [step, setStep] = useState(1)
  const maxSteps = 3
  
  return (
    <div className="rounded-lg border border-destructive/50 p-6 space-y-6 bg-destructive/10 max-w-3xl mx-auto my-8">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-1" />
        <div>
          <h2 className="text-xl font-semibold">Database Setup Required</h2>
          <p className="text-muted-foreground mt-1">{errorMessage}</p>
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-md">
        <div className="space-y-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">Database Setup Guide</h3>
            <div className="text-sm text-muted-foreground">Step {step} of {maxSteps}</div>
          </div>
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">1. Access your Supabase Dashboard</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      app.supabase.com
                    </a> and select your project.
                  </p>
                </div>
              </div>
              <div className="pl-8">
                <Link href="/DATABASE-SETUP.md" target="_blank" className="text-sm text-primary hover:underline inline-flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  View full setup instructions
                </Link>
              </div>
              <button 
                onClick={() => setStep(2)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm mt-2 hover:bg-primary/90"
              >
                Next: Database Setup
              </button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Terminal className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">2. Run the Database Setup Script</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Navigate to the SQL Editor in your Supabase Dashboard and run the setup script.
                  </p>
                  <div className="bg-muted p-3 rounded-md mt-3 text-sm font-mono overflow-auto">
                    <pre>-- Go to SQL Editor in Supabase
-- Create new query
-- Copy content from setup-database.sql and run it</pre>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setStep(1)}
                  className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-sm"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                >
                  Next: Verify Setup
                </button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">3. Verify Your Setup</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    After running the setup script, refresh this page to see if the issue is resolved.
                  </p>
                  <div className="mt-3">
                    <Link href="/" className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Refresh Application
                    </Link>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setStep(2)}
                  className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-sm"
                >
                  Previous
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 