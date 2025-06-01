"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { Search, Filter, RefreshCw, FileText, Trash2, BarChart3, InfoIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { formatDate, formatNumber } from "@/lib/utils"
import { useData } from "@/components/providers/data-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EntryDetailsViewProps {
  type: "production" | "disposal"
  title: string
  description: string
}

const ITEMS_PER_PAGE = 5

export function EntryDetailsView({ type, title, description }: EntryDetailsViewProps) {
  const { productionEntries, disposalEntries, refreshData, deleteProductionEntry, deleteDisposalEntry } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  // Get entries based on type
  const entries = type === "production" ? productionEntries : disposalEntries

  // Get unique products
  const products = useMemo(() => {
    const uniqueProducts = new Set(entries.map(entry => entry.product_name))
    return Array.from(uniqueProducts).sort()
  }, [entries])

  // Filter entries based on search term, product, and date range
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = 
        (entry.product_name ? entry.product_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.staff_name ? entry.staff_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
      
      const entryDate = new Date(entry.date)
      const isInDateRange = dateRange?.from && dateRange?.to
        ? entryDate >= dateRange.from && entryDate <= dateRange.to
        : true
      
      if (type === "disposal" && 'reason' in entry) {
        return matchesSearch && matchesProduct && isInDateRange && 
          (entry.reason ? entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      }
      
      return matchesSearch && matchesProduct && isInDateRange
    })
  }, [entries, searchTerm, selectedProduct, dateRange, type])

  // Sort entries by date
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [filteredEntries, sortOrder])

  // Get paginated entries
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedEntries, currentPage])

  // Calculate total pages
  const totalPages = Math.ceil(sortedEntries.length / ITEMS_PER_PAGE)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

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

  // Handle delete
  const handleDelete = async (entry: ProductionEntry | DisposalEntry) => {
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

  // Export data to CSV
  const exportToCSV = () => {
    if (sortedEntries.length === 0) return
    
    // Get headers based on type
    const headers = type === "production" 
      ? ["Product", "Quantity", "Date", "Shift", "Staff", "Notes"]
      : ["Product", "Quantity", "Date", "Shift", "Staff", "Reason", "Notes"]
    
    // Convert data to CSV format
    const csvRows = []
    csvRows.push(headers.join(','))
    
    for (const entry of sortedEntries) {
      const values = type === "production"
        ? [
            entry.product_name,
            entry.quantity,
            format(new Date(entry.date), "yyyy-MM-dd"),
            entry.shift,
            entry.staff_name,
            entry.notes || ""
          ]
        : [
            entry.product_name,
            entry.quantity,
            format(new Date(entry.date), "yyyy-MM-dd"),
            entry.shift,
            entry.staff_name,
            (entry as DisposalEntry).reason || "",
            entry.notes || ""
          ]
      csvRows.push(values.join(','))
    }
    
    // Create downloadable link
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${type}-data-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Successful",
      description: `${type === "production" ? "Production" : "Disposal"} data has been exported to CSV`,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToCSV}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-4">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DateRangePicker
                  value={dateRange}
                  onValueChange={setDateRange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Entries</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                    <div>Product</div>
                    <div>Quantity</div>
                    <div>Date</div>
                    <div>Staff</div>
                    <div>Shift</div>
                    <div>Actions</div>
                  </div>
                  <div className="divide-y">
                    {paginatedEntries.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                        <div className="font-medium">{entry.product_name}</div>
                        <div>
                          <Badge variant={type === "production" ? "default" : "destructive"}>
                            {type === "production" ? <BarChart3 className="mr-1 h-3 w-3" /> : <Trash2 className="mr-1 h-3 w-3" />}
                            {formatNumber(entry.quantity)}
                          </Badge>
                        </div>
                        <div>{formatDate(entry.date.toString())}</div>
                        <div>{entry.staff_name}</div>
                        <div>{entry.shift}</div>
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                            onClick={() => handleDelete(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedEntries.length)} of {sortedEntries.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        const pageNumber = i + 1
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                      {totalPages > 3 && (
                        <span className="text-sm text-muted-foreground">...</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="today" className="mt-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                    <div>Product</div>
                    <div>Quantity</div>
                    <div>Date</div>
                    <div>Staff</div>
                    <div>Shift</div>
                    <div>Actions</div>
                  </div>
                  <div className="divide-y">
                    {sortedEntries
                      .filter(entry => {
                        const entryDate = new Date(entry.date)
                        const today = new Date()
                        return entryDate.toDateString() === today.toDateString()
                      })
                      .slice(0, ITEMS_PER_PAGE)
                      .map((entry) => (
                        <div key={entry.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                          <div className="font-medium">{entry.product_name}</div>
                          <div>
                            <Badge variant={type === "production" ? "default" : "destructive"}>
                              {type === "production" ? <BarChart3 className="mr-1 h-3 w-3" /> : <Trash2 className="mr-1 h-3 w-3" />}
                              {formatNumber(entry.quantity)}
                            </Badge>
                          </div>
                          <div>{formatDate(entry.date.toString())}</div>
                          <div>{entry.staff_name}</div>
                          <div>{entry.shift}</div>
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                              onClick={() => handleDelete(entry)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="week" className="mt-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                    <div>Product</div>
                    <div>Quantity</div>
                    <div>Date</div>
                    <div>Staff</div>
                    <div>Shift</div>
                    <div>Actions</div>
                  </div>
                  <div className="divide-y">
                    {sortedEntries
                      .filter(entry => {
                        const entryDate = new Date(entry.date)
                        const today = new Date()
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                        return entryDate >= weekAgo && entryDate <= today
                      })
                      .slice(0, ITEMS_PER_PAGE)
                      .map((entry) => (
                        <div key={entry.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                          <div className="font-medium">{entry.product_name}</div>
                          <div>
                            <Badge variant={type === "production" ? "default" : "destructive"}>
                              {type === "production" ? <BarChart3 className="mr-1 h-3 w-3" /> : <Trash2 className="mr-1 h-3 w-3" />}
                              {formatNumber(entry.quantity)}
                            </Badge>
                          </div>
                          <div>{formatDate(entry.date.toString())}</div>
                          <div>{entry.staff_name}</div>
                          <div>{entry.shift}</div>
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                              onClick={() => handleDelete(entry)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {sortedEntries.length === 0 && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>No entries found</AlertTitle>
                <AlertDescription>
                  There are no {type} entries matching your filters. Try adjusting your search criteria.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 