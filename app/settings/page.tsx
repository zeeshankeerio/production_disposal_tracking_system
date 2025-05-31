"use client"

import { DatabaseSetup } from "@/components/database-setup"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Database, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" /> 
            Settings
          </h2>
          <p className="text-muted-foreground">
            Configure your application settings and manage your database
          </p>
        </div>
      </div>
      
      <QuickNav />
      
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Important Note</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Changes made here will affect how your application works. Make sure you understand
          the consequences before making changes.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="database">
        <TabsList>
          <TabsTrigger value="database" className="flex items-center gap-1">
            <Database className="h-4 w-4" /> Database
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="database" className="space-y-4 pt-4">
          <h3 className="text-xl font-semibold">Database Settings</h3>
          <p className="text-muted-foreground mb-4">
            Manage your database connection and setup. Make sure your Supabase environment 
            variables are correctly configured in your deployment environment.
          </p>
          
          <Separator className="my-4" />
          
          <DatabaseSetup />
        </TabsContent>
      </Tabs>
      
      <CopyrightFooter />
    </div>
  )
} 