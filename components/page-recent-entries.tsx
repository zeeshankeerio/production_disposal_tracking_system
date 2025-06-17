"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { 
  ArrowDown, 
  ArrowUp, 
  Search, 
  X, 
  ListFilter, 
  Trash2, 
  BarChart3, 
  InfoIcon, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { useData } from "@/components/providers/data-provider"
import { useToast } from "@/components/ui/use-toast"
import { formatEastern } from "@/lib/date-utils"

interface PageRecentEntriesProps {
  title: string
  description?: string
  type: "production" | "disposal"
  maxEntries?: number
  showFilters?: boolean
  allowDelete?: boolean
}

const NEW_YORK_TIMEZONE = 'America/New_York';

export function PageRecentEntries({
  title,
  description,
  type,
  maxEntries = 8,
  showFilters = true,
  allowDelete = false
}: PageRecentEntriesProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { productionEntries, disposalEntries, refreshData, deleteProductionEntry, deleteDisposalEntry, isLoading, error } = useData()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Type guard to check if an entry is a DisposalEntry
  const isDisposalEntry = (entry: ProductionEntry | DisposalEntry): entry is DisposalEntry => {
    return 'reason' in entry
  }

  // Get entries based on type
  const entries = type === "production" ? productionEntries : disposalEntries

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!entries || !Array.isArray(entries)) return []
    if (!searchTerm.trim()) return entries
    
    return entries.filter(entry => {
      if (!entry) return false
      
      const matchesSearch = 
        (entry.product_name ? entry.product_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.staff_name ? entry.staff_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        
      if (isDisposalEntry(entry)) {
        return matchesSearch || (entry.reason ? entry.reason.toLowerCase() : '').includes(searchTerm.toLowerCase())
      }
      
      return matchesSearch
    })
  }, [entries, searchTerm])

  // Sort entries by date
  const sortedEntries = useMemo(() => {
    if (!filteredEntries || !Array.isArray(filteredEntries)) return [];
    
    return [...filteredEntries].sort((a, b) => {
      // Safely handle potentially undefined dates
      const dateAValue = a.date !== undefined && a.date !== null ? a.date : null;
      const dateBValue = b.date !== undefined && b.date !== null ? b.date : null;
      
      // Create Date objects safely
      const dateA = dateAValue ? new Date(dateAValue).getTime() : 0;
      const dateB = dateBValue ? new Date(dateBValue).getTime() : 0;
      
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [filteredEntries, sortOrder]);

  // Get limited entries for display
  const displayEntries = useMemo(() => {
    if (!sortedEntries || !Array.isArray(sortedEntries)) return []
    return sortedEntries.slice(0, maxEntries)
  }, [sortedEntries, maxEntries])

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await refreshData()
    } catch (err) {
      console.error("Error refreshing data:", err)
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 800)
    }
  }

  // Handle delete
  const handleDelete = async (entry: ProductionEntry | DisposalEntry) => {
    if (!entry || !entry.id) return
    
    try {
      if (type === "production") {
        await deleteProductionEntry(entry.id)
      } else {
        await deleteDisposalEntry(entry.id)
      }
      
      toast({
        title: "Success",
        description: `${type === "production" ? "Production" : "Disposal"} entry deleted successfully`,
      })
      
      // Refresh data to update the UI
      await refreshData()
    } catch (error) {
      console.error(`Error deleting ${type} entry:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to delete ${type} entry`,
        variant: "destructive",
      })
    }
  }

  if (!mounted || isLoading) {
    return (
      <Card className="w-full dark:border-border/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 border-b pb-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full dark:border-border/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="dark:border-border/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <Card className="w-full dark:border-border/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Alert className="dark:border-border/50">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No entries found</AlertTitle>
            <AlertDescription>
              There are no {type} entries to display. Add new entries to see them here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full dark:border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 dark:border-border/50"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {showFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 dark:border-border/50">
                  <ListFilter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-4 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search entries..." 
              className="pl-8 dark:border-border/50" 
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
        )}
        
        <div className="space-y-4">
          {displayEntries.map((entry) => {
            if (!entry) return null;
            
            // Safely format the date
            let formattedDate = 'No date';
            try {
              if (entry.date === undefined || entry.date === null) {
                formattedDate = 'No date';
              } else {
                const safeDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
                
                if (!(safeDate instanceof Date) || isNaN(safeDate.getTime())) {
                  console.warn("Invalid date in entry:", entry.id, entry.date);
                  formattedDate = 'Invalid date';
                } else {
                  // Convert to New York timezone
                  const newYorkDate = new Date(safeDate.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE }));
                  formattedDate = formatEastern(newYorkDate, "MMM dd, yyyy");
                }
              }
            } catch (error) {
              console.error("Error formatting date:", error, "Entry:", entry.id);
              formattedDate = 'Invalid date';
            }
            
            return (
              <div key={entry.id} className="flex flex-col gap-2 border-b pb-3 dark:border-border/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.product_name}</span>
                      {allowDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive/90"
                          onClick={() => handleDelete(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Staff:</span> {entry.staff_name} •{" "}
                      <span className="font-medium">Date:</span> {formattedDate} •{" "}
                      <span className="font-medium">Shift:</span> {entry.shift}
                    </div>
                  </div>
                  <Badge variant={type === "production" ? "default" : "destructive"} className="ml-auto">
                    {isDisposalEntry(entry) ? <Trash2 className="mr-1 h-3 w-3" /> : <BarChart3 className="mr-1 h-3 w-3" />}
                    {formatNumber(entry.quantity)}
                  </Badge>
                </div>
                
                {isDisposalEntry(entry) && (
                  <div className="text-xs text-muted-foreground rounded-md">
                    <span className="font-medium">Reason:</span> {entry.reason}
                  </div>
                )}
                
                {entry.notes && (
                  <div className="text-xs text-muted-foreground italic">
                    <span className="font-medium">Notes:</span> {entry.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {sortedEntries.length > maxEntries && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all {sortedEntries.length} entries
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}