"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { ArrowDown, ArrowUp, Search, X, ListFilter, Trash2, BarChart3, InfoIcon, RefreshCw } from "lucide-react"
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

interface PageRecentEntriesProps {
  entries: (ProductionEntry | DisposalEntry)[]
  title: string
  description?: string
  type: "production" | "disposal"
  maxEntries?: number
  showFilters?: boolean
}

export function PageRecentEntries({
  entries,
  title,
  description,
  type,
  maxEntries = 8,
  showFilters = true
}: PageRecentEntriesProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { refreshData } = useData()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Type guard to check if an entry is a DisposalEntry
  const isDisposalEntry = (entry: ProductionEntry | DisposalEntry): entry is DisposalEntry => {
    return 'reason' in entry
  }

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries
    
    return entries.filter(entry => {
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
    return [...filteredEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [filteredEntries, sortOrder])

  // Get limited entries for display
  const displayEntries = useMemo(() => {
    return sortedEntries.slice(0, maxEntries)
  }, [sortedEntries, maxEntries])

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  if (!mounted) {
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

  if (entries.length === 0) {
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
        
        <div className="space-y-3">
          {displayEntries.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No matching entries found
            </div>
          ) : (
            displayEntries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 border-b pb-3 dark:border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-start">
                          <div className="font-medium text-md hover:text-primary">
                            {entry.product_name}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] bg-background border border-border dark:bg-background/90 dark:border-border/50">
                          <p>Quantity: {formatNumber(entry.quantity)}</p>
                          <p>Staff: {entry.staff_name}</p>
                          <p>Date: {format(new Date(entry.date), "PPP")}</p>
                          <p>Shift: {entry.shift === "morning" ? "Morning" : 
                                      entry.shift === "afternoon" ? "Afternoon" : "Night"}</p>
                          {isDisposalEntry(entry) && <p>Reason: {entry.reason}</p>}
                          {entry.notes && <p>Notes: {entry.notes}</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-sm text-muted-foreground flex gap-2 items-center">
                      <span>{format(new Date(entry.date), "PP")}</span>
                      <span>•</span>
                      <Badge variant="outline" className="font-normal dark:border-border/50">
                        {entry.shift === "morning" ? "Morning" : 
                         entry.shift === "afternoon" ? "Afternoon" : "Night"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={type === "production" ? "default" : "destructive"} className="ml-auto">
                      {isDisposalEntry(entry) ? <Trash2 className="mr-1 h-3 w-3" /> : <BarChart3 className="mr-1 h-3 w-3" />}
                      {formatNumber(entry.quantity)}
                    </Badge>
                  </div>
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
            ))
          )}
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