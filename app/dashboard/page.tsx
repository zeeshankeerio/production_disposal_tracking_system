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
      <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm">
        <p className="text-sm font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.value || 0;
          const formattedValue = typeof value === 'number' 
            ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
            : value;
          
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formattedValue}
              {entry.name.includes('Rate') || entry.name.includes('Efficiency') ? '%' : ''}
            </p>
          );
        })}
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

// Helper function to safely calculate percentages
const calculatePercentage = (value: number, total: number): number => {
  if (!total || total <= 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(1));
};

// Helper function to safely calculate efficiency
const calculateEfficiency = (production: number, disposal: number): number => {
  if (!production || production <= 0) return 0;
  return parseFloat((100 - ((disposal / production) * 100)).toFixed(1));
};

// Helper function to validate quantity
const validateQuantity = (quantity: number): number => {
  return Math.max(0, quantity || 0);
};

// Helper function to validate shift
const validateShift = (shift: string | undefined): string => {
  if (!shift) return 'Unknown';
  const normalizedShift = shift.toLowerCase().trim();
  return ['day', 'night', 'morning', 'evening'].includes(normalizedShift) 
    ? normalizedShift.charAt(0).toUpperCase() + normalizedShift.slice(1)
    : 'Unknown';
};

// Helper function to calculate shift efficiency
const calculateShiftEfficiency = (production: number, disposal: number): number => {
  if (!production || production <= 0) return 0;
  const efficiency = 100 - ((disposal / production) * 100);
  return parseFloat(Math.max(0, Math.min(100, efficiency)).toFixed(1));
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

// Helper function to get date range for predefined periods
const getDateRangeForPeriod = (period: string): DateRange => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  
  switch(period) {
    case "today":
      return { from: startDate, to: today }
    case "week":
      const weekStart = new Date(startDate)
      // Get Monday of current week (0 is Sunday, 1 is Monday)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
      weekStart.setDate(diff)
      return { from: weekStart, to: today }
    case "month":
      const monthStart = new Date(startDate)
      monthStart.setDate(1) // Start from first day of current month
      return { from: monthStart, to: today }
    case "three_months":
      const threeMonthsStart = new Date(startDate)
      threeMonthsStart.setMonth(threeMonthsStart.getMonth() - 3)
      threeMonthsStart.setDate(1) // Start from first day of the month
      return { from: threeMonthsStart, to: today }
    case "quarter":
      const quarterStart = new Date(startDate)
      const currentQuarter = Math.floor(quarterStart.getMonth() / 3)
      quarterStart.setMonth(currentQuarter * 3)
      quarterStart.setDate(1)
      return { from: quarterStart, to: today }
    case "year":
      const yearStart = new Date(startDate)
      yearStart.setMonth(0)
      yearStart.setDate(1)
      return { from: yearStart, to: today }
    case "all":
      // Set to a reasonable start date (e.g., 5 years ago)
      const allTimeStart = new Date(startDate)
      allTimeStart.setFullYear(allTimeStart.getFullYear() - 5)
      allTimeStart.setMonth(0)
      allTimeStart.setDate(1)
      return { from: allTimeStart, to: today }
    default:
      return { from: startDate, to: today }
  }
}

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
  
  // Filter data based on selected date range, product category, and product/reason filters
  const filteredProductionEntries = useMemo(() => {
    if (!dateRange?.from) return productionEntries
    
    return productionEntries.filter(entry => {
      if (!entry || !entry.date) return false
      
      const entryDate = new Date(entry.date)
      if (isNaN(entryDate.getTime())) return false
      
      // Set time to start of day for entry date
      entryDate.setHours(0, 0, 0, 0)
      
      // If only from date is selected, treat it as a single day filter
      if (!dateRange.to && dateRange.from) {
        const singleDay = new Date(dateRange.from.getTime())
        singleDay.setHours(0, 0, 0, 0)
        return isSameDay(entryDate, singleDay)
      }
      
      // For date range, set proper start and end times
      if (dateRange.from && dateRange.to) {
        const startDate = new Date(dateRange.from.getTime())
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(dateRange.to.getTime())
        endDate.setHours(23, 59, 59, 999)
        
        // Check if entry date falls within the range
        const isInDateRange = isWithinInterval(entryDate, {
          start: startDate,
          end: endDate
        })
        
        const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
        const matchesCategory = selectedCategory === "all" || 
          products.find(p => p.name === entry.product_name)?.category === selectedCategory
        
        return isInDateRange && matchesProduct && matchesCategory
      }
      
      return false
    })
  }, [productionEntries, dateRange, selectedProduct, selectedCategory, products])
  
  const filteredDisposalEntries = useMemo(() => {
    if (!dateRange?.from) return disposalEntries
    
    return disposalEntries.filter(entry => {
      if (!entry || !entry.date) return false
      
      const entryDate = new Date(entry.date)
      if (isNaN(entryDate.getTime())) return false
      
      // Set time to start of day for entry date
      entryDate.setHours(0, 0, 0, 0)
      
      // If only from date is selected, treat it as a single day filter
      if (!dateRange.to && dateRange.from) {
        const singleDay = new Date(dateRange.from.getTime())
        singleDay.setHours(0, 0, 0, 0)
        return isSameDay(entryDate, singleDay)
      }
      
      // For date range, set proper start and end times
      if (dateRange.from && dateRange.to) {
        const startDate = new Date(dateRange.from.getTime())
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(dateRange.to.getTime())
        endDate.setHours(23, 59, 59, 999)
        
        // Check if entry date falls within the range
        const isInDateRange = isWithinInterval(entryDate, {
          start: startDate,
          end: endDate
        })
        
        const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct
        const matchesReason = selectedReason === "all" || entry.reason === selectedReason
        const matchesCategory = selectedCategory === "all" || 
          products.find(p => p.name === entry.product_name)?.category === selectedCategory
        
        return isInDateRange && matchesProduct && matchesReason && matchesCategory
      }
      
      return false
    })
  }, [disposalEntries, dateRange, selectedProduct, selectedReason, selectedCategory, products])

  // Calculate shift distribution data
  const productionShiftChartData = useMemo(() => {
    const shiftData = new Map<string, number>()
    filteredProductionEntries.forEach(entry => {
      if (!entry || typeof entry.quantity !== 'number') return
      const shift = entry.shift || 'Unknown'
      shiftData.set(shift, (shiftData.get(shift) || 0) + entry.quantity)
    })
    return Array.from(shiftData.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredProductionEntries])

  const disposalShiftChartData = useMemo(() => {
    const shiftData = new Map<string, number>()
    filteredDisposalEntries.forEach(entry => {
      if (!entry || typeof entry.quantity !== 'number') return
      const shift = entry.shift || 'Unknown'
      shiftData.set(shift, (shiftData.get(shift) || 0) + entry.quantity)
    })
    return Array.from(shiftData.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredDisposalEntries])
  
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
  
  // Update the date range handlers to ensure proper type handling
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
    
    setDateRange(prev => prev ? { ...prev, from: newDate } : { from: newDate, to: newDate });
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
    
    setDateRange(prev => prev ? { ...prev, to: newDate } : { from: newDate, to: newDate });
  };
  
  // Process data for dashboard when entries change
  useEffect(() => {
    if (!isLoading) {
      // Process data for dashboard
      const productStatsMap = new Map<string, { production: number, disposal: number }>();
      const reasonStatsMap = new Map<string, number>();
      const dateMap = new Map<string, { production: number, disposal: number, date: string }>();
      
      // Process production entries
      filteredProductionEntries.forEach(entry => {
        const date = formatDate(entry.date);
        const product = entry.product_name;
        const quantity = validateQuantity(entry.quantity);
        
        // Update product stats
        const currentProduct = productStatsMap.get(product) || { production: 0, disposal: 0 };
        productStatsMap.set(product, {
          ...currentProduct,
          production: currentProduct.production + quantity
        });
        
        // Update date stats
        const currentDate = dateMap.get(date) || { production: 0, disposal: 0, date };
        dateMap.set(date, {
          ...currentDate,
          production: currentDate.production + quantity
        });
      });
      
      // Process disposal entries
      filteredDisposalEntries.forEach(entry => {
        const date = formatDate(entry.date);
        const product = entry.product_name;
        const reason = entry.reason;
        const quantity = validateQuantity(entry.quantity);
        
        // Update product stats
        const currentProduct = productStatsMap.get(product) || { production: 0, disposal: 0 };
        productStatsMap.set(product, {
          ...currentProduct,
          disposal: currentProduct.disposal + quantity
        });
        
        // Update reason stats
        const currentReason = reasonStatsMap.get(reason) || 0;
        reasonStatsMap.set(reason, currentReason + quantity);
        
        // Update date stats
        const currentDate = dateMap.get(date) || { production: 0, disposal: 0, date };
        dateMap.set(date, {
          ...currentDate,
          disposal: currentDate.disposal + quantity
        });
      });
      
      // Convert maps to arrays and calculate additional metrics
      const productStatsArray = Array.from(productStatsMap.entries())
        .map(([name, stats]) => ({
          name,
          production: stats.production,
          disposal: stats.disposal,
          disposalRate: calculatePercentage(stats.disposal, stats.production),
          efficiency: calculateEfficiency(stats.production, stats.disposal)
        }))
        .sort((a, b) => b.production - a.production);
      
      const reasonStatsArray = Array.from(reasonStatsMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      
      // Convert date map to array and sort by date
      const timeData = Array.from(dateMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          ...item,
          formattedDate: format(new Date(item.date), 'MMM dd'),
          disposalRate: calculatePercentage(item.disposal, item.production),
          efficiency: calculateEfficiency(item.production, item.disposal)
        }));
      
      setProductStats(productStatsArray);
      setReasonStats(reasonStatsArray);
      setChartData(timeData);
    }
  }, [filteredProductionEntries, filteredDisposalEntries, isLoading]);
  
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
      
      {/* Add this before the date range picker section */}
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
      
      {/* Simplified Date Filter */}
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
        <Card className="transition-all hover:shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[120px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
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
        <Card className="transition-all hover:shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Disposal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[120px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
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
        <Card className="transition-all hover:shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[120px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
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
        <Card className="transition-all hover:shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[120px]">
              {productStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {products.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(${index * 120}, 70%, 50%)`} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-md shadow-md p-2 backdrop-blur-sm">
                              <p className="text-xs font-semibold">{payload[0].name}</p>
                              <p className="text-xs">Value: {payload[0].value}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: '10px' }}
                    />
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
        <TabsList className="grid w-full grid-cols-4 md:w-[500px] lg:w-[600px]">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm">AI Insights</TabsTrigger>
          <TabsTrigger value="entries" className="text-xs sm:text-sm">Entries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Time Series Chart */}
          <Card className="transition-all hover:shadow-md overflow-hidden">
            <CardHeader>
              <CardTitle>Production & Disposal Trends</CardTitle>
              <CardDescription>
                Compare production and disposal volumes over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[450px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="production" fill={CHART_COLORS.production} name="Production" />
                      <Bar dataKey="disposal" fill={CHART_COLORS.disposal} name="Disposal" />
                    </BarChart>
                  ) : chartType === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                      <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
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
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="production" 
                        stroke={CHART_COLORS.production} 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Production" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="disposal" 
                        stroke={CHART_COLORS.disposal} 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
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
            <Card className="transition-all hover:shadow-md overflow-hidden">
              <CardHeader>
                <CardTitle>Production Efficiency Trend</CardTitle>
                <CardDescription>Daily efficiency rates over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.efficiency} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.efficiency} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
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
            <Card className="transition-all hover:shadow-md overflow-hidden">
              <CardHeader>
                <CardTitle>Waste Distribution</CardTitle>
                <CardDescription>Breakdown of disposal reasons</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {reasonStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={reasonStats}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const value = Number(payload[0].value) || 0;
                            const total = reasonStats.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            
                            return (
                              <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm">
                                <p className="text-sm font-semibold">{payload[0].name}</p>
                                <p className="text-sm">Quantity: {value}</p>
                                <p className="text-sm text-muted-foreground">
                                  {percentage.toFixed(1)}% of total
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar 
                        dataKey="value"
                        fill={CHART_COLORS.disposal}
                        name="Quantity"
                        radius={[0, 4, 4, 0]}
                      >
                        {reasonStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`hsl(${index * 40}, 70%, 50%)`} 
                            />
                        ))}
                      </Bar>
                    </BarChart>
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
                  <div className="overflow-x-auto">
                    <Table>
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
                  </div>
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
                    <BarChart 
                        data={reasonStats}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const value = Number(payload[0].value) || 0;
                            const total = reasonStats.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            
                            return (
                              <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm">
                                <p className="text-sm font-semibold">{payload[0].name}</p>
                                <p className="text-sm">Quantity: {value}</p>
                                <p className="text-sm text-muted-foreground">
                                  {percentage.toFixed(1)}% of total
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar 
                        dataKey="value"
                        fill={CHART_COLORS.disposal}
                        name="Quantity"
                        radius={[0, 4, 4, 0]}
                      >
                        {reasonStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`hsl(${index * 40}, 70%, 50%)`} 
                            />
                        ))}
                      </Bar>
                    </BarChart>
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
            <Card>
              <CardHeader>
                  <CardTitle>Production by Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productionShiftChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                          dataKey="value" 
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {productionShiftChartData.map((entry: { name: string; value: number }, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? CHART_COLORS.production : CHART_COLORS.rate} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm">
                                <p className="text-sm font-semibold">{payload[0].name}</p>
                                <p className="text-sm">Production: {payload[0].value}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
              </CardContent>
            </Card>
            
              {/* Disposal by Shift */}
            <Card>
              <CardHeader>
                  <CardTitle>Disposal by Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disposalShiftChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                          dataKey="value" 
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {disposalShiftChartData.map((entry: { name: string; value: number }, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? CHART_COLORS.disposal : CHART_COLORS.rate} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm">
                                <p className="text-sm font-semibold">{payload[0].name}</p>
                                <p className="text-sm">Disposal: {payload[0].value}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                    </div>
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
                        const shiftData = new Map<string, { production: number, disposal: number }>();
                        
                        // Initialize with all possible shifts
                        ['Day', 'Night', 'Morning', 'Evening', 'Unknown'].forEach(shift => {
                          shiftData.set(shift, { production: 0, disposal: 0 });
                        });
                        
                        // Aggregate production by shift
                        filteredProductionEntries.forEach(entry => {
                          if (!entry || typeof entry.quantity !== 'number' || isNaN(entry.quantity)) return;
                          
                          const shift = validateShift(entry.shift);
                          const current = shiftData.get(shift) || { production: 0, disposal: 0 };
                          shiftData.set(shift, {
                            ...current,
                            production: current.production + validateQuantity(entry.quantity)
                          });
                        });
                        
                        // Aggregate disposal by shift
                        filteredDisposalEntries.forEach(entry => {
                          if (!entry || typeof entry.quantity !== 'number' || isNaN(entry.quantity)) return;
                          
                          const shift = validateShift(entry.shift);
                          const current = shiftData.get(shift) || { production: 0, disposal: 0 };
                          shiftData.set(shift, {
                            ...current,
                            disposal: current.disposal + validateQuantity(entry.quantity)
                          });
                        });
                        
                        // Convert to array and calculate efficiency
                        return Array.from(shiftData.entries())
                          .map(([shift, data]) => ({
                            shift,
                            production: data.production,
                            disposal: data.disposal,
                            efficiency: calculateShiftEfficiency(data.production, data.disposal)
                          }))
                          .filter(item => item.production > 0 || item.disposal > 0) // Only show shifts with data
                          .sort((a, b) => {
                            // Sort by shift name, but keep Unknown last
                            if (a.shift === 'Unknown') return 1;
                            if (b.shift === 'Unknown') return -1;
                            return a.shift.localeCompare(b.shift);
                          });
                      })()}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="shift" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value === 'Unknown' ? 'Other' : value}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm">
                                <p className="text-sm font-semibold">{data.shift === 'Unknown' ? 'Other' : data.shift}</p>
                                <p className="text-sm">Production: {data.production}</p>
                                <p className="text-sm">Disposal: {data.disposal}</p>
                                <p className="text-sm font-medium" style={{ color: CHART_COLORS.efficiency }}>
                                  Efficiency: {data.efficiency}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
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