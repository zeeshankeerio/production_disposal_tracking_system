"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DisposalForm } from "@/components/disposal-form"
import { useData } from "@/components/providers/data-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, RefreshCw, FileText, BarChart3, PieChart as PieChartIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { DisposalEntry } from "@/lib/types"
import { PageRecentEntries } from "@/components/page-recent-entries"
import { EntriesListView } from "@/components/entries-list-view"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"

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
  const [activeTab, setActiveTab] = useState("overview")
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
    const isInDateRange = dateRange?.from && dateRange?.to
      ? entryDate >= dateRange.from && entryDate <= dateRange.to
      : true
    
    return matchesSearch && matchesProduct && isInDateRange
  })
  
  // Sort entries by date
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })
  
  // Calculate disposal statistics
  const totalDisposal = filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0)
  
  // Group disposal by category
  const disposalByCategory = filteredEntries.reduce((acc, entry) => {
    const product = products.find(p => p.name === entry.product_name)
    const category = product?.category || "Uncategorized"
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += entry.quantity
    return acc
  }, {} as Record<string, number>)
  
  // Convert to array for chart
  const categoryChartData = Object.entries(disposalByCategory).map(([name, value]) => ({
    name,
    value
  }))
  
  // Group disposal by reason
  const disposalByReason = filteredEntries.reduce((acc, entry) => {
    const reason = entry.reason
    if (!acc[reason]) {
      acc[reason] = 0
    }
    acc[reason] += entry.quantity
    return acc
  }, {} as Record<string, number>)
  
  // Convert to array for chart
  const reasonChartData = Object.entries(disposalByReason).map(([name, value]) => ({
    name,
    value
  }))
  
  // Group disposal by date
  const disposalByDate = filteredEntries.reduce((acc, entry) => {
    const date = format(new Date(entry.date), "MMM dd")
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += entry.quantity
    return acc
  }, {} as Record<string, number>)
  
  // Convert to array for chart
  const dateChartData = Object.entries(disposalByDate).map(([date, value]) => ({
    date,
    value
  }))
  
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
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
  
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-10 space-y-8">
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="all-entries">All Entries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-8">
              <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
                <CardHeader>
                  <CardTitle>Add New Disposal Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisposalForm />
                </CardContent>
              </Card>
              
              <div className="hidden md:block">
                <PageRecentEntries
                  key={`disposal-entries-${disposalEntries.length}`}
                  entries={sortedEntries.slice(0, 5)}
                  title="Recent Disposal Entries"
                  description="Latest disposal records"
                  type="disposal"
                  maxEntries={5}
                />
              </div>
              
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
                      <p className="text-2xl font-bold">{totalDisposal}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Products</h3>
                      <p className="text-2xl font-bold">{Object.keys(disposalByCategory).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-8">
              <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
                <CardHeader>
                  <CardTitle>Disposal by Category</CardTitle>
                  <CardDescription>Distribution of disposal across categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={(data) => `${data.name}: ${(data.percent * 100).toFixed(0)}%`}
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => value} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
                <CardHeader>
                  <CardTitle>Disposal by Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  {reasonChartData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={reasonChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" name="Disposal" fill="#FF8042" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
            <CardHeader>
              <CardTitle>Disposal Trends Over Time</CardTitle>
              <CardDescription>Daily disposal trends</CardDescription>
            </CardHeader>
            <CardContent>
              {dateChartData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dateChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Disposal" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
              <CardHeader>
                <CardTitle>Disposal by Category</CardTitle>
                <CardDescription>Distribution of disposal across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={(data) => `${data.name}: ${(data.percent * 100).toFixed(0)}%`}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
              <CardHeader>
                <CardTitle>Disposal by Reason</CardTitle>
                <CardDescription>Comparison of disposal reasons</CardDescription>
              </CardHeader>
              <CardContent>
                {reasonChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reasonChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="value" name="Disposal" fill="#FF8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
            <CardHeader>
              <CardTitle>Disposal Trends Over Time</CardTitle>
              <CardDescription>Daily disposal trends</CardDescription>
            </CardHeader>
            <CardContent>
              {dateChartData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dateChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Disposal" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all-entries" className="space-y-4">
          <EntriesListView
            entries={disposalEntries}
            title="All Disposal Entries"
            description="Complete list of disposal records"
            type="disposal"
            pageSize={10}
          />
        </TabsContent>
      </Tabs>
      
      <CopyrightFooter />
    </div>
  )
} 