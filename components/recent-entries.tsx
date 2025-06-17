"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  return entry && typeof entry === 'object' && 'reason' in entry;
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

// Add this helper function at the top of the file
const formatShift = (shift: string): string => {
  switch (shift) {
    case "morning": return "Morning";
    case "afternoon": return "Afternoon";
    case "night": return "Night";
    default: return "Unknown";
  }
};

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

  // Filter and sort entries based on search term
  const filteredProduction = useMemo(() => {
    try {
      if (!productionEntries || !Array.isArray(productionEntries)) {
        console.warn("Production entries is not an array:", productionEntries);
        return [];
      }
      
      let filtered = [...productionEntries];
      
      // Apply search filter if search term exists
      if (searchTerm && searchTerm.trim() !== '') {
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        
        filtered = filtered.filter(entry => {
          // Safely check each field with null/undefined checks
          const productName = entry.product_name ? entry.product_name.toLowerCase() : '';
          const staffName = entry.staff_name ? entry.staff_name.toLowerCase() : '';
          const notes = entry.notes ? entry.notes.toLowerCase() : '';
          
          return (
            productName.includes(normalizedSearchTerm) ||
            staffName.includes(normalizedSearchTerm) ||
            notes.includes(normalizedSearchTerm)
          );
        });
      }
      
      // Sort entries
      filtered.sort((a, b) => {
        try {
          // Handle null or undefined dates
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1; // Move entries with no date to the end
          if (!b.date) return -1; // Move entries with no date to the end
          
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return 1; // Move invalid dates to the end
          if (isNaN(dateB)) return -1; // Move invalid dates to the end
          
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        } catch (error) {
          console.error("Error sorting production entries:", error, "Entries:", a.id, b.id);
          return 0;
        }
      });
      
      return filtered;
    } catch (error) {
      console.error("Error filtering production entries:", error);
      return [];
    }
  }, [productionEntries, searchTerm, sortOrder])

  const filteredDisposal = useMemo(() => {
    try {
      if (!disposalEntries || !Array.isArray(disposalEntries)) {
        console.warn("Disposal entries is not an array:", disposalEntries);
        return [];
      }
      
      let filtered = [...disposalEntries];
      
      // Apply search filter if search term exists
      if (searchTerm && searchTerm.trim() !== '') {
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        
        filtered = filtered.filter(entry => {
          // Safely check each field with null/undefined checks
          const productName = entry.product_name ? entry.product_name.toLowerCase() : '';
          const staffName = entry.staff_name ? entry.staff_name.toLowerCase() : '';
          const reason = entry.reason ? entry.reason.toLowerCase() : '';
          const notes = entry.notes ? entry.notes.toLowerCase() : '';
          
          return (
            productName.includes(normalizedSearchTerm) ||
            staffName.includes(normalizedSearchTerm) ||
            reason.includes(normalizedSearchTerm) ||
            notes.includes(normalizedSearchTerm)
          );
        });
      }
      
      // Sort entries
      filtered.sort((a, b) => {
        try {
          // Handle null or undefined dates
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1; // Move entries with no date to the end
          if (!b.date) return -1; // Move entries with no date to the end
          
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return 1; // Move invalid dates to the end
          if (isNaN(dateB)) return -1; // Move invalid dates to the end
          
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        } catch (error) {
          console.error("Error sorting disposal entries:", error, "Entries:", a.id, b.id);
          return 0;
        }
      });
      
      return filtered;
    } catch (error) {
      console.error("Error filtering disposal entries:", error);
      return [];
    }
  }, [disposalEntries, searchTerm, sortOrder])

  // Calculate pagination
  const totalPages = useMemo(() => {
    const entries = activeTab === "production" ? filteredProduction : filteredDisposal
    return Math.ceil(entries.length / itemsPerPage)
  }, [activeTab, filteredProduction, filteredDisposal, itemsPerPage])

  // Get entries for current page
  const currentEntries = useMemo(() => {
    // Get the active entries based on the current tab
    const entries = activeTab === "production" ? filteredProduction : filteredDisposal
    
    // Calculate start index
    const startIndex = (currentPage - 1) * itemsPerPage
    
    // Return the slice of entries for the current page
    return entries.slice(startIndex, startIndex + itemsPerPage)
  }, [activeTab, filteredProduction, filteredDisposal, currentPage, itemsPerPage])

  // Reset to page 1 when tab, search or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, sortOrder])

  // Render current entries based on active tab
  const renderEntries = () => {
    if (currentEntries.length === 0) {
      return (
        <div className="text-center py-8 flex flex-col items-center gap-2">
          <div className="rounded-full bg-muted p-3 w-10 h-10 flex items-center justify-center">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-medium">No {activeTab} entries found</h3>
          {searchTerm ? (
            <p className="text-sm text-muted-foreground max-w-md">
              No {activeTab} entries match your search term "{searchTerm}". Try adjusting your search or clear it to see all entries.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground max-w-md">
              {activeTab === 'production' ? (
                <>No production entries have been recorded yet. Add production entries to track your manufacturing output.</>
              ) : (
                <>No disposal entries have been recorded yet. Add disposal entries to track waste and losses.</>
              )}
            </p>
          )}
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
                {/* Safely format the date with null checks */}
                {(() => {
                  try {
                    // First check if date is undefined or null
                    if (!entry.date) {
                      console.error("Missing date value");
                      return "Date not available";
                    }
                    
                    // Then check if it's a valid date
                    const dateObj = new Date(entry.date);
                    if (isNaN(dateObj.getTime())) {
                      console.error("Invalid date encountered:", entry.date);
                      return "Invalid date";
                    }
                    
                    // Format the date if it's valid
                    return formatDate(entry.date, "MMM d, yyyy");
                  } catch (error) {
                    console.error("Error formatting date:", error, "Entry:", entry.id);
                    return "Error formatting date";
                  }
                })()}
              </div>
              {isDisposalEntry(entry) && (
                <div className="text-xs text-muted-foreground">
                  Reason: {(() => {
                    try {
                      // Handle different reason formats gracefully
                      if (!entry.reason) return "Not specified";
                      
                      // If reason contains a slash, take the first part (common format in the app)
                      if (entry.reason.includes('/')) {
                        return entry.reason.split('/')[0].trim();
                      }
                      
                      // Otherwise return the full reason, trimmed to avoid extra spaces
                      return entry.reason.trim();
                    } catch (error) {
                      console.error("Error formatting reason:", error, "Entry:", entry.id);
                      return "Error displaying reason";
                    }
                  })()}
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
                  {formatShift(entry.shift)}
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
    // Enhanced error handling to safely extract error message
    let errorMessage = "An unknown error occurred";
    
    try {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
    } catch (e) {
      console.error("Error while processing error object:", e);
    }
    
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Recent Entries</CardTitle>
          <CardDescription>Loading the most recent production and disposal entries...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
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
              <TabsList className="grid w-full sm:w-[400px] grid-cols-2 mb-4" role="tablist" aria-label="Entry types">
                <TabsTrigger value="production" className="flex items-center gap-1" role="tab" id="production-tab" aria-controls="production-panel" aria-selected={activeTab === "production"}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Production ({filteredProduction.length})</span>
                </TabsTrigger>
                <TabsTrigger value="disposal" className="flex items-center gap-1" role="tab" id="disposal-tab" aria-controls="disposal-panel" aria-selected={activeTab === "disposal"}>
                  <Trash2 className="h-4 w-4" />
                  <span>Disposal ({filteredDisposal.length})</span>
                </TabsTrigger>
              </TabsList>
            
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {currentPage} of {totalPages} pages
                </div>
                <div className="flex gap-2">
                  <Select value={sortOrder} onValueChange={(value: string) => setSortOrder(value as "asc" | "desc")}>
                    <SelectTrigger 
                      className="w-full sm:w-[130px]"
                      aria-label="Sort order"
                      id="sort-order-select"
                    >
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Sort by date</SelectLabel>
                        <SelectItem value="desc">Newest first</SelectItem>
                        <SelectItem value="asc">Oldest first</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
              <label htmlFor="entry-search" className="sr-only">Search entries</label>
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input 
                id="entry-search"
                type="search"
                placeholder="Search entries..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search entries"
                aria-controls="entries-list"
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
          
          {(() => {
            // Get the active entries based on the current tab
            const activeEntries = activeTab === 'production' ? filteredProduction : filteredDisposal
            
            // Calculate total pages safely
            const totalEntries = activeEntries.length
            const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage))
            
            // Only show pagination if there are more entries than items per page
            if (totalPages <= 1) return null
            
            return (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="px-3 py-1 border rounded-md hover:bg-accent disabled:opacity-50 disabled:pointer-events-none dark:border-border/50"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  aria-disabled={currentPage <= 1}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 border rounded-md hover:bg-accent disabled:opacity-50 disabled:pointer-events-none dark:border-border/50"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  aria-disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            )
          })()}
        </div>
      </CardContent>
    </Card>
  )
}