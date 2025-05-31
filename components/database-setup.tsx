"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"
import { useToast } from "./ui/use-toast"

type DatabaseStatus = {
  success: boolean
  connection?: string
  message?: string
  url?: string
  anon_key?: string
  service_key?: string
  error?: string
  tables: {
    [key: string]: {
      exists: boolean
      count?: number
      error?: string
    }
  }
  statusCode: number
}

export function DatabaseSetup() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const { toast } = useToast()

  const checkConnection = async () => {
    try {
      setChecking(true)
      const res = await fetch('/api/check-connection')
      const data = await res.json()
      setStatus(data)
      
      if (!data.success) {
        toast({
          title: "Connection Error",
          description: data.error || "Failed to connect to the database",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking connection:", error)
      toast({
        title: "Error",
        description: "Failed to check database connection",
        variant: "destructive",
      })
    } finally {
      setChecking(false)
    }
  }

  const initializeDatabase = async () => {
    try {
      setInitializing(true)
      const res = await fetch('/api/initialize-db', {
        method: 'POST',
      })
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Database initialized successfully",
        })
        // Refresh the connection status
        checkConnection()
      } else {
        toast({
          title: "Initialization Error",
          description: data.error || "Failed to initialize the database",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      toast({
        title: "Error",
        description: "Failed to initialize database",
        variant: "destructive",
      })
    } finally {
      setInitializing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection
        </CardTitle>
        <CardDescription>
          Check your Supabase database connection and initialize if needed
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!status ? (
          <Alert>
            <AlertTitle>Database status unknown</AlertTitle>
            <AlertDescription>
              Click the "Check Connection" button to verify your database connection.
            </AlertDescription>
          </Alert>
        ) : status.success ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Connected to Supabase</AlertTitle>
              <AlertDescription className="text-green-600">
                Successfully connected to your Supabase database.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <p className="text-sm font-medium">URL</p>
                <p className="text-sm text-gray-500">{status.url}</p>
              </div>
              <div className="p-4 border rounded-md">
                <p className="text-sm font-medium">Anon Key</p>
                <p className="text-sm text-gray-500">{status.anon_key}</p>
              </div>
              <div className="p-4 border rounded-md">
                <p className="text-sm font-medium">Service Key</p>
                <p className="text-sm text-gray-500">{status.service_key}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Tables Status</h3>
              <div className="space-y-2">
                {Object.entries(status.tables).map(([tableName, tableStatus]) => (
                  <div key={tableName} className="flex items-center gap-2 p-2 border rounded-md">
                    {tableStatus.exists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{tableName}</span>
                    {tableStatus.exists ? (
                      <span className="text-sm text-gray-500">({tableStatus.count} records)</span>
                    ) : (
                      <span className="text-sm text-red-500">{tableStatus.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-700">Connection Failed</AlertTitle>
            <AlertDescription className="text-red-600">
              {status.error || "Could not connect to Supabase database. Check your environment variables."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button onClick={checkConnection} disabled={checking} variant="outline">
          {checking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Connection"
          )}
        </Button>
        
        <Button 
          onClick={initializeDatabase} 
          disabled={initializing}
          variant={!status || !status.success || 
            Object.values(status.tables).some(table => !table.exists) 
            ? "default" : "outline"}
        >
          {initializing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            "Initialize Database"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 