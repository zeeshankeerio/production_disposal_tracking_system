"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DisposalForm } from "@/components/disposal-form"
import { useData } from "@/components/providers/data-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format, subDays, isValid, isSameDay, isWithinInterval } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, RefreshCw, FileText, PackageMinus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { DisposalEntry } from "@/lib/types"
import { PageRecentEntries } from "@/components/page-recent-entries"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"
import { EntriesListView } from "@/components/entries-list-view"
import { DigitalClock } from "@/components/digital-clock"
import { toEastern, formatDate } from '@/lib/date-utils'

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm dark:bg-background/90 dark:border-border/50">
        <p className="text-sm font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center text-xs">
            <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="font-medium">{entry.name}: </span>
            <span className="ml-1">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Helper function to get date range for predefined periods
const getDateRangeForPeriod = (period: string): DateRange => {
  const now = new Date();
  const today = toEastern(now);
  
  // For today's date, we want to ensure we're using the current date in Eastern time
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  switch(period) {
    case "today":
      return { from: startDate, to: endDate };
    case "week":
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { from: weekStart, to: endDate };
    case "month":
      const monthStart = new Date(startDate);
      monthStart.setDate(1);
      return { from: monthStart, to: endDate };
    case "three_months":
      const threeMonthsStart = new Date(startDate);
      threeMonthsStart.setMonth(threeMonthsStart.getMonth() - 3);
      return { from: threeMonthsStart, to: endDate };
    case "quarter":
      const quarterStart = new Date(startDate);
      const currentQuarter = Math.floor(quarterStart.getMonth() / 3);
      quarterStart.setMonth(currentQuarter * 3);
      quarterStart.setDate(1);
      return { from: quarterStart, to: endDate };
    case "year":
      const yearStart = new Date(startDate);
      yearStart.setMonth(0);
      yearStart.setDate(1);
      return { from: yearStart, to: endDate };
    case "all":
      const allTimeStart = new Date(startDate);
      allTimeStart.setFullYear(allTimeStart.getFullYear() - 5);
      allTimeStart.setMonth(0);
      allTimeStart.setDate(1);
      return { from: allTimeStart, to: endDate };
    default:
      return { from: startDate, to: endDate };
  }
};

// Add these helper functions at the top of the file, after the imports
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const isValidDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(year, month, day);
  return date.getFullYear() === year && 
         date.getMonth() === month && 
         date.getDate() === day;
};

// Add this helper function at the top of the file
const formatShift = (shift: string): string => {
  switch (shift) {
    case "morning": return "Morning";
    case "afternoon": return "Afternoon";
    case "night": return "Night";
    default: return "Unknown";
  }
};

export default function DisposalPage() {
  const { disposalEntries, products, isLoading, refreshData } = useData()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedReason, setSelectedReason] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)
  const { toast } = useToast()
  const [activeView, setActiveView] = useState<"today" | "week" | "month" | "three_months" | "quarter" | "year">("today")
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [lastEntryCount, setLastEntryCount] = useState(disposalEntries.length)
  
  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Effect to detect new entries and trigger refresh
  useEffect(() => {
    if (disposalEntries.length > lastEntryCount) {
      // New entry was added, trigger refresh after 2 seconds
      const timer = setTimeout(() => {
        handleRefresh()
      }, 2000)
      
      // Update the last entry count
      setLastEntryCount(disposalEntries.length)
      
      return () => clearTimeout(timer)
    }
  }, [disposalEntries.length])
  
  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category))
    return Array.from(uniqueCategories).sort()
  }, [products])
  
  // Update the filtering logic
  const filteredDisposalEntries = useMemo(() => {
    if (!disposalEntries || disposalEntries.length === 0) return []
    
    return disposalEntries.filter(entry => {
      if (!entry || typeof entry.quantity !== 'number') return false
      
      // Apply search filter
      const matchesSearch = searchTerm === "" || 
        entry.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.shift?.toLowerCase().includes(searchTerm.toLowerCase())

      // Apply product filter
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct

      // Apply category filter
      const matchesCategory = selectedCategory === "all" || 
        products.find(p => p.name === entry.product_name)?.category === selectedCategory

      // Apply reason filter
      const matchesReason = selectedReason === "all" || entry.reason === selectedReason

      // Apply date filter
      if (!dateRange?.from) return matchesSearch && matchesProduct && matchesCategory && matchesReason

      // Convert entry date to Eastern timezone
      const entryDate = toEastern(new Date(entry.date))
      if (isNaN(entryDate.getTime())) return false

      // For today's date, we want to compare just the date part
      const entryDateOnly = new Date(entryDate)
      entryDateOnly.setHours(0, 0, 0, 0)

      const startDate = new Date(dateRange.from)
      startDate.setHours(0, 0, 0, 0)

      const endDate = dateRange.to ? new Date(dateRange.to) : startDate
      endDate.setHours(23, 59, 59, 999)

      // Check if entry date falls within the range
      const isInDateRange = isWithinInterval(entryDateOnly, {
        start: startDate,
        end: endDate
      })

      return matchesSearch && matchesProduct && matchesCategory && matchesReason && isInDateRange
    })
  }, [disposalEntries, dateRange, searchTerm, selectedProduct, selectedCategory, selectedReason, products])
  
  // Sort entries by date
  const sortedEntries = [...filteredDisposalEntries].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    if (!isValid(dateA) || !isValid(dateB)) return 0
    return sortOrder === "desc" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
  })
  
  // Calculate disposal statistics with proper validation
  const totalDisposal = useMemo(() => {
    if (!filteredDisposalEntries || filteredDisposalEntries.length === 0) return 0
    return filteredDisposalEntries.reduce((sum, entry) => {
      const quantity = Number(entry.quantity)
      return sum + (isNaN(quantity) ? 0 : quantity)
    }, 0)
  }, [filteredDisposalEntries])
  
  // Get unique products count with validation
  const uniqueProducts = useMemo(() => {
    if (!filteredDisposalEntries || filteredDisposalEntries.length === 0) return 0
    return new Set(filteredDisposalEntries.map(entry => entry.product_name)).size
  }, [filteredDisposalEntries])
  
  // Group disposal by date with validation
  const disposalByDate = useMemo(() => {
    if (!filteredDisposalEntries || filteredDisposalEntries.length === 0) return {}
    
    return filteredDisposalEntries.reduce((acc, entry) => {
      const date = new Date(entry.date)
      if (!isValid(date)) return acc
      
      const formattedDate = format(date, "MMM dd")
      if (!acc[formattedDate]) {
        acc[formattedDate] = 0
      }
      
      const quantity = Number(entry.quantity)
      acc[formattedDate] += isNaN(quantity) ? 0 : quantity
      return acc
    }, {} as Record<string, number>)
  }, [filteredDisposalEntries])
  
  // Convert to array for chart with validation
  const dateChartData = useMemo(() => {
    if (!disposalByDate) return []
    return Object.entries(disposalByDate)
      .map(([date, value]) => ({
        date,
        value: isNaN(value) ? 0 : value
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [disposalByDate])
  
  // Calculate shift distribution with validation
  const shiftDistribution = useMemo(() => {
    if (!filteredDisposalEntries || filteredDisposalEntries.length === 0) return {}
    
    return filteredDisposalEntries.reduce((acc, entry) => {
      const shift = entry.shift || 'Unspecified'
      if (!acc[shift]) {
        acc[shift] = 0
      }
      
      const quantity = Number(entry.quantity)
      acc[shift] += isNaN(quantity) ? 0 : quantity
      return acc
    }, {} as Record<string, number>)
  }, [filteredDisposalEntries])

  // Convert shift distribution to array for pie chart with validation
  const shiftChartData = useMemo(() => {
    if (!shiftDistribution) return []
    return Object.entries(shiftDistribution)
      .map(([name, value]) => ({
        name,
        value: isNaN(value) ? 0 : value
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [shiftDistribution])

  // Colors for pie chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data Refreshed",
        description: "Disposal data has been updated",
      })
    }, 800)
  }
  
  // Update the export function
  const exportToCSV = () => {
    if (sortedEntries.length === 0) return
    
    // Get headers from first object
    const headers = ["Product", "Category", "Quantity", "Date", "Reason", "Staff", "Shift", "Notes"]
    
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
    if (selectedReason !== "all") {
      csvRows.push(`Reason Filter: ${selectedReason}`)
    }
    if (dateRange?.from) {
      csvRows.push(`Date Range: ${formatDate(dateRange.from, "short")} to ${dateRange.to ? formatDate(dateRange.to, "short") : formatDate(dateRange.from, "short")}`)
    }
    csvRows.push(`Sort Order: ${sortOrder === "desc" ? "Newest First" : "Oldest First"}`)
    csvRows.push("") // Empty row for spacing
    
    // Add summary information
    csvRows.push("Summary")
    csvRows.push(`Total Entries: ${sortedEntries.length}`)
    csvRows.push(`Total Disposal: ${totalDisposal}`)
    csvRows.push(`Unique Products: ${uniqueProducts}`)
    csvRows.push("") // Empty row for spacing
    
    // Add shift distribution summary
    const shiftSummary = new Map<string, number>()
    sortedEntries.forEach(entry => {
      const shift = formatShift(entry.shift)
      shiftSummary.set(shift, (shiftSummary.get(shift) || 0) + entry.quantity)
    })
    csvRows.push("Shift Distribution")
    for (const [shift, quantity] of shiftSummary) {
      csvRows.push(`${shift}: ${quantity}`)
    }
    csvRows.push("") // Empty row for spacing
    
    // Add the actual data with headers
    csvRows.push(headers.join(','))
    
    for (const entry of sortedEntries) {
      // Find the product's category
      const product = products.find(p => p.name === entry.product_name)
      const category = product?.category || "Unknown"
      
      const values = [
        entry.product_name,
        category,
        entry.quantity,
        formatDate(entry.date, "short"),
        entry.reason,
        entry.staff_name,
        formatShift(entry.shift),
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
    
    // Add filter information to filename if filters are applied
    let filename = 'disposal-data'
    if (selectedCategory !== "all") {
      filename += `-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`
    }
    if (selectedProduct !== "all") {
      filename += `-${selectedProduct.toLowerCase().replace(/\s+/g, '-')}`
    }
    if (selectedReason !== "all") {
      filename += `-${selectedReason.toLowerCase().replace(/\s+/g, '-')}`
    }
    if (dateRange?.from) {
      filename += `-${formatDate(dateRange.from, "short")}`
      if (dateRange.to && !isSameDay(dateRange.from, dateRange.to)) {
        filename += `-to-${formatDate(dateRange.to, "short")}`
      }
    }
    filename += `.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export Successful",
      description: `Exported ${sortedEntries.length} filtered disposal entries to CSV`,
    })
  }
  
  // Update the date range handlers
  const handleFromDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    const currentDate = tempDateRange?.from || new Date();
    const newDate = toEastern(new Date(currentDate));
    
    switch(type) {
      case 'year':
        newDate.setFullYear(parseInt(value));
        break;
      case 'month':
        newDate.setMonth(parseInt(value));
        break;
      case 'day':
        newDate.setDate(parseInt(value));
        break;
    }
    
    // If to date is not set or is the same as from date, update both
    if (!tempDateRange?.to || isSameDay(newDate, toEastern(new Date(tempDateRange.to)))) {
      setTempDateRange({ from: newDate, to: newDate });
    } else {
      setTempDateRange((prev: DateRange | undefined) => prev ? { ...prev, from: newDate } : { from: newDate, to: newDate });
    }
  };

  const handleToDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    const currentDate = tempDateRange?.to || new Date();
    const newDate = toEastern(new Date(currentDate));
    
    switch(type) {
      case 'year':
        newDate.setFullYear(parseInt(value));
        break;
      case 'month':
        newDate.setMonth(parseInt(value));
        break;
      case 'day':
        newDate.setDate(parseInt(value));
        break;
    }
    
    // If from date is not set, set it to the same date
    if (!tempDateRange?.from) {
      setTempDateRange({ from: newDate, to: newDate });
    } else {
      setTempDateRange((prev: DateRange | undefined) => prev ? { ...prev, to: newDate } : { from: newDate, to: newDate });
    }
  };
  
  // Update the submit handler
  const handleSubmit = () => {
    if (tempDateRange?.from) {
      const fromDate = new Date(tempDateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = tempDateRange.to ? new Date(tempDateRange.to) : fromDate;
      toDate.setHours(23, 59, 59, 999);
      
      setDateRange({ from: fromDate, to: toDate });
    }
  };

  // Update the handleClear function
  const handleClear = () => {
    const now = new Date();
    const today = toEastern(now);
    today.setHours(23, 59, 59, 999);
    
    const startDate = new Date(2010, 0, 1); // January 1, 2010
    startDate.setHours(0, 0, 0, 0);
    
    setTempDateRange({ from: startDate, to: today });
    setDateRange({ from: startDate, to: today });
    setActiveView("today");
  };
  
  if (!mounted) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disposal Management</h1>
            <p className="text-muted-foreground">
              Track and manage your disposal data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }
  
  return (
    <div className="w-full px-4 py-10 space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-background via-background/95 to-background/90 border border-border/50 rounded-xl p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <PackageMinus className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Disposal Management
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Track and manage your disposal data with precision
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="transition-all hover:shadow-md hover:bg-accent/50 border-border/50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                disabled={sortedEntries.length === 0}
                className="transition-all hover:shadow-md hover:bg-accent/50 border-border/50"
              >
                <FileText className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <DigitalClock />
          </div>
        </div>
      </div>
      
      <QuickNav />
      
      {/* Add category filter before the date range filter buttons */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
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
        
        {/* Existing date range filter buttons */}
        <Button
          variant={activeView === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDateRange(getDateRangeForPeriod("today"));
            setActiveView("today");
          }}
        >
          Today
        </Button>
        <Button
          variant={activeView === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDateRange(getDateRangeForPeriod("week"));
            setActiveView("week");
          }}
        >
          This Week
        </Button>
        <Button
          variant={activeView === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDateRange(getDateRangeForPeriod("month"));
            setActiveView("month");
          }}
        >
          This Month
        </Button>
        <Button
          variant={activeView === "three_months" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDateRange(getDateRangeForPeriod("three_months"));
            setActiveView("three_months");
          }}
        >
          Last 3 Months
        </Button>
        <Button
          variant={activeView === "quarter" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDateRange(getDateRangeForPeriod("quarter"));
            setActiveView("quarter");
          }}
        >
          This Quarter
        </Button>
        <Button
          variant={activeView === "year" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDateRange(getDateRangeForPeriod("year"));
            setActiveView("year");
          }}
        >
          This Year
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
            <CardHeader>
              <CardTitle>Add New Disposal Entry</CardTitle>
              <CardDescription>
                Record new disposal entries with product details and quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisposalForm />
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
            <CardHeader>
              <CardTitle>Disposal Statistics</CardTitle>
              <CardDescription>
                Overview of your disposal data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Total Disposal</h3>
                  <p className="text-2xl font-bold">{totalDisposal.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Unique Products</h3>
                  <p className="text-2xl font-bold">{uniqueProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
            <CardHeader>
              <CardTitle>Disposal by Date</CardTitle>
              <CardDescription>
                Daily disposal quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dateChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Quantity" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
            <CardHeader>
              <CardTitle>Entries by Shift</CardTitle>
              <CardDescription>
                Distribution of entries across different shifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shiftChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {shiftChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm dark:bg-background/90 dark:border-border/50">
                              <p className="text-sm font-semibold">{payload[0].name}</p>
                              <p className="text-sm">Entries: {payload[0].value}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Entries Section */}
      <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
        <CardContent>
          <EntriesListView
            entries={disposalEntries}
            title="All Disposal Entries"
            description="Complete list of disposal records"
            type="disposal"
            pageSize={10}
            allowFiltering={true}
          />
        </CardContent>
      </Card>
      
      <CopyrightFooter />
    </div>
  )
} 