"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { Search, X, ArrowDown, ArrowUp, Filter, RefreshCw, Calendar } from "lucide-react"
import { EntryDetailView } from "@/components/entry-detail-view"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { useData } from "@/components/providers/data-provider"
import { useToast } from "@/components/ui/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { UI_CONFIG } from "@/lib/config"

interface EntriesListViewProps {
  entries: (ProductionEntry | DisposalEntry)[]
  title: string
  description?: string
  type: "production" | "disposal"
  pageSize?: number
  allowFiltering?: boolean
}

export function EntriesListView({
  entries,
  title,
  description,
  type,
  pageSize = 6,
  allowFiltering = true
}: EntriesListViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  
  const { products, refreshData } = useData()
  const { toast } = useToast()
  
  // Type guard to check if an entry is a DisposalEntry
  const isDisposalEntry = (entry: ProductionEntry | DisposalEntry): entry is DisposalEntry => {
    return 'reason' in entry
  }
  
  // Filter entries based on search term, product, and date range
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchTerm ? (
        (entry.product_name ? entry.product_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.staff_name ? entry.staff_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (isDisposalEntry(entry) && entry.reason ? entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      ) : true
      
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
      
      // 1. Capture potentially undefined value
      const rawDate = entry.date;
      
      // 2. Define a safe/fallback default
      const safeDate = (rawDate !== undefined && rawDate !== null)
        ? new Date(rawDate)
        : new Date(); // Default to current date
      
      // 3. Validate the date
      if (isNaN(safeDate.getTime())) {
        console.warn("Invalid date:", rawDate);
        return false;
      }
      
      const isInDateRange = dateRange?.from && dateRange?.to
        ? safeDate >= dateRange.from && safeDate <= dateRange.to
        : true
      
      return matchesSearch && matchesProduct && isInDateRange
    })
  }, [entries, searchTerm, selectedProduct, dateRange])
  
  // Sort entries by date
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [filteredEntries, sortOrder])
  
  // Paginate entries
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedEntries.slice(startIndex, startIndex + pageSize)
  }, [sortedEntries, currentPage, pageSize])
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedEntries.length / pageSize)
  
  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProduct, dateRange, sortOrder])
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data Refreshed",
        description: `${type === "production" ? "Production" : "Disposal"} data has been updated`,
      })
    }, 800)
  }
  
  return (
    <Card className="w-full dark:border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50"
            >
              {sortOrder === "desc" ? (
                <>
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Newest
                </>
              ) : (
                <>
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Oldest
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {allowFiltering && (
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
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
            
            <div className="flex flex-row gap-3">
              <div className="w-full sm:w-[180px]">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DateRangePicker
                value={dateRange}
                onValueChange={setDateRange}
                align="end"
                className="w-[250px]"
              />
            </div>
          </div>
        )}
        
        {sortedEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || selectedProduct !== "all" || dateRange
              ? "No matching entries found"
              : `No ${type} entries found`}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {paginatedEntries.map((entry) => (
                <EntryDetailView 
                  key={entry.id} 
                  entry={entry} 
                  type={type} 
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
            
            <div className="text-xs text-muted-foreground text-center mt-4">
              Showing {paginatedEntries.length} of {sortedEntries.length} entries
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 