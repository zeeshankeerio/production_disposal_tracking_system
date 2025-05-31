"use client"

import { Header } from "@/components/header"
import { Dashboard } from "@/components/dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductionForm } from "@/components/production-form"
import { DisposalForm } from "@/components/disposal-form"
import { AIInsights } from "@/components/ai-insights"
import { NLSearch } from "@/components/nl-search"
import { ExportData } from "@/components/export-data"
import { RecentEntries } from "@/components/recent-entries"
import { Sparkles, BarChart3, PlusCircle, Trash2, Clock } from "lucide-react"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "./error-fallback"
import { LoadingFallback } from "./loading-fallback"

export function Root() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Padokka Analytics</h1>
          <Suspense fallback={<LoadingFallback />}>
            <NLSearch />
          </Suspense>
        </div>

        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto">
            <TabsTrigger value="recent" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Recent</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Production</span>
            </TabsTrigger>
            <TabsTrigger value="disposal" className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Disposal</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
          </TabsList>
          
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <TabsContent value="recent" className="animate-in fade-in-50">
                <RecentEntries />
              </TabsContent>
            </Suspense>
          </ErrorBoundary>
          
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <TabsContent value="dashboard" className="animate-in fade-in-50">
                <Dashboard />
              </TabsContent>
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <TabsContent value="production" className="animate-in fade-in-50">
                <ProductionForm />
              </TabsContent>
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <TabsContent value="disposal" className="animate-in fade-in-50">
                <DisposalForm />
              </TabsContent>
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <TabsContent value="insights" className="space-y-6 animate-in fade-in-50">
                <AIInsights />
                <ExportData />
              </TabsContent>
            </Suspense>
          </ErrorBoundary>
        </Tabs>
      </main>
    </div>
  )
} 