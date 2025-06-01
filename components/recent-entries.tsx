"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/components/providers/data-provider"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, BarChart3, Trash2, Search, X, ArrowDown, ArrowUp, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { UI_CONFIG } from "@/lib/config"
import { DisposalEntry, ProductionEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Type guard to check if an entry is a DisposalEntry
const isDisposalEntry = (entry: ProductionEntry | DisposalEntry): entry is DisposalEntry => {
  return 'reason' in entry;
}

interface EntryActionButtonsProps {
  entry: ProductionEntry | DisposalEntry;
  type: "production" | "disposal";
}

function EntryActionButtons({ entry, type }: EntryActionButtonsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteProductionEntry, deleteDisposalEntry, refreshData } = useData();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      if (type === "production") {
        await deleteProductionEntry(entry.id);
      } else {
        await deleteDisposalEntry(entry.id);
      }
      
      toast({
        title: "Success",
        description: `${type === "production" ? "Production" : "Disposal"} entry deleted successfully`,
      });
      
      // Refresh data to update the UI
      await refreshData();
    } catch (error) {
      console.error(`Error deleting ${type} entry:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to delete ${type} entry`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {type} entry
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {type} entry for <strong>{entry.product_name}</strong>? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RecentEntries() {
  const { productionEntries, disposalEntries, isLoading, error } = useData()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("production")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const itemsPerPage = UI_CONFIG.ITEMS_PER_PAGE
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Type guard to check if an entry is a DisposalEntry
  const isDisposalEntry = (entry: ProductionEntry | DisposalEntry): entry is DisposalEntry => {
    return 'reason' in entry;
  }

  // Filter and sort entries based on search term
  const filteredProduction = useMemo(() => {
    return productionEntries
      .filter(entry => 
        (entry.product_name ? entry.product_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.staff_name ? entry.staff_name.toLowerCase() : '').includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // 1. Capture potentially undefined values
        const rawDateA = a.date;
        const rawDateB = b.date;
        
        // 2. Define safe/fallback defaults
        const safeDateA = (rawDateA !== undefined && rawDateA !== null)
          ? new Date(rawDateA)
          : new Date(0); // Default to Unix epoch
        
        const safeDateB = (rawDateB !== undefined && rawDateB !== null)
          ? new Date(rawDateB)
          : new Date(0); // Default to Unix epoch
        
        // 3. Compare dates safely
        return sortOrder === "desc" ? safeDateB.getTime() - safeDateA.getTime() : safeDateA.getTime() - safeDateB.getTime();
      })
  }, [productionEntries, searchTerm, sortOrder])

  const filteredDisposal = useMemo(() => {
    return disposalEntries
      .filter(entry => 
        (entry.product_name ? entry.product_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.staff_name ? entry.staff_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.reason ? entry.reason.toLowerCase() : '').includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // 1. Capture potentially undefined values
        const rawDateA = a.date;
        const rawDateB = b.date;
        
        // 2. Define safe/fallback defaults
        const safeDateA = (rawDateA !== undefined && rawDateA !== null)
          ? new Date(rawDateA)
          : new Date(0); // Default to Unix epoch
        
        const safeDateB = (rawDateB !== undefined && rawDateB !== null)
          ? new Date(rawDateB)
          : new Date(0); // Default to Unix epoch
        
        // 3. Compare dates safely
        return sortOrder === "desc" ? safeDateB.getTime() - safeDateA.getTime() : safeDateA.getTime() - safeDateB.getTime();
      })
  }, [disposalEntries, searchTerm, sortOrder])

  // Calculate pagination
  const totalPages = useMemo(() => {
    const entries = activeTab === "production" ? filteredProduction : filteredDisposal
    return Math.ceil(entries.length / itemsPerPage)
  }, [activeTab, filteredProduction, filteredDisposal, itemsPerPage])

  // Get entries for current page
  const currentEntries = useMemo(() => {
    const entries = activeTab === "production" ? filteredProduction : filteredDisposal
    const startIndex = (currentPage - 1) * itemsPerPage
    return entries.slice(startIndex, startIndex + itemsPerPage)
  }, [activeTab, filteredProduction, filteredDisposal, currentPage, itemsPerPage])

  // Reset to page 1 when tab, search or sort changes
  useMemo(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, sortOrder])

  // Render current entries based on active tab
  const renderEntries = () => {
    if (currentEntries.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          {searchTerm ? "No matching entries found" : `No ${activeTab} entries found`}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {currentEntries.map((entry) => (
          <div key={entry.id} className="flex justify-between items-start border-b pb-3">
            <div>
              <div className="font-medium">{entry.product_name}</div>
              <div className="text-sm text-muted-foreground">
                {entry.staff_name} • 
                {/* 1. Capture potentially undefined value */}
                {(() => {
                  const rawDate = entry.date;
                  
                  {/* 2. Define a safe/fallback default */}
                  const safeDate = (rawDate !== undefined && rawDate !== null)
                    ? new Date(rawDate)
                    : new Date(); // Default to current date
                  
                  {/* 3. Format the date safely */}
                  const formattedDate = safeDate.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  
                  return formattedDate;
                })()}
              </div>
              {isDisposalEntry(entry) && (
                <div className="text-xs text-muted-foreground">
                  Reason: {entry.reason.split('/')[0].trim()}
                </div>
              )}
              {entry.notes && (
                <div className="text-xs text-muted-foreground italic mt-1">
                  Notes: {entry.notes}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <div className="font-semibold">{formatNumber(entry.quantity)}</div>
                <Badge variant="outline">
                  {entry.shift === "morning" ? "Morning" : 
                   entry.shift === "afternoon" ? "Afternoon" : "Night"}
                </Badge>
              </div>
              <EntryActionButtons entry={entry} type={activeTab as "production" | "disposal"} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[60px] w-full" />
            <div className="grid gap-4">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {typeof error === 'string' ? error : (error as { message: string }).message}
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[60px] w-full" />
        <div className="grid gap-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full dark:border-border/50">
      <CardHeader className="pb-2">
        <CardTitle>Recent Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <Tabs onValueChange={setActiveTab} value={activeTab} className="w-full">
              <TabsList className="grid w-full sm:w-[400px] grid-cols-2 mb-4">
                <TabsTrigger value="production" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>Production ({filteredProduction.length})</span>
                </TabsTrigger>
                <TabsTrigger value="disposal" className="flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                  <span>Disposal ({filteredDisposal.length})</span>
                </TabsTrigger>
              </TabsList>
            
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {currentPage} of {totalPages} pages
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 border rounded-md hover:bg-accent text-sm flex items-center gap-1 dark:border-border/50"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  >
                    {sortOrder === "desc" ? (
                      <>
                        <ArrowDown className="h-3 w-3" />
                        <span>Newest First</span>
                      </>
                    ) : (
                      <>
                        <ArrowUp className="h-3 w-3" />
                        <span>Oldest First</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <TabsContent value="production" className="space-y-4 mt-4">
                {renderEntries()}
              </TabsContent>
              
              <TabsContent value="disposal" className="space-y-4 mt-4">
                {renderEntries()}
              </TabsContent>
            </Tabs>
            
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search entries..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                className="px-3 py-1 border rounded-md hover:bg-accent disabled:opacity-50 disabled:pointer-events-none dark:border-border/50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border rounded-md hover:bg-accent disabled:opacity-50 disabled:pointer-events-none dark:border-border/50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 