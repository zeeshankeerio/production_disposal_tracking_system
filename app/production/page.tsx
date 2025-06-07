"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductionForm } from "@/components/production-form"
import { useData } from "@/components/providers/data-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, RefreshCw, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ProductionEntry } from "@/lib/types"
import { PageRecentEntries } from "@/components/page-recent-entries"
import { EntriesListView } from "@/components/entries-list-view"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"
import { isSameDay, isWithinInterval } from "date-fns"
import { toEastern } from '@/lib/date-utils'

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

export default function ProductionPage() {
  const { productionEntries, products, isLoading, refreshData } = useData()
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
  const [activeView, setActiveView] = useState("all")
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Update the filtering logic
  const filteredProductionEntries = useMemo(() => {
    return productionEntries.filter(entry => {
      // Apply search filter
      const matchesSearch = searchTerm === "" || 
        entry.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.shift?.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply product filter
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct;

      // Apply date filter
      if (!dateRange?.from) return matchesSearch && matchesProduct;

      // Convert entry date to Eastern timezone
      const entryDate = toEastern(new Date(entry.date));
      if (isNaN(entryDate.getTime())) return false;

      // For today's date, we want to compare just the date part
      const entryDateOnly = new Date(entryDate);
      entryDateOnly.setHours(0, 0, 0, 0);

      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = dateRange.to ? new Date(dateRange.to) : startDate;
      endDate.setHours(23, 59, 59, 999);

      // Check if entry date falls within the range
      const isInDateRange = isWithinInterval(entryDateOnly, {
        start: startDate,
        end: endDate
      });

      return matchesSearch && matchesProduct && isInDateRange;
    });
  }, [productionEntries, dateRange, searchTerm, selectedProduct]);
  
  // Sort entries by date
  const sortedEntries = [...filteredProductionEntries].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })
  
  // Calculate production statistics
  const totalProduction = filteredProductionEntries.reduce((sum, entry) => sum + entry.quantity, 0)
  
  // Get unique products count
  const uniqueProducts = new Set(filteredProductionEntries.map(entry => entry.product_name)).size
  
  // Group production by date
  const productionByDate = filteredProductionEntries.reduce((acc, entry) => {
    const date = format(new Date(entry.date), "MMM dd")
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += entry.quantity
    return acc
  }, {} as Record<string, number>)
  
  // Convert to array for chart
  const dateChartData = Object.entries(productionByDate).map(([date, value]) => ({
    date,
    value
  }))
  
  // Calculate shift distribution
  const shiftDistribution = filteredProductionEntries.reduce((acc, entry) => {
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
        description: "Production data has been updated",
      })
    }, 800)
  }
  
  // Export data to CSV
  const exportToCSV = () => {
    if (sortedEntries.length === 0) return
    
    // Get headers from first object
    const headers = ["Product", "Quantity", "Date", "Shift", "Staff", "Expiration Date"]
    
    // Convert data to CSV format
    const csvRows = []
    csvRows.push(headers.join(','))
    
    for (const entry of sortedEntries) {
      const values = [
        entry.product_name,
        entry.quantity,
        format(new Date(entry.date), "yyyy-MM-dd"),
        entry.shift,
        entry.staff_name,
        entry.expiration_date ? format(new Date(entry.expiration_date), "yyyy-MM-dd") : ""
      ]
      csvRows.push(values.map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    }
    
    // Create downloadable link
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `production-data-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Successful",
      description: "Production data has been exported to CSV",
    })
  }
  
  // Update the handleFromDateChange function
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

  // Update the handleToDateChange function
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

  // Update the handleSubmit function
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
    setActiveView("all");
  };
  
  if (!mounted) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Production Management</h1>
            <p className="text-muted-foreground">
              Track and manage your production data
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
          <h2 className="text-3xl font-bold tracking-tight">Production Management</h2>
          <p className="text-muted-foreground">
            Track and manage your production data
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
      
      {/* Add date range filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
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
              <CardTitle>Add New Production Entry</CardTitle>
              <CardDescription>
                Record new production entries with product details and quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionForm />
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
            <CardHeader>
              <CardTitle>Production Statistics</CardTitle>
              <CardDescription>
                Overview of your production data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Total Production</h3>
                  <p className="text-2xl font-bold">{totalProduction.toLocaleString()}</p>
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
              <CardTitle>Production by Date</CardTitle>
              <CardDescription>
                Daily production quantities
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
                    <Bar dataKey="value" name="Quantity" fill="#0088FE" />
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
            entries={productionEntries}
            title="All Production Entries"
            description="Complete list of production records"
            type="production"
            pageSize={10}
            allowFiltering={true}
          />
        </CardContent>
      </Card>
      
      <CopyrightFooter />
    </div>
  )
} 