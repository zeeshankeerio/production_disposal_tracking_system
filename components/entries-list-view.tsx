"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { Search, X, ArrowDown, ArrowUp, Filter, RefreshCw, FileText } from "lucide-react"
import { EntryDetailView } from "@/components/entry-detail-view"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { useData } from "@/components/providers/data-provider"
import { useToast } from "@/components/ui/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { UI_CONFIG } from "@/lib/config"
import { formatNumber, formatDate } from "@/lib/utils"

interface EntriesListViewProps {
  entries: (ProductionEntry | DisposalEntry)[]
  title: string
  description?: string
  type: "production" | "disposal"
  pageSize?: number
  allowFiltering?: boolean
}

type DateFilterType = "today" | "thisWeek" | "thisMonth" | "thisYear" | "custom"

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilterType>("thisMonth")
  
  // From date states
  const [fromDay, setFromDay] = useState<string>(formatDate(new Date(), "dd"))
  const [fromMonth, setFromMonth] = useState<string>(formatDate(new Date(), "MM"))
  const [fromYear, setFromYear] = useState<string>(formatDate(new Date(), "yyyy"))
  
  // To date states
  const [toDay, setToDay] = useState<string>(formatDate(new Date(), "dd"))
  const [toMonth, setToMonth] = useState<string>(formatDate(new Date(), "MM"))
  const [toYear, setToYear] = useState<string>(formatDate(new Date(), "yyyy"))
  
  const { products, refreshData } = useData()
  const { toast } = useToast()
  
  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category))
    return Array.from(uniqueCategories).sort()
  }, [products])
  
  // Type guard to check if an entry is a DisposalEntry
  const isDisposalEntry = (entry: ProductionEntry | DisposalEntry): entry is DisposalEntry => {
    return 'reason' in entry
  }

  // Helper function to create a date object with time set to start of day
  const startOfDay = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Helper function to create a date object with time set to end of day
  const endOfDay = (date: Date) => {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  // Helper function to create a date from day, month, and year
  const createDate = (day: string, month: string, year: string) => {
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Helper function to compare dates without time
  const compareDates = (date1: Date, date2: Date) => {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
    return d1.getTime() === d2.getTime()
  }

  // Helper function to check if a date is between two dates (inclusive)
  const isDateBetween = (date: Date, start: Date, end: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    return d >= s && d <= e
  }

  // Get date range based on selected filter
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateFilter) {
      case "today":
        return {
          start: today,
          end: today
        }
      case "thisWeek":
        const weekStart = startOfWeek(today, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
        return {
          start: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
          end: new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate())
        }
      case "thisMonth":
        const monthStart = startOfMonth(today)
        const monthEnd = endOfMonth(today)
        return {
          start: new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate()),
          end: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate())
        }
      case "thisYear":
        const yearStart = startOfYear(today)
        const yearEnd = endOfYear(today)
        return {
          start: new Date(yearStart.getFullYear(), yearStart.getMonth(), yearStart.getDate()),
          end: new Date(yearEnd.getFullYear(), yearEnd.getMonth(), yearEnd.getDate())
        }
      case "custom":
        const fromDate = createDate(fromDay, fromMonth, fromYear)
        const toDate = createDate(toDay, toMonth, toYear)
        return {
          start: new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()),
          end: new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
        }
      default:
        const defaultStart = startOfMonth(today)
        const defaultEnd = endOfMonth(today)
        return {
          start: new Date(defaultStart.getFullYear(), defaultStart.getMonth(), defaultStart.getDate()),
          end: new Date(defaultEnd.getFullYear(), defaultEnd.getMonth(), defaultEnd.getDate())
        }
    }
  }
  
  // Filter entries based on search term, product, category, and date range
  const filteredEntries = useMemo(() => {
    const { start, end } = getDateRange()
    
    return entries.filter(entry => {
      const matchesSearch = searchTerm ? (
        (entry.product_name ? entry.product_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.staff_name ? entry.staff_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (isDisposalEntry(entry) && entry.reason ? entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      ) : true
      
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
      
      const matchesCategory = selectedCategory === "all" || 
        products.find(p => p.name === entry.product_name)?.category === selectedCategory
      
      // Create date object and compare only the date part
      const entryDate = new Date(entry.date)
      const isInDateRange = isDateBetween(entryDate, start, end)
      
      return matchesSearch && matchesProduct && matchesCategory && isInDateRange
    })
  }, [entries, searchTerm, selectedProduct, selectedCategory, dateFilter, 
      fromDay, fromMonth, fromYear, toDay, toMonth, toYear, products])
  
  // Sort entries by date
  const sortedEntries = useMemo(() => {
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
  }, [searchTerm, selectedProduct, selectedCategory, dateFilter, 
      fromDay, fromMonth, fromYear, toDay, toMonth, toYear, sortOrder])
  
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
  
  // Handle export to CSV
  const handleExport = () => {
    if (sortedEntries.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No entries match the current filters",
        variant: "destructive"
      })
      return
    }
    
    // Get headers based on entry type
    const headers = type === "production" 
      ? ["Product", "Category", "Quantity", "Date", "Staff", "Shift", "Notes", "Expiration Date"]
      : ["Product", "Category", "Quantity", "Date", "Reason", "Staff", "Shift", "Notes"]
    
    // Convert data to CSV format
    const csvRows = []
    
    // Add filter information at the top
    csvRows.push("Export Filters")
    if (selectedProduct !== "all") {
      csvRows.push(`Product Filter: ${selectedProduct}`)
    }
    if (selectedCategory !== "all") {
      csvRows.push(`Category Filter: ${selectedCategory}`)
    }
    if (type === "disposal" && isDisposalEntry(sortedEntries[0])) {
      // Add disposal-specific filters if needed
    }
    csvRows.push(`Date Filter: ${dateFilter}`)
    if (dateFilter === "custom") {
      csvRows.push(`From: ${fromMonth}/${fromDay}/${fromYear}`)
      csvRows.push(`To: ${toMonth}/${toDay}/${toYear}`)
    }
    csvRows.push(`Sort Order: ${sortOrder === "desc" ? "Newest First" : "Oldest First"}`)
    csvRows.push("") // Empty row for spacing
    
    // Add summary information
    csvRows.push("Summary")
    csvRows.push(`Total Entries: ${sortedEntries.length}`)
    csvRows.push("") // Empty row for spacing
    
    // Add the actual data with headers
    csvRows.push(headers.join(','))
    
    for (const entry of sortedEntries) {
      // Find the product's category
      const product = products.find(p => p.name === entry.product_name)
      const category = product?.category || "Unknown"
      
      const values = type === "production" 
        ? [
            entry.product_name,
            category,
            entry.quantity,
            formatDate(entry.date, "short"),
            entry.staff_name,
            entry.shift || "",
            entry.notes || "",
            type === "production" && 'expiration_date' in entry ? formatDate(entry.expiration_date, "short") : ""
          ]
        : [
            entry.product_name,
            category,
            entry.quantity,
            formatDate(entry.date, "short"),
            isDisposalEntry(entry) ? entry.reason : "",
            entry.staff_name,
            entry.shift || "",
            entry.notes || ""
          ]
      
      csvRows.push(values.map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    }
    
    // Create downloadable link with UTF-8 BOM
    const BOM = '\uFEFF'
    const csvContent = BOM + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Create filename with filter information
    let filename = `${type}-entries`
    if (selectedCategory !== "all") {
      filename += `-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`
    }
    if (selectedProduct !== "all") {
      filename += `-${selectedProduct.toLowerCase().replace(/\s+/g, '-')}`
    }
    filename += `-${formatDate(new Date(), "short")}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export Successful",
      description: `Exported ${sortedEntries.length} ${type} entries to CSV`,
    })
  }
  
  return (
    <Card className="w-full dark:border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={sortedEntries.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allowFiltering && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[200px]"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
              </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products
                      .filter(p => selectedCategory === "all" || p.category === selectedCategory)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.name}>
                          {product.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={(value: DateFilterType) => setDateFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>

                {dateFilter === "custom" && (
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">From:</span>
                      <Select value={fromDay} onValueChange={setFromDay}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: new Date(parseInt(fromYear), parseInt(fromMonth), 0).getDate() },
                            (_, i) => i + 1
                          ).map((day) => (
                            <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={fromMonth} onValueChange={(value) => {
                        setFromMonth(value)
                        // Reset day if it's invalid for the new month
                        const daysInMonth = new Date(parseInt(fromYear), parseInt(value), 0).getDate()
                        if (parseInt(fromDay) > daysInMonth) {
                          setFromDay(daysInMonth.toString().padStart(2, '0'))
                        }
                      }}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                              {formatDate(new Date(2000, month - 1), 'MMMM')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={fromYear} onValueChange={(value) => {
                        setFromYear(value)
                        // Reset day if it's invalid for the new year/month
                        const daysInMonth = new Date(parseInt(value), parseInt(fromMonth), 0).getDate()
                        if (parseInt(fromDay) > daysInMonth) {
                          setFromDay(daysInMonth.toString().padStart(2, '0'))
                        }
                      }}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">To:</span>
                      <Select value={toDay} onValueChange={setToDay}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: new Date(parseInt(toYear), parseInt(toMonth), 0).getDate() },
                            (_, i) => i + 1
                          ).map((day) => (
                            <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={toMonth} onValueChange={(value) => {
                        setToMonth(value)
                        // Reset day if it's invalid for the new month
                        const daysInMonth = new Date(parseInt(toYear), parseInt(value), 0).getDate()
                        if (parseInt(toDay) > daysInMonth) {
                          setToDay(daysInMonth.toString().padStart(2, '0'))
                        }
                      }}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                              {formatDate(new Date(2000, month - 1), 'MMMM')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={toYear} onValueChange={(value) => {
                        setToYear(value)
                        // Reset day if it's invalid for the new year/month
                        const daysInMonth = new Date(parseInt(value), parseInt(toMonth), 0).getDate()
                        if (parseInt(toDay) > daysInMonth) {
                          setToDay(daysInMonth.toString().padStart(2, '0'))
                        }
                      }}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedProduct("all")
                    setSelectedCategory("all")
                    setDateFilter("thisMonth")
                    const now = new Date()
                    setFromDay(formatDate(now, "dd"))
                    setFromMonth(formatDate(now, "MM"))
                    setFromYear(formatDate(now, "yyyy"))
                    setToDay(formatDate(now, "dd"))
                    setToMonth(formatDate(now, "MM"))
                    setToYear(formatDate(now, "yyyy"))
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {sortedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedProduct !== "all" || selectedCategory !== "all" || dateFilter
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
        </div>
      </CardContent>
    </Card>
  )
}