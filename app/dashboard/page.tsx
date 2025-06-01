"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIInsights } from "@/components/ai-insights"
import { RecentEntries } from "@/components/recent-entries"
import { DashboardStats } from "@/components/dashboard-stats" 
import { useData } from "@/components/providers/data-provider"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts"
import { formatDate } from "@/lib/utils"
import { Download, Calendar, Filter, ArrowUpDown, RefreshCw, Layers } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format, subDays, subWeeks, subMonths, isSameDay, isWithinInterval, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, FileDown, FileText } from "lucide-react"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"

// Custom tooltip component to handle all tooltip rendering
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm dark:bg-background/90 dark:border-border/50">
        <p className="text-sm font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center text-xs">
            <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="font-medium">{entry.name}: </span>
            <span className="ml-1">
              {entry.value}
              {entry.name.toLowerCase().includes('rate') || entry.name.toLowerCase().includes('efficiency') 
                ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CHART_COLORS = {
  production: "#0090FF",
  disposal: "#FF6B6B",
  rate: "#7856FF",
  efficiency: "#00C288"
};

export default function DashboardPage() {
  const { toast } = useToast()
  const { productionEntries, disposalEntries, products, isLoading, refreshData } = useData()
  const [productStats, setProductStats] = useState<any[]>([])
  const [reasonStats, setReasonStats] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [activeView, setActiveView] = useState("week")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  })
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [selectedReason, setSelectedReason] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartType, setChartType] = useState<"bar" | "area" | "line">("area")
  const [mounted, setMounted] = useState(false)
  
  // All possible reasons from disposal entries
  const allReasons = useMemo(() => {
    const reasons = new Set<string>()
    disposalEntries.forEach(entry => {
      if (entry.reason) {
        reasons.add(entry.reason)
      }
    })
    return Array.from(reasons)
  }, [disposalEntries])
  
  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    products.forEach(product => {
      if (product.category) {
        uniqueCategories.add(product.category)
      }
    })
    return Array.from(uniqueCategories).sort()
  }, [products])
  
  // Function to export data to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return
    
    // Get headers from first object
    const headers = Object.keys(data[0])
    
    // Convert data to CSV format
    const csvRows = []
    csvRows.push(headers.join(','))
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        // Handle strings with commas by wrapping in quotes
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      })
      csvRows.push(values.join(','))
    }
    
    // Create downloadable link
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Successful",
      description: `${filename}.csv has been downloaded`,
    })
  }
  
  // Function to handle refresh of data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated",
      })
    }, 800)
  }
  
  // Function to set predefined date ranges
  const setPredefinedDateRange = (range: string) => {
    const today = new Date()
    
    switch(range) {
      case "week":
        setDateRange({ from: subDays(today, 7), to: today })
        break
      case "month":
        setDateRange({ from: subDays(today, 30), to: today })
        break
      case "quarter":
        setDateRange({ from: subDays(today, 90), to: today })
        break
      case "year":
        setDateRange({ from: subDays(today, 365), to: today })
        break
      default:
        setDateRange({ from: subDays(today, 7), to: today })
    }
    
    setActiveView(range)
  }
  
  // Filter data based on selected date range, product category, and product/reason filters
  const filteredProductionEntries = useMemo(() => {
    if (!dateRange?.from) return productionEntries
    
    return productionEntries.filter(entry => {
      if (!entry || !entry.date) return false
      
      const entryDate = new Date(entry.date)
      if (isNaN(entryDate.getTime())) return false
      
      // If only from date is selected, treat it as a single day filter
      if (!dateRange.to) {
        return isSameDay(entryDate, dateRange.from as Date)
      }
      // Otherwise use the date range
      const isInDateRange = isWithinInterval(entryDate, {
        start: dateRange.from as Date,
        end: dateRange.to as Date
      })
      
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
      const matchesCategory = selectedCategory === "all" || 
        products.find(p => p.name === entry.product_name)?.category === selectedCategory
      
      return isInDateRange && matchesProduct && matchesCategory
    })
  }, [productionEntries, dateRange, selectedProduct, selectedCategory, products])
  
  const filteredDisposalEntries = useMemo(() => {
    if (!dateRange?.from) return disposalEntries
    
    return disposalEntries.filter(entry => {
      if (!entry || !entry.date) return false
      
      const entryDate = new Date(entry.date)
      if (isNaN(entryDate.getTime())) return false
      
      // If only from date is selected, treat it as a single day filter
      if (!dateRange.to) {
        return isSameDay(entryDate, dateRange.from as Date)
      }
      // Otherwise use the date range
      const isInDateRange = isWithinInterval(entryDate, {
        start: dateRange.from as Date,
        end: dateRange.to as Date
      })
      
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
      const matchesReason = selectedReason === "all" || entry.reason === selectedReason
      const matchesCategory = selectedCategory === "all" || 
        products.find(p => p.name === entry.product_name)?.category === selectedCategory
      
      return isInDateRange && matchesProduct && matchesReason && matchesCategory
    })
  }, [disposalEntries, dateRange, selectedProduct, selectedReason, selectedCategory, products])
  
  // Process data for dashboard when entries change
  useEffect(() => {
    if (!isLoading) {
      // Calculate product statistics
      const productMap = new Map<string, { name: string, production: number, disposal: number }>()
      
      // Sum production by product
      filteredProductionEntries.forEach(entry => {
        if (!entry || !entry.product_name || typeof entry.quantity !== 'number') return
        
        const current = productMap.get(entry.product_name) || { 
          name: entry.product_name,
          production: 0, 
          disposal: 0 
        }
        
        productMap.set(entry.product_name, {
          ...current,
          production: current.production + entry.quantity
        })
      })
      
      // Sum disposal by product
      filteredDisposalEntries.forEach(entry => {
        if (!entry || !entry.product_name || typeof entry.quantity !== 'number') return
        
        const current = productMap.get(entry.product_name) || { 
          name: entry.product_name,
          production: 0, 
          disposal: 0 
        }
        
        productMap.set(entry.product_name, {
          ...current,
          disposal: current.disposal + entry.quantity
        })
      })
      
      // Calculate stats with disposal rate and efficiency
      const stats = Array.from(productMap.values())
        .map(({ name, production, disposal }) => {
          const rate = production > 0 ? (disposal / production) * 100 : 0
          
          return {
            name,
            production,
            disposal,
            disposalRate: parseFloat(rate.toFixed(1)),
            efficiency: parseFloat((100 - rate).toFixed(1))
          }
        })
        .filter(s => s.production > 0)
        .sort((a, b) => b.production - a.production)
      
      setProductStats(stats)
      
      // Calculate disposal reasons
      const reasons: Record<string, number> = {}
      filteredDisposalEntries.forEach(entry => {
        if (!entry || !entry.reason || typeof entry.quantity !== 'number') return
        
          reasons[entry.reason] = (reasons[entry.reason] || 0) + entry.quantity
      })
      
      const reasonData = Object.entries(reasons)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
      
      setReasonStats(reasonData)
      
      // Create aggregated time series data by date
      const dateMap = new Map<string, { date: string, formattedDate: string, production: number, disposal: number }>()
      
      // Calculate the number of days between dates
      const days = dateRange?.from && dateRange?.to 
        ? differenceInDays(dateRange.to, dateRange.from) + 1
        : 7
      
      // Create dates for the range
      const endDate = dateRange?.to || new Date()
      
      for (let i = 0; i < days; i++) {
        const date = subDays(endDate, days - i - 1)
        if (!date || isNaN(date.getTime())) continue
        
        const dateStr = format(date, "yyyy-MM-dd")
        const formattedDate = format(date, "MMM dd")
        
        dateMap.set(dateStr, {
          date: dateStr,
          formattedDate,
          production: 0,
          disposal: 0
        })
      }
      
      // Sum production by date
      filteredProductionEntries.forEach(entry => {
        if (!entry || !entry.date || typeof entry.quantity !== 'number') return
        
        try {
          const entryDate = new Date(entry.date)
          if (isNaN(entryDate.getTime())) return
          
          const dateStr = format(entryDate, "yyyy-MM-dd")
          
          if (dateMap.has(dateStr)) {
            const current = dateMap.get(dateStr)!
            dateMap.set(dateStr, {
              ...current,
              production: current.production + entry.quantity
            })
          }
        } catch (error) {
          console.error("Error processing production entry date:", error)
          return
        }
      })
      
      // Sum disposal by date
      filteredDisposalEntries.forEach(entry => {
        if (!entry || !entry.date || typeof entry.quantity !== 'number') return
        
        try {
          const entryDate = new Date(entry.date)
          if (isNaN(entryDate.getTime())) return
          
          const dateStr = format(entryDate, "yyyy-MM-dd")
          
          if (dateMap.has(dateStr)) {
            const current = dateMap.get(dateStr)!
            dateMap.set(dateStr, {
              ...current,
              disposal: current.disposal + entry.quantity
            })
          }
        } catch (error) {
          console.error("Error processing disposal entry date:", error)
          return
        }
      })
      
      // Convert map to array and sort by date
      const timeData = Array.from(dateMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          ...item,
          disposalRate: item.production > 0 
            ? parseFloat(((item.disposal / item.production) * 100).toFixed(1)) 
            : 0
        }))
      
      setChartData(timeData)
    }
  }, [filteredProductionEntries, filteredDisposalEntries, isLoading, dateRange])
  
  // Use useEffect to set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // If not mounted yet, show loading state
  if (!mounted) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your production and disposal metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
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
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Analytics and performance metrics
          </p>
        </div>
      </div>
      
      <QuickNav />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive analysis of production and disposal data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="transition-all hover:shadow-md"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(chartData, 'dashboard-data-export')}
            className="transition-all hover:shadow-md"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b pb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setPredefinedDateRange("week")}
              className="h-8"
            >
              Week
            </Button>
            <Button
              variant={activeView === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPredefinedDateRange("month")}
              className="h-8"
            >
              Month
            </Button>
            <Button
              variant={activeView === "quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => setPredefinedDateRange("quarter")}
              className="h-8"
            >
              Quarter
            </Button>
            <Button
              variant={activeView === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setPredefinedDateRange("year")}
              className="h-8"
            >
              Year
            </Button>
          </div>
          
          <div className="flex items-center h-8 gap-2 ml-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="mr-2 h-3 w-3" />
                  Filters
                  {(selectedProduct !== "all" || selectedReason !== "all" || selectedCategory !== "all") && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0">
                      {(selectedProduct !== "all" ? 1 : 0) + 
                       (selectedReason !== "all" ? 1 : 0) + 
                       (selectedCategory !== "all" ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-4 w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Category</h4>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-full">
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
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Product</h4>
                    <Select
                      value={selectedProduct}
                      onValueChange={setSelectedProduct}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {productStats.map((product) => (
                          <SelectItem key={product.name} value={product.name}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Disposal Reason</h4>
                    <Select
                      value={selectedReason}
                      onValueChange={setSelectedReason}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reasons</SelectItem>
                        {allReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct("all")
                        setSelectedReason("all")
                        setSelectedCategory("all")
                      }}
                    >
                      Reset filters
                    </Button>
                    <Button size="sm">Apply</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
              align="start"
              className="h-8"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("area")}
            className="h-8 px-2.5"
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
            className="h-8 px-2.5"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
            className="h-8 px-2.5"
          >
            <LineChartIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <DashboardStats 
        productionEntries={filteredProductionEntries} 
        disposalEntries={filteredDisposalEntries}
        dateFrom={dateRange?.from}
        dateTo={dateRange?.to}
      />
      
      {/* Quick Insights Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Daily Production Trend */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line
                      type="monotone"
                      dataKey="production"
                      stroke={CHART_COLORS.production}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-muted-foreground">No data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Disposal Trend */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Disposal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line
                      type="monotone"
                      dataKey="disposal"
                      stroke={CHART_COLORS.disposal}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-muted-foreground">No data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Trend */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke={CHART_COLORS.efficiency}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-muted-foreground">No data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Category Distribution */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px]">
              {productStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(() => {
                        const categoryData = products.reduce((acc, product) => {
                          const stats = productStats.find(s => s.name === product.name)
                          if (stats) {
                            acc[product.category] = (acc[product.category] || 0) + stats.production
                          }
                          return acc
                        }, {} as Record<string, number>)
                        
                        return Object.entries(categoryData)
                          .map(([name, value]) => ({ name, value }))
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 3)
                      })()}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {products.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(${index * 120}, 70%, 50%)`} 
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-muted-foreground">No data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Time Series Chart */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>Production & Disposal Trends</CardTitle>
              <CardDescription>
                Compare production and disposal volumes over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="production" fill={CHART_COLORS.production} name="Production" />
                      <Bar dataKey="disposal" fill={CHART_COLORS.disposal} name="Disposal" />
                    </BarChart>
                  ) : chartType === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.production} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.production} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorDisposal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.disposal} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.disposal} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="production" 
                        fill="url(#colorProduction)" 
                        stroke={CHART_COLORS.production} 
                        name="Production" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="disposal" 
                        fill="url(#colorDisposal)" 
                        stroke={CHART_COLORS.disposal} 
                        name="Disposal" 
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="production" 
                        stroke={CHART_COLORS.production} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Production" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="disposal" 
                        stroke={CHART_COLORS.disposal} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Disposal" 
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Production Efficiency Trend */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Production Efficiency Trend</CardTitle>
                <CardDescription>Daily efficiency rates over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.efficiency} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.efficiency} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="efficiency"
                        fill="url(#colorEfficiency)"
                        stroke={CHART_COLORS.efficiency}
                        name="Efficiency (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No efficiency data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Waste Distribution */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Waste Distribution</CardTitle>
                <CardDescription>Breakdown of disposal reasons</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {reasonStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reasonStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {reasonStats.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${index * 40}, 70%, 50%)`} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No disposal reason data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Products Table */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Products with highest production volume</CardDescription>
              </CardHeader>
              <CardContent>
                {productStats.length > 0 ? (
                  <Table className="overflow-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Production</TableHead>
                        <TableHead className="text-right">Disposal</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productStats.slice(0, 5).map((product) => (
                        <TableRow key={product.name}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-right">{product.production}</TableCell>
                          <TableCell className="text-right">{product.disposal}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={
                                product.disposalRate > 15 
                                  ? "destructive" 
                                  : product.disposalRate > 10 
                                    ? "secondary" 
                                    : "default"
                              }
                            >
                              {product.disposalRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-muted-foreground">No product data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest production and disposal entries</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4">
                    {[...filteredProductionEntries, ...filteredDisposalEntries]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((entry, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {entry.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.date), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={entry.quantity ? "default" : "destructive"}>
                              {entry.quantity ? "Production" : "Disposal"}
                            </Badge>
                            <span className="text-sm font-medium">
                              {entry.quantity || ('reason' in entry ? entry.reason : 'N/A')}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          {/* Category Performance Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Production by Category */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Production by Category</CardTitle>
                <CardDescription>Total production volume by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {productStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const categoryData = products.reduce((acc, product) => {
                          const stats = productStats.find(s => s.name === product.name)
                          if (stats) {
                            acc[product.category] = (acc[product.category] || 0) + stats.production
                          }
                          return acc
                        }, {} as Record<string, number>)
                        
                        return Object.entries(categoryData)
                          .map(([name, value]) => ({ name, value }))
                          .sort((a, b) => b.value - a.value)
                      })()}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        fill={CHART_COLORS.production}
                        name="Production"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No production data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Efficiency */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Category Efficiency</CardTitle>
                <CardDescription>Efficiency rates by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {productStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const categoryData = products.reduce((acc, product) => {
                          const stats = productStats.find(s => s.name === product.name)
                          if (stats) {
                            if (!acc[product.category]) {
                              acc[product.category] = {
                                totalProduction: 0,
                                totalDisposal: 0
                              }
                            }
                            acc[product.category].totalProduction += stats.production
                            acc[product.category].totalDisposal += stats.disposal
                          }
                          return acc
                        }, {} as Record<string, { totalProduction: number, totalDisposal: number }>)
                      
                        return Object.entries(categoryData)
                          .map(([name, data]) => ({
                            name,
                            efficiency: data.totalProduction > 0 
                              ? parseFloat((100 - (data.totalDisposal / data.totalProduction) * 100).toFixed(1))
                              : 0
                          }))
                          .sort((a, b) => b.efficiency - a.efficiency)
                      })()}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="efficiency" 
                        fill={CHART_COLORS.efficiency}
                        name="Efficiency (%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No efficiency data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Waste Analysis */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">Waste Analysis</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Daily Disposal Pattern */}
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle>Daily Disposal Pattern</CardTitle>
                  <CardDescription>Disposal volumes by day</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorDisposal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.disposal} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={CHART_COLORS.disposal} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="formattedDate" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="disposal" 
                          fill="url(#colorDisposal)" 
                          stroke={CHART_COLORS.disposal} 
                          name="Disposal" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No disposal data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Disposal Reasons */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Disposal Reasons</CardTitle>
                  <CardDescription>Breakdown of disposal reasons</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {reasonStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reasonStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {reasonStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`hsl(${index * 40}, 70%, 50%)`} 
                            />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No disposal reason data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

            {/* Top Products by Category */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(
                products.reduce((acc, product) => {
                  if (!acc[product.category]) {
                    acc[product.category] = []
                  }
                  const stats = productStats.find(s => s.name === product.name)
                  if (stats) {
                    acc[product.category].push(stats)
                  }
                  return acc
                }, {} as Record<string, typeof productStats>)
              ).map(([category, stats]) => (
                <Card key={category} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                    <CardDescription>Top products by disposal rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats
                            .sort((a, b) => b.disposalRate - a.disposalRate)
                            .slice(0, 3)
                            .map((product) => (
                              <TableRow key={product.name}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right">
                                  <Badge 
                                    variant={
                                      product.disposalRate > 15 
                                        ? "destructive" 
                                        : product.disposalRate > 10 
                                          ? "secondary" 
                                          : "default"
                                    }
                                  >
                                    {product.disposalRate}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex h-[200px] items-center justify-center">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Shift Analysis */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">Shift Analysis</h3>
            
          <div className="grid gap-6 md:grid-cols-2">
              {/* Production by Shift */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                  <CardTitle>Production by Shift</CardTitle>
                  <CardDescription>Production volume distribution across shifts</CardDescription>
              </CardHeader>
                <CardContent className="h-[300px]">
                  {filteredProductionEntries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={(() => {
                          const shiftData = filteredProductionEntries.reduce((acc, entry) => {
                            const shift = entry.shift || 'Unknown'
                            acc[shift] = (acc[shift] || 0) + entry.quantity
                            return acc
                          }, {} as Record<string, number>)
                          
                          return Object.entries(shiftData)
                            .map(([shift, value]) => ({ shift, value }))
                            .sort((a, b) => a.shift.localeCompare(b.shift))
                        })()}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="shift" />
                        <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          fill={CHART_COLORS.production}
                          name="Production"
                          radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No production data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
              {/* Disposal by Shift */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                  <CardTitle>Disposal by Shift</CardTitle>
                  <CardDescription>Disposal volume distribution across shifts</CardDescription>
              </CardHeader>
                <CardContent className="h-[300px]">
                  {filteredDisposalEntries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          const shiftData = filteredDisposalEntries.reduce((acc, entry) => {
                            const shift = entry.shift || 'Unknown'
                            acc[shift] = (acc[shift] || 0) + entry.quantity
                            return acc
                          }, {} as Record<string, number>)
                          
                          return Object.entries(shiftData)
                            .map(([shift, value]) => ({ shift, value }))
                            .sort((a, b) => a.shift.localeCompare(b.shift))
                        })()}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="shift" />
                        <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          fill={CHART_COLORS.disposal}
                          name="Disposal"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No disposal data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Shift Efficiency */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Shift Efficiency</CardTitle>
                <CardDescription>Efficiency rates by shift</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {filteredProductionEntries.length > 0 && filteredDisposalEntries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const shiftData = new Map<string, { production: number, disposal: number }>()
                        
                        // Aggregate production by shift
                        filteredProductionEntries.forEach(entry => {
                          const shift = entry.shift || 'Unknown'
                          const current = shiftData.get(shift) || { production: 0, disposal: 0 }
                          shiftData.set(shift, {
                            ...current,
                            production: current.production + entry.quantity
                          })
                        })
                        
                        // Aggregate disposal by shift
                        filteredDisposalEntries.forEach(entry => {
                          const shift = entry.shift || 'Unknown'
                          const current = shiftData.get(shift) || { production: 0, disposal: 0 }
                          shiftData.set(shift, {
                            ...current,
                            disposal: current.disposal + entry.quantity
                          })
                        })
                        
                        return Array.from(shiftData.entries())
                          .map(([shift, data]) => ({
                            shift,
                            efficiency: data.production > 0 
                              ? parseFloat((100 - (data.disposal / data.production) * 100).toFixed(1))
                              : 0
                          }))
                          .sort((a, b) => a.shift.localeCompare(b.shift))
                      })()}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="shift" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="efficiency" 
                        fill={CHART_COLORS.efficiency}
                        name="Efficiency (%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No efficiency data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <AIInsights 
            dateFrom={dateRange?.from} 
            dateTo={dateRange?.to}
            selectedProduct={selectedProduct === "all" ? undefined : selectedProduct}
          />
        </TabsContent>
        
        <TabsContent value="entries">
          <RecentEntries />
        </TabsContent>
      </Tabs>
      
      <CopyrightFooter />
    </div>
  )
} 