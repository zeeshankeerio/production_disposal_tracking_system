"use client"

import { useState, useEffect } from "react"
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
import { Search, Filter, RefreshCw, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { DisposalEntry } from "@/lib/types"
import { PageRecentEntries } from "@/components/page-recent-entries"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"
import { EntriesListView } from "@/components/entries-list-view"

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
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  
  switch(period) {
    case "today":
      return { from: startDate, to: today }
    case "yesterday":
      const yesterday = new Date(startDate)
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: yesterday, to: yesterday }
    case "week":
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() - 7)
      return { from: weekStart, to: today }
    case "month":
      const monthStart = new Date(startDate)
      monthStart.setDate(monthStart.getDate() - 30)
      return { from: monthStart, to: today }
    case "quarter":
      const quarterStart = new Date(startDate)
      quarterStart.setDate(quarterStart.getDate() - 90)
      return { from: quarterStart, to: today }
    case "year":
      const yearStart = new Date(startDate)
      yearStart.setDate(yearStart.getDate() - 365)
      return { from: yearStart, to: today }
    default:
      return { from: startDate, to: today }
  }
}

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

export default function DisposalPage() {
  const { disposalEntries, products, isLoading, refreshData } = useData()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)
  const { toast } = useToast()
  
  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Filter entries based on search term, product, and date range
  const filteredEntries = disposalEntries.filter(entry => {
    const matchesSearch = 
      (entry.product_name ? entry.product_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
      (entry.staff_name ? entry.staff_name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
      (entry.reason ? entry.reason.toLowerCase() : '').includes(searchTerm.toLowerCase())
    
    const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
    
    const entryDate = new Date(entry.date)
    if (isNaN(entryDate.getTime())) return false
    
    // Set time to start of day for entry date
    entryDate.setHours(0, 0, 0, 0)
    
    // If no date range is selected, show all entries
    if (!dateRange?.from) return matchesSearch && matchesProduct
    
    // If only from date is selected, treat it as a single day filter
    if (!dateRange.to) {
      const singleDay = new Date(dateRange.from)
      singleDay.setHours(0, 0, 0, 0)
      return isSameDay(entryDate, singleDay) && matchesSearch && matchesProduct
    }
    
    // For date range, set proper start and end times
    const startDate = new Date(dateRange.from)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dateRange.to)
    endDate.setHours(23, 59, 59, 999)
    
    // Check if entry date falls within the range
    const isInDateRange = isWithinInterval(entryDate, {
      start: startDate,
      end: endDate
    })
    
    return isInDateRange && matchesSearch && matchesProduct
  })
  
  // Sort entries by date
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    if (!isValid(dateA) || !isValid(dateB)) return 0
    return sortOrder === "desc" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
  })
  
  // Calculate disposal statistics
  const totalDisposal = filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0)
  
  // Get unique products count
  const uniqueProducts = new Set(filteredEntries.map(entry => entry.product_name)).size
  
  // Group disposal by date
  const disposalByDate = filteredEntries.reduce((acc, entry) => {
    const date = new Date(entry.date)
    if (!isValid(date)) return acc
    const formattedDate = format(date, "MMM dd")
    if (!acc[formattedDate]) {
      acc[formattedDate] = 0
    }
    acc[formattedDate] += entry.quantity
    return acc
  }, {} as Record<string, number>)
  
  // Convert to array for chart
  const dateChartData = Object.entries(disposalByDate).map(([date, value]) => ({
    date,
    value
  }))
  
  // Calculate shift distribution
  const shiftDistribution = filteredEntries.reduce((acc, entry) => {
    const shift = entry.shift || 'Unspecified'
    if (!acc[shift]) {
      acc[shift] = 0
    }
    acc[shift]++
    return acc
  }, {} as Record<string, number>)

  // Convert shift distribution to array for pie chart
  const shiftChartData = Object.entries(shiftDistribution).map(([name, value]) => ({
    name,
    value
  }))

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
  
  // Export data to CSV
  const exportToCSV = () => {
    if (sortedEntries.length === 0) return
    
    // Get headers from first object
    const headers = ["Product", "Quantity", "Date", "Reason", "Staff"]
    
    // Convert data to CSV format
    const csvRows = []
    csvRows.push(headers.join(','))
    
    for (const entry of sortedEntries) {
      const values = [
        entry.product_name,
        entry.quantity,
        format(new Date(entry.date), "yyyy-MM-dd"),
        entry.reason,
        entry.staff_name
      ]
      csvRows.push(values.join(','))
    }
    
    // Create downloadable link
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `disposal-data-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Successful",
      description: `Disposal data has been exported to CSV`,
    })
  }
  
  // Add the handlers inside the component
  const handleFromDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    const currentDate = dateRange?.from || new Date();
    const newDate = new Date(currentDate);
    
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
    
    setDateRange((prev: DateRange | undefined) => prev ? { ...prev, from: newDate } : { from: newDate, to: newDate });
  };

  const handleToDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    const currentDate = dateRange?.to || new Date();
    const newDate = new Date(currentDate);
    
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
    
    setDateRange((prev: DateRange | undefined) => prev ? { ...prev, to: newDate } : { from: newDate, to: newDate });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Disposal Management</h2>
          <p className="text-muted-foreground">
            Track and manage your disposal data
          </p>
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
            onClick={exportToCSV}
            className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <QuickNav />
      
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
        <CardHeader>
          <CardTitle>Detailed Entries</CardTitle>
          <CardDescription>
            View and manage all disposal entries with advanced filtering and sorting options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b pb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">From:</span>
                  <Select
                    value={dateRange?.from ? dateRange.from.getFullYear().toString() : new Date().getFullYear().toString()}
                    onValueChange={(year) => handleFromDateChange('year', year)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={dateRange?.from ? dateRange.from.getMonth().toString() : new Date().getMonth().toString()}
                    onValueChange={(month) => handleFromDateChange('month', month)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => ({
                        value: i.toString(),
                        label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
                      })).map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={dateRange?.from ? dateRange.from.getDate().toString() : new Date().getDate().toString()}
                    onValueChange={(day) => handleFromDateChange('day', day)}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: getDaysInMonth(
                          dateRange?.from ? dateRange.from.getFullYear() : new Date().getFullYear(),
                          dateRange?.from ? dateRange.from.getMonth() : new Date().getMonth()
                        )},
                        (_, i) => i + 1
                      ).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Till:</span>
                  <Select
                    value={dateRange?.to ? dateRange.to.getFullYear().toString() : new Date().getFullYear().toString()}
                    onValueChange={(year) => handleToDateChange('year', year)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={dateRange?.to ? dateRange.to.getMonth().toString() : new Date().getMonth().toString()}
                    onValueChange={(month) => handleToDateChange('month', month)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => ({
                        value: i.toString(),
                        label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
                      })).map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={dateRange?.to ? dateRange.to.getDate().toString() : new Date().getDate().toString()}
                    onValueChange={(day) => handleToDateChange('day', day)}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: getDaysInMonth(
                          dateRange?.to ? dateRange.to.getFullYear() : new Date().getFullYear(),
                          dateRange?.to ? dateRange.to.getMonth() : new Date().getMonth()
                        )},
                        (_, i) => i + 1
                      ).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange(undefined);
                  }}
                  className="h-8"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
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