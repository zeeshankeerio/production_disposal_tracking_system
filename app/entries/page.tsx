"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProductionForm } from "@/components/production-form"
import { DisposalForm } from "@/components/disposal-form"
import { RecentEntries } from "@/components/recent-entries"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, AlertTriangleIcon } from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"

export default function EntriesPage() {
  const { isLoading } = useData()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production & Disposal Tracker</h2>
          <p className="text-muted-foreground">
            Track production and disposal of products in your facility
          </p>
        </div>
      </div>
      
      <QuickNav />
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Data Entry Guidelines</AlertTitle>
        <AlertDescription>
          Please ensure all information is accurate and complete. Production and disposal data is used for inventory management, quality control, and regulatory compliance.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Add New Entry</CardTitle>
              <CardDescription>
                Select the type of entry you want to create below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="production" className="space-y-4">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="production">Production</TabsTrigger>
                  <TabsTrigger value="disposal">Disposal</TabsTrigger>
                </TabsList>
                <TabsContent value="production">
                  <ProductionForm />
                </TabsContent>
                <TabsContent value="disposal">
                  <DisposalForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              All entries are recorded in the system. You can now delete individual entries if needed, but please ensure entries are accurate to maintain data integrity.
            </AlertDescription>
          </Alert>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>
                View the most recent production and disposal entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentEntries />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <CopyrightFooter />
    </div>
  )
} 