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
import { Download, Calendar, Filter, ArrowUpDown, RefreshCw, Layers, Search, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format, subDays, subWeeks, subMonths, isSameDay, isWithinInterval, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, FileDown, FileText, LayoutDashboard, Trash2, PercentIcon, Activity } from "lucide-react"
import { CopyrightFooter } from "@/components/copyright-footer"
import { QuickNav } from "@/components/quick-nav"
import { DigitalClock } from "@/components/digital-clock"
import { toEastern } from '@/lib/date-utils'
import { generateProductWasteReport, ProductWasteReport } from "@/lib/report-utils"
import { BarChart as ReBarChart, Bar as ReBar, XAxis as ReXAxis, YAxis as ReYAxis, CartesianGrid as ReCartesianGrid, Tooltip as ReTooltip, ResponsiveContainer as ReResponsiveContainer, LabelList, ReferenceLine } from 'recharts';
import { Dashboard } from "@/components/dashboard";

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
  const today = toEastern(new Date());
  today.setHours(23, 59, 59, 999);
  
  const startDate = toEastern(new Date());
  startDate.setHours(0, 0, 0, 0);
  
  switch(period) {
    case "today":
      return { from: startDate, to: today };
    case "week":
      const weekStart = toEastern(new Date(startDate));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { from: weekStart, to: today };
    case "month":
      const monthStart = toEastern(new Date(startDate));
      monthStart.setDate(1);
      return { from: monthStart, to: today };
    case "three_months":
      const threeMonthsStart = toEastern(new Date(startDate));
      threeMonthsStart.setMonth(threeMonthsStart.getMonth() - 3);
      return { from: threeMonthsStart, to: today };
    case "quarter":
      const quarterStart = toEastern(new Date(startDate));
      const currentQuarter = Math.floor(quarterStart.getMonth() / 3);
      quarterStart.setMonth(currentQuarter * 3);
      quarterStart.setDate(1);
      return { from: quarterStart, to: today };
    case "year":
      const yearStart = toEastern(new Date(startDate));
      yearStart.setMonth(0);
      yearStart.setDate(1);
      return { from: yearStart, to: today };
    case "all":
      const allTimeStart = toEastern(new Date(startDate));
      allTimeStart.setFullYear(allTimeStart.getFullYear() - 5);
      allTimeStart.setMonth(0);
      allTimeStart.setDate(1);
      return { from: allTimeStart, to: today };
    default:
      return { from: startDate, to: today };
  }
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
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  
  // Filter data based on selected date range, product category, and product/reason filters
  const filteredProductionEntries = useMemo(() => {
    return productionEntries.filter(entry => {
      // Apply product filter
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct;
      const matchesCategory = selectedCategory === "all" || 
        products.find(p => p.name === entry.product_name)?.category === selectedCategory;

      // Apply date filter
      if (!dateRange?.from) return matchesProduct && matchesCategory;

      try {
      // Convert entry date to Eastern timezone
      const entryDate = toEastern(new Date(entry.date));
        if (isNaN(entryDate.getTime())) {
          console.warn("Invalid production entry date:", entry.date, entry.id);
          return false;
        }

      // Convert range dates to Eastern timezone
      const startDate = toEastern(new Date(dateRange.from));
      startDate.setHours(0, 0, 0, 0);

      const endDate = dateRange.to ? toEastern(new Date(dateRange.to)) : startDate;
      endDate.setHours(23, 59, 59, 999);

      // Check if entry date falls within the range
      const isInDateRange = isWithinInterval(entryDate, {
        start: startDate,
        end: endDate
      });

        // Debug logging for today filter
        if (activeView === "today") {
          console.log("Production entry date check:", {
            entryId: entry.id,
            entryDate: entryDate.toISOString(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isInRange: isInDateRange,
            product: entry.product_name
          });
        }

      return matchesProduct && matchesCategory && isInDateRange;
      } catch (error) {
        console.error("Error filtering production entry:", error, entry);
        return false;
      }
    });
  }, [productionEntries, dateRange, selectedProduct, selectedCategory, products, activeView]);
  
  const filteredDisposalEntries = useMemo(() => {
    return disposalEntries.filter(entry => {
      // Apply product and reason filters
      const matchesProduct = selectedProduct === "all" || entry.product_name === selectedProduct;
      const matchesReason = selectedReason === "all" || entry.reason === selectedReason;

      // Apply date filter
      if (!dateRange?.from) return matchesProduct && matchesReason;

      try {
      // Convert entry date to Eastern timezone
      const entryDate = toEastern(new Date(entry.date));
        if (isNaN(entryDate.getTime())) {
          console.warn("Invalid disposal entry date:", entry.date, entry.id);
          return false;
        }

      // Convert range dates to Eastern timezone
      const startDate = toEastern(new Date(dateRange.from));
      startDate.setHours(0, 0, 0, 0);

      const endDate = dateRange.to ? toEastern(new Date(dateRange.to)) : startDate;
      endDate.setHours(23, 59, 59, 999);

      // Check if entry date falls within the range
      const isInDateRange = isWithinInterval(entryDate, {
        start: startDate,
        end: endDate
      });

        // Debug logging for today filter
        if (activeView === "today") {
          console.log("Disposal entry date check:", {
            entryId: entry.id,
            entryDate: entryDate.toISOString(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isInRange: isInDateRange,
            product: entry.product_name,
            reason: entry.reason
          });
        }

      return matchesProduct && matchesReason && isInDateRange;
      } catch (error) {
        console.error("Error filtering disposal entry:", error, entry);
        return false;
      }
    });
  }, [disposalEntries, dateRange, selectedProduct, selectedReason, activeView]);

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
  const exportToCSV = (data: any[], filename: string, dataType: "production" | "disposal") => {
    if (data.length === 0) return
    
    // Create summary data
    const summaryData = {
      production: {
        totalProduction: filteredProductionEntries.reduce((sum, entry) => sum + entry.quantity, 0),
        productionByProduct: Object.entries(
          filteredProductionEntries.reduce((acc, entry) => {
            acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
            return acc
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value })),
        productionByShift: Object.entries(
          filteredProductionEntries.reduce((acc, entry) => {
            acc[entry.shift] = (acc[entry.shift] || 0) + entry.quantity
            return acc
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }))
      },
      disposal: {
        totalDisposal: filteredDisposalEntries.reduce((sum, entry) => sum + entry.quantity, 0),
        disposalByProduct: Object.entries(
          filteredDisposalEntries.reduce((acc, entry) => {
            acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
            return acc
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value })),
        disposalByReason: Object.entries(
          filteredDisposalEntries.reduce((acc, entry) => {
            acc[entry.reason] = (acc[entry.reason] || 0) + entry.quantity
            return acc
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }))
      }
    }

    // Create CSV content
    const csvRows = []
    
    // Add date range information
    csvRows.push("Date Range")
    csvRows.push(`From: ${formatDate(dateRange?.from || new Date(), "short")}`)
    csvRows.push(`To: ${formatDate(dateRange?.to || new Date(), "short")}`)
    csvRows.push("") // Empty row for spacing

    // Add production summary
    csvRows.push("Production Summary")
    csvRows.push(`Total Production: ${summaryData.production.totalProduction}`)
    csvRows.push("")
    csvRows.push("Production by Product")
    csvRows.push("Product,Quantity")
    summaryData.production.productionByProduct.forEach(({ name, value }) => {
      csvRows.push(`${name.includes(',') ? `"${name}"` : name},${value}`)
    })
    csvRows.push("")
    csvRows.push("Production by Shift")
    csvRows.push("Shift,Quantity")
    summaryData.production.productionByShift.forEach(({ name, value }) => {
      csvRows.push(`${name.includes(',') ? `"${name}"` : name},${value}`)
    })
    csvRows.push("")

    // Add disposal summary
    csvRows.push("Disposal Summary")
    csvRows.push(`Total Disposal: ${summaryData.disposal.totalDisposal}`)
    csvRows.push("")
    csvRows.push("Disposal by Product")
    csvRows.push("Product,Quantity")
    summaryData.disposal.disposalByProduct.forEach(({ name, value }) => {
      csvRows.push(`${name.includes(',') ? `"${name}"` : name},${value}`)
    })
    csvRows.push("")
    csvRows.push("Disposal by Reason")
    csvRows.push("Reason,Quantity")
    summaryData.disposal.disposalByReason.forEach(({ name, value }) => {
      csvRows.push(`${name.includes(',') ? `"${name}"` : name},${value}`)
    })
    csvRows.push("")

    // Add efficiency metrics
    const disposalRate = summaryData.production.totalProduction > 0 
      ? (summaryData.disposal.totalDisposal / summaryData.production.totalProduction) * 100 
      : 0
    const efficiency = 100 - disposalRate

    csvRows.push("Efficiency Metrics")
    csvRows.push(`Disposal Rate: ${disposalRate.toFixed(2)}%`)
    csvRows.push(`Efficiency: ${efficiency.toFixed(2)}%`)

    // Create downloadable link with UTF-8 BOM
    const BOM = '\uFEFF'
    const csvContent = BOM + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${formatDate(new Date(), "short")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export Successful",
      description: "Dashboard summary has been exported to CSV",
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
    const newRange = getDateRangeForPeriod(range);
    setTempDateRange(newRange);
    setDateRange(newRange);
    setActiveView(range);
  }
  
  // Update the date range handlers to ensure proper type handling
  const handleFromDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    try {
      const currentDate = tempDateRange?.from || new Date();
      const validCurrentDate = new Date(currentDate);
      
      // Validate the current date before processing
      if (isNaN(validCurrentDate.getTime())) {
        console.warn('Invalid current date in handleFromDateChange:', currentDate);
        return;
      }
      
      const newDate = toEastern(validCurrentDate);
      
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
      if (!tempDateRange?.to) {
        setTempDateRange({ from: newDate, to: newDate });
      } else {
        try {
          const validToDate = new Date(tempDateRange.to);
          if (!isNaN(validToDate.getTime()) && isSameDay(newDate, toEastern(validToDate))) {
            setTempDateRange({ from: newDate, to: newDate });
          } else {
            setTempDateRange((prev: DateRange | undefined) => prev ? { ...prev, from: newDate } : { from: newDate, to: newDate });
          }
        } catch (error) {
          console.error('Error processing to date in handleFromDateChange:', error);
          setTempDateRange({ from: newDate, to: newDate });
        }
      }
    } catch (error) {
      console.error('Error in handleFromDateChange:', error);
    }
  };

  const handleToDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    try {
      const currentDate = tempDateRange?.to || new Date();
      const validCurrentDate = new Date(currentDate);
      
      // Validate the current date before processing
      if (isNaN(validCurrentDate.getTime())) {
        console.warn('Invalid current date in handleToDateChange:', currentDate);
        return;
      }
      
      const newDate = toEastern(validCurrentDate);
      
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
    } catch (error) {
      console.error('Error in handleToDateChange:', error);
    }
  };
  
  // Add the submit handler
  const handleSubmit = () => {
    try {
      if (tempDateRange?.from) {
        const validFromDate = new Date(tempDateRange.from);
        if (isNaN(validFromDate.getTime())) {
          console.warn('Invalid from date in handleSubmit:', tempDateRange.from);
          return;
        }
        
        const fromDate = toEastern(validFromDate);
        fromDate.setHours(0, 0, 0, 0);
        
        let toDate = fromDate;
        if (tempDateRange.to) {
          const validToDate = new Date(tempDateRange.to);
          if (!isNaN(validToDate.getTime())) {
            toDate = toEastern(validToDate);
          }
        }
        toDate.setHours(23, 59, 59, 999);
        
        setDateRange({ from: fromDate, to: toDate });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  // Update the handleClear function
  const handleClear = () => {
    try {
      const now = new Date();
      if (isNaN(now.getTime())) {
        console.warn('Invalid current date in handleClear');
        return;
      }
      
      const today = toEastern(now);
      today.setHours(23, 59, 59, 999);
      
      const startDate = new Date(2010, 0, 1); // January 1, 2010
      startDate.setHours(0, 0, 0, 0);
      
      setTempDateRange({ from: startDate, to: today });
      setDateRange({ from: startDate, to: today });
      setActiveView("all");
    } catch (error) {
      console.error('Error in handleClear:', error);
    }
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
          formattedDate: formatDate(item.date, "MMM dd"),
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
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-background via-background/95 to-background/90 border border-border/50 rounded-xl p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Comprehensive analysis of production and disposal data
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
                onClick={() => exportToCSV(chartData, 'dashboard-summary', 'production')}
                className="transition-all hover:shadow-md hover:bg-accent/50 border-border/50"
              >
                <FileText className="mr-2 h-4 w-4" />
                Export Summary
              </Button>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <DigitalClock />
          </div>
        </div>
      </div>
      
      <QuickNav />
      
      {/* Consolidated Filters Section */}
      <div className="bg-card/50 border border-border/30 rounded-lg p-4 shadow-sm backdrop-blur-sm">
        <div className="space-y-4">
          {/* Date Range Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Date Range:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeView === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDateRange(getDateRangeForPeriod("today"));
                  setActiveView("today");
                }}
                className="transition-all hover:shadow-sm"
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
                className="transition-all hover:shadow-sm"
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
                className="transition-all hover:shadow-sm"
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
                className="transition-all hover:shadow-sm"
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
                className="transition-all hover:shadow-sm"
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
                className="transition-all hover:shadow-sm"
              >
                This Year
              </Button>
            </div>
          </div>

          {/* Custom Date Range Filter */}
          <div className="flex flex-wrap items-center gap-4 border-t pt-4">
            <span className="text-sm font-medium text-muted-foreground">Custom Range:</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">From:</span>
                <Select
                  value={tempDateRange?.from ? tempDateRange.from.getFullYear().toString() : "2010"}
                  onValueChange={(year) => handleFromDateChange('year', year)}
                >
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={tempDateRange?.from ? tempDateRange.from.getMonth().toString() : new Date().getMonth().toString()}
                  onValueChange={(month) => handleFromDateChange('month', month)}
                >
                  <SelectTrigger className="w-[120px] h-8">
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
                  value={tempDateRange?.from ? tempDateRange.from.getDate().toString() : new Date().getDate().toString()}
                  onValueChange={(day) => handleFromDateChange('day', day)}
                >
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: getDaysInMonth(
                        tempDateRange?.from ? tempDateRange.from.getFullYear() : new Date().getFullYear(),
                        tempDateRange?.from ? tempDateRange.from.getMonth() : new Date().getMonth()
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
                <span className="text-sm">To:</span>
                <Select
                  value={tempDateRange?.to ? tempDateRange.to.getFullYear().toString() : new Date().getFullYear().toString()}
                  onValueChange={(year) => handleToDateChange('year', year)}
                >
                  <SelectTrigger className="w-[100px] h-8">
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
                  value={tempDateRange?.to ? tempDateRange.to.getMonth().toString() : new Date().getMonth().toString()}
                  onValueChange={(month) => handleToDateChange('month', month)}
                >
                  <SelectTrigger className="w-[120px] h-8">
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
                  value={tempDateRange?.to ? tempDateRange.to.getDate().toString() : new Date().getDate().toString()}
                  onValueChange={(day) => handleToDateChange('day', day)}
                >
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: getDaysInMonth(
                        tempDateRange?.to ? tempDateRange.to.getFullYear() : new Date().getFullYear(),
                        tempDateRange?.to ? tempDateRange.to.getMonth() : new Date().getMonth()
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 transition-all hover:shadow-sm"
                >
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSubmit}
                  className="h-8 transition-all hover:shadow-sm"
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filters and Chart Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Search className="mr-2 h-3 w-3" />
                    Advanced Filters
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

            {/* Chart Type Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Chart Type:</span>
              <Button
                variant={chartType === "area" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("area")}
                className="h-8 px-2.5 transition-all hover:shadow-sm"
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
                className="h-8 px-2.5 transition-all hover:shadow-sm"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("line")}
                className="h-8 px-2.5 transition-all hover:shadow-sm"
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="waste">Waste Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
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
                <CardTitle className="flex items-center gap-2">
                  Production Efficiency Trend
                  <span className="text-muted-foreground cursor-help" title="Efficiency = 100 - (Disposal / Production) × 100. Moving average smooths daily fluctuations.">
                    <Info className="h-4 w-4" />
                  </span>
                </CardTitle>
                <CardDescription>Daily efficiency rates over time (with 3-day moving average)</CardDescription>
              </CardHeader>
              <CardContent className="h-[340px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.map((d, i, arr) => {
                      // 3-day moving average
                      const window = arr.slice(Math.max(0, i - 2), i + 1);
                      const avg = window.reduce((sum, v) => sum + (v.efficiency ?? 0), 0) / window.length;
                      return { ...d, efficiencyMA: parseFloat(avg.toFixed(2)) };
                    })} margin={{ top: 24, right: 32, left: 32, bottom: 24 }}>
                      <defs>
                        <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.efficiency} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.efficiency} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                      <XAxis dataKey="formattedDate" tick={{ fontSize: 13 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 13 }} label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fontSize: 15, fill: 'var(--foreground)' }} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const eff = payload.find(p => p.dataKey === 'efficiency')?.value;
                          const ma = payload.find(p => p.dataKey === 'efficiencyMA')?.value;
                          return (
                            <div className="bg-background border border-border rounded-md shadow-md p-3 backdrop-blur-sm">
                              <p className="text-sm font-semibold">{label}</p>
                              <p className="text-xs">Efficiency: <b>{eff}%</b></p>
                              <p className="text-xs">3-day Avg: <b>{ma}%</b></p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend wrapperStyle={{ fontSize: '13px' }} />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke={CHART_COLORS.efficiency}
                        strokeWidth={2}
                        dot={false}
                        name="Efficiency (%)"
                      />
                      <Line
                        type="monotone"
                        dataKey="efficiencyMA"
                        stroke="#7856FF"
                        strokeWidth={2}
                        dot={false}
                        name="3-day Moving Avg"
                        strokeDasharray="5 3"
                      />
                      <ReferenceLine y={chartData.reduce((sum, d) => sum + (d.efficiency ?? 0), 0) / chartData.length} stroke="#aaa" strokeDasharray="3 3" label={{ value: 'Avg', position: 'right', fontSize: 12, fill: '#aaa' }} />
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
                              {formatDate(entry.date, "MMM dd, yyyy HH:mm")}
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
        
        <TabsContent value="performance">
          {/* Essential KPIs and main charts for Performance tab only */}
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Production</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{productStats.reduce((sum, p) => sum + (p.production || 0), 0)}</div>
              </CardContent>
            </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Disposal</CardTitle>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{productStats.reduce((sum, p) => sum + (p.disposal || 0), 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disposal Rate</CardTitle>
                  <PercentIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(() => {
                    const totalProd = productStats.reduce((sum, p) => sum + (p.production || 0), 0);
                    const totalDisp = productStats.reduce((sum, p) => sum + (p.disposal || 0), 0);
                    return totalProd > 0 ? ((totalDisp / totalProd) * 100).toFixed(1) : '0.0';
                  })()}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(() => {
                    const totalProd = productStats.reduce((sum, p) => sum + (p.production || 0), 0);
                    const totalDisp = productStats.reduce((sum, p) => sum + (p.disposal || 0), 0);
                    return totalProd > 0 ? (100 - ((totalDisp / totalProd) * 100)).toFixed(1) : '0.0';
                  })()}%</div>
              </CardContent>
            </Card>
          </div>

            {/* KPIs by Shift and Category */}
            <PerformanceKPIsByShiftCategory
              productionEntries={filteredProductionEntries}
              disposalEntries={filteredDisposalEntries}
              products={products}
            />

            {/* Bar Charts by Shift and Category */}
            <PerformanceBarChartsByShiftCategory
              productionEntries={filteredProductionEntries}
              disposalEntries={filteredDisposalEntries}
              products={products}
            />

            {/* Main Chart: Daily Production & Disposal */}
            <Card>
                <CardHeader>
                <CardTitle>Production & Disposal Trends</CardTitle>
                <CardDescription>Compare production and disposal volumes over time</CardDescription>
                </CardHeader>
              <CardContent className="h-[350px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="production" stroke={CHART_COLORS.production} strokeWidth={2} dot={false} name="Production" />
                      <Line type="monotone" dataKey="disposal" stroke={CHART_COLORS.disposal} strokeWidth={2} dot={false} name="Disposal" />
                    </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available for the selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ai">
          {/* AI Insights content */}
          <AIInsights />
        </TabsContent>
        
        <TabsContent value="entries">
          {/* Recent Entries content */}
          <RecentEntries />
        </TabsContent>
        
        <TabsContent value="waste">
          <WasteAnalyticsTableSection
            productionEntries={filteredProductionEntries}
            disposalEntries={filteredDisposalEntries}
            products={products}
            fromDate={dateRange?.from ?? new Date()}
            toDate={dateRange?.to ?? new Date()}
          />
        </TabsContent>
      </Tabs>
      
      <CopyrightFooter />
                              </div>
                            )
                          }

function WasteAnalyticsVisuals({ productionEntries, disposalEntries, products, fromDate, toDate }: {
  productionEntries: any[];
  disposalEntries: any[];
  products: any[];
  fromDate: Date;
  toDate: Date;
}) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#6B66FF"];
  const report = useMemo(() => generateProductWasteReport({ productionEntries, disposalEntries, products, fromDate, toDate }), [productionEntries, disposalEntries, products, fromDate, toDate]);
  // Top 10 by total discarded
  const topDiscarded = useMemo(() => [...report].sort((a, b) => b.total_discarded - a.total_discarded).slice(0, 10), [report]);
  // Top 10 by discard rate
  const topDiscardRate = useMemo(() => [...report].filter(r => r.total_produced > 0).sort((a, b) => b.discard_rate - a.discard_rate).slice(0, 10), [report]);
  // Pie chart data (all products)
  const pieData = useMemo(() => report.filter(r => r.total_discarded > 0).map(r => ({ name: r.product_name, value: r.total_discarded })), [report]);
  return (
            <div className="grid gap-6 md:grid-cols-2">
      {/* Bar Chart: Most Discarded Products */}
      <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topDiscarded} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
            <YAxis type="category" dataKey="product_name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_discarded" fill="#FF8042" name="Total Discarded" radius={[0, 4, 4, 0]}>
              {topDiscarded.map((entry, index) => (
                <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
      {/* Pie Chart: Share of Discarded Units */}
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
              data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                          dataKey="value" 
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
            <Tooltip />
            <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
      {/* Bar Chart: Discard Rate (%) by Product */}
      <div className="h-[300px] md:col-span-2">
                  <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topDiscardRate} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="product_name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="discard_rate" fill="#0088FE" name="Discard Rate (%)" radius={[0, 4, 4, 0]}>
              {topDiscardRate.map((entry, index) => (
                <Cell key={`cell-rate-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
                  </ResponsiveContainer>
                    </div>
            </div>
  );
}

function WasteAnalyticsTableSection({ productionEntries, disposalEntries, products, fromDate, toDate }: {
  productionEntries: any[];
  disposalEntries: any[];
  products: any[];
  fromDate: Date;
  toDate: Date;
}) {
  const [sortKey, setSortKey] = useState<keyof ProductWasteReport>('total_discarded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // --- Filter state ---
  const [productFilter, setProductFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [minRate, setMinRate] = useState<string>('');
  const [maxRate, setMaxRate] = useState<string>('');

  // Get unique product names and categories
  const productNames = useMemo(() => ['all', ...products.map(p => p.name).filter((v, i, a) => a.indexOf(v) === i)], [products]);
  const categories = useMemo(() => ['all', ...products.map(p => p.category).filter((v, i, a) => a.indexOf(v) === i)], [products]);

  const report = useMemo(() => generateProductWasteReport({ productionEntries, disposalEntries, products, fromDate, toDate }), [productionEntries, disposalEntries, products, fromDate, toDate]);

  // --- Apply filters ---
  const filtered = useMemo(() => {
    return report.filter(row => {
      const matchesProduct = productFilter === 'all' || row.product_name === productFilter;
      const matchesCategory = categoryFilter === 'all' || (products.find(p => p.id === row.product_id)?.category === categoryFilter);
      const rate = row.discard_rate;
      const min = minRate !== '' ? parseFloat(minRate) : -Infinity;
      const max = maxRate !== '' ? parseFloat(maxRate) : Infinity;
      const matchesRate = rate >= min && rate <= max;
      return matchesProduct && matchesCategory && matchesRate;
    });
  }, [report, productFilter, categoryFilter, minRate, maxRate, products]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string') return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortOrder]);
  const columns: { key: keyof ProductWasteReport; label: string }[] = [
    { key: 'product_name', label: 'Product' },
    { key: 'total_discarded', label: 'Total Discarded' },
    { key: 'days_discarded', label: 'Days Discarded' },
    { key: 'avg_per_day', label: 'Average per Day' },
    { key: 'total_produced', label: 'Total Produced' },
    { key: 'discard_rate', label: 'Discard Rate (%)' },
  ];
  function exportCSV() {
    const header = columns.map(col => col.label).join(',');
    const rows = sorted.map(row =>
      columns.map(col => row[col.key]).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];
    const filename = `waste-analytics-${fromStr}_to_${toStr}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // --- KPIs ---
  const totalDiscarded = useMemo(() => report.reduce((sum, r) => sum + r.total_discarded, 0), [report]);
  const totalProduced = useMemo(() => report.reduce((sum, r) => sum + r.total_produced, 0), [report]);
  const discardRate = totalProduced > 0 ? ((totalDiscarded / totalProduced) * 100).toFixed(1) : '0.0';
  const mostDiscarded = useMemo(() => report.reduce((max, r) => r.total_discarded > (max?.total_discarded || 0) ? r : max, null as null | ProductWasteReport), [report]);

  // --- Charts Data ---
  const topDiscarded = useMemo(() => [...report].sort((a, b) => b.total_discarded - a.total_discarded).slice(0, 5), [report]);
  const topDiscardRate = useMemo(() => [...report].filter(r => r.total_produced > 0).sort((a, b) => b.discard_rate - a.discard_rate).slice(0, 5), [report]);
  const pieData = useMemo(() => {
    const top = [...report].sort((a, b) => b.total_discarded - a.total_discarded).slice(0, 5);
    const other = report.filter(r => !top.includes(r));
    const otherSum = other.reduce((sum, r) => sum + r.total_discarded, 0);
    const pie = top.map(r => ({ name: r.product_name, value: r.total_discarded }));
    if (otherSum > 0) pie.push({ name: 'Other', value: otherSum });
    return pie;
  }, [report]);
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#6B66FF"];

  // --- KPIs and charts code ...

  // --- AI/ML KPIs and Anomaly Table ---
  // Helper: get previous period (same length as current)
  const prevFrom = useMemo(() => {
    const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
    const prev = new Date(fromDate);
    prev.setDate(prev.getDate() - days);
    return prev;
  }, [fromDate, toDate]);
  const prevTo = useMemo(() => {
    const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
    const prev = new Date(fromDate);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }, [fromDate, toDate]);
  const prevReport = useMemo(() => generateProductWasteReport({ productionEntries, disposalEntries, products, fromDate: prevFrom, toDate: prevTo }), [productionEntries, disposalEntries, products, prevFrom, prevTo]);

  // 1. Anomaly Detection (z-score of total_discarded)
  const allPeriods = useMemo(() => {
    // Get all periods of same length as current, up to 12 periods back
    const periods = [];
    let start = new Date(fromDate);
    let end = new Date(toDate);
    const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
    for (let i = 0; i < 12; i++) {
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - days);
      const prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - days);
      periods.push({ from: prevStart, to: prevEnd });
      start = prevStart;
      end = prevEnd;
    }
    return periods;
  }, [fromDate, toDate]);
  const periodTotals = useMemo(() => {
    return allPeriods.map(period => {
      const rep = generateProductWasteReport({ productionEntries, disposalEntries, products, fromDate: period.from, toDate: period.to });
      return rep.reduce((sum, r) => sum + r.total_discarded, 0);
    });
  }, [allPeriods, productionEntries, disposalEntries, products]);
  const mean = useMemo(() => periodTotals.length ? periodTotals.reduce((a, b) => a + b, 0) / periodTotals.length : 0, [periodTotals]);
  const std = useMemo(() => {
    if (!periodTotals.length) return 0;
    const m = mean;
    return Math.sqrt(periodTotals.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / periodTotals.length);
  }, [periodTotals, mean]);
  const zScore = std > 0 ? (totalDiscarded - mean) / std : 0;
  const anomalyText = zScore > 2 ? 'High Waste (Anomaly)' : zScore < -2 ? 'Low Waste (Anomaly)' : 'Normal';

  // 2. Predicted Discard Rate (Next Week) - simple linear regression
  const timeSeries = useMemo(() => {
    // For each day in the last 30 days, get total_discarded and total_produced
    const days = 30;
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(toDate);
      d.setDate(d.getDate() - i);
      const rep = generateProductWasteReport({ productionEntries, disposalEntries, products, fromDate: d, toDate: d });
      const discarded = rep.reduce((sum, r) => sum + r.total_discarded, 0);
      const produced = rep.reduce((sum, r) => sum + r.total_produced, 0);
      arr.push({ day: d, discarded, produced, rate: produced > 0 ? (discarded / produced) * 100 : 0 });
    }
    return arr;
  }, [productionEntries, disposalEntries, products, toDate]);
  // Linear regression (least squares) for rate
  const predRate = useMemo(() => {
    const n = timeSeries.length;
    if (n < 2) return 0;
    const x = timeSeries.map((_, i) => i);
    const y = timeSeries.map(d => d.rate);
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const num = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
    const den = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    const slope = den !== 0 ? num / den : 0;
    const intercept = yMean - slope * xMean;
    // Predict for next 7 days
    const nextX = n + 7;
    const pred = intercept + slope * nextX;
    return Math.max(0, parseFloat(pred.toFixed(2)));
  }, [timeSeries]);

  // 3. Best/Worst Performing Product (change in discard rate vs previous period)
  const rateChanges = useMemo(() => {
    return report.map(row => {
      const prev = prevReport.find(r => r.product_id === row.product_id);
      const change = prev ? row.discard_rate - prev.discard_rate : 0;
      return { ...row, rateChange: change };
    });
  }, [report, prevReport]);
  const bestImproved = rateChanges.reduce((min, r) => r.rateChange < (min?.rateChange ?? 0) ? r : min, null as any);
  const worstDeteriorated = rateChanges.reduce((max, r) => r.rateChange > (max?.rateChange ?? 0) ? r : max, null as any);

  // 4. Waste Reduction Opportunity (if all products at median discard rate)
  const medianRate = useMemo(() => {
    const rates = report.map(r => r.discard_rate).sort((a, b) => a - b);
    const mid = Math.floor(rates.length / 2);
    return rates.length % 2 !== 0 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
  }, [report]);
  const potentialSaved = useMemo(() => {
    return report.reduce((sum, r) => {
      const target = (r.total_produced * medianRate) / 100;
      return sum + Math.max(0, r.total_discarded - target);
    }, 0).toFixed(0);
  }, [report, medianRate]);

  // 5. Anomaly Table (products with z-score > 2 or < -2 for discard rate)
  const rateMean = useMemo(() => report.length ? report.reduce((a, b) => a + b.discard_rate, 0) / report.length : 0, [report]);
  const rateStd = useMemo(() => {
    if (!report.length) return 0;
    return Math.sqrt(report.reduce((sum, r) => sum + Math.pow(r.discard_rate - rateMean, 2), 0) / report.length);
  }, [report, rateMean]);
  const anomalyRows = useMemo(() => report.filter(r => rateStd > 0 && (Math.abs((r.discard_rate - rateMean) / rateStd) > 2)), [report, rateMean, rateStd]);

  // --- Render ---
                            return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-xs text-muted-foreground">Total Discarded</div>
          <div className="text-2xl font-bold">{totalDiscarded.toLocaleString()}</div>
                              </div>
        <div className="bg-card rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-xs text-muted-foreground">Total Produced</div>
          <div className="text-2xl font-bold">{totalProduced.toLocaleString()}</div>
        </div>
        <div className="bg-card rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-xs text-muted-foreground">Discard Rate</div>
          <div className="text-2xl font-bold">{discardRate}%</div>
        </div>
        <div className="bg-card rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-xs text-muted-foreground">Most Discarded Product</div>
          <div className="text-base font-semibold text-center">{mostDiscarded?.product_name || '-'}</div>
          <div className="text-xs text-muted-foreground">{mostDiscarded ? mostDiscarded.total_discarded + ' units' : ''}</div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Top 5 Products by Discarded Units Table */}
        <div className="bg-card rounded-lg p-4 shadow">
          <div className="font-bold mb-2 text-base">Top 5 Products by Discarded Units</div>
          <div className="overflow-x-auto">
            <table className="min-w-[420px] border text-sm">
              <thead className="bg-background sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-2 py-1 border-b text-left">Rank</th>
                  <th scope="col" className="px-2 py-1 border-b text-left">Product</th>
                  <th scope="col" className="px-2 py-1 border-b text-right">Units Discarded</th>
                  <th scope="col" className="px-2 py-1 border-b text-right">Total Produced</th>
                  <th scope="col" className="px-2 py-1 border-b text-right">Discard Rate (%)</th>
                </tr>
              </thead>
              <tbody>
                {topDiscarded.map((row, idx) => (
                  <tr key={row.product_id} className={`${idx % 2 === 0 ? 'bg-muted/40' : ''} hover:bg-accent/30 transition`}>
                    <th scope="row" className="px-2 py-1 border-b text-left font-semibold">{idx + 1}</th>
                    <td className="px-2 py-1 border-b text-left whitespace-nowrap">
                      <span className="truncate block max-w-[160px]" title={row.product_name.length > 20 ? row.product_name : undefined}>{row.product_name}</span>
                    </td>
                    <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.total_discarded}</td>
                    <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.total_produced}</td>
                    <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.discard_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Top 5 Products by Discard Rate (%) Table */}
        <div className="bg-card rounded-lg p-4 shadow">
          <div className="font-bold mb-2 text-base">Top 5 Products by Discard Rate (%)</div>
          <div className="overflow-x-auto">
            <table className="min-w-[420px] border text-sm">
              <thead className="bg-background sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-2 py-1 border-b text-left">Rank</th>
                  <th scope="col" className="px-2 py-1 border-b text-left">Product</th>
                  <th scope="col" className="px-2 py-1 border-b text-right">Discard Rate (%)</th>
                  <th scope="col" className="px-2 py-1 border-b text-right">Units Discarded</th>
                  <th scope="col" className="px-2 py-1 border-b text-right">Total Produced</th>
                </tr>
              </thead>
              <tbody>
                {topDiscardRate.map((row, idx) => (
                  <tr key={row.product_id} className={`${idx % 2 === 0 ? 'bg-muted/40' : ''} hover:bg-accent/30 transition`}>
                    <th scope="row" className="px-2 py-1 border-b text-left font-semibold">{idx + 1}</th>
                    <td className="px-2 py-1 border-b text-left whitespace-nowrap">
                      <span className="truncate block max-w-[160px]" title={row.product_name.length > 20 ? row.product_name : undefined}>{row.product_name}</span>
                    </td>
                    <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.discard_rate}%</td>
                    <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.total_discarded}</td>
                    <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.total_produced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Pie Chart: Share of Discarded Units */}
      <div className="bg-card rounded-lg p-4 shadow mb-6 max-w-xl mx-auto">
        <div className="font-medium mb-2 text-sm">Share of Discarded Units by Product</div>
        <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                          dataKey="value" 
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
              <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                              </div>
            </div>
      {/* AI/ML KPIs and Anomaly Table */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <div className="bg-accent/30 rounded-lg p-4 shadow flex flex-col items-center">
            <div className="text-xs text-muted-foreground">Waste Anomaly</div>
            <div className={`text-base font-bold ${zScore > 2 || zScore < -2 ? 'text-destructive' : 'text-green-700'}`}>{anomalyText}</div>
            <div className="text-xs text-muted-foreground">z-score: {zScore.toFixed(2)}</div>
          </div>
          <div className="bg-accent/30 rounded-lg p-4 shadow flex flex-col items-center">
            <div className="text-xs text-muted-foreground">Predicted Discard Rate (Next Week)</div>
            <div className="text-base font-bold">{predRate}%</div>
          </div>
          <div className="bg-accent/30 rounded-lg p-4 shadow flex flex-col items-center">
            <div className="text-xs text-muted-foreground">Best Improvement</div>
            <div className="text-base font-bold">{bestImproved?.product_name || '-'}</div>
            <div className="text-xs text-green-700">{bestImproved ? bestImproved.rateChange.toFixed(2) : ''}%</div>
          </div>
          <div className="bg-accent/30 rounded-lg p-4 shadow flex flex-col items-center">
            <div className="text-xs text-muted-foreground">Worst Deterioration</div>
            <div className="text-base font-bold">{worstDeteriorated?.product_name || '-'}</div>
            <div className="text-xs text-destructive">{worstDeteriorated ? worstDeteriorated.rateChange.toFixed(2) : ''}%</div>
          </div>
        </div>
        <div className="mt-2 bg-accent/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-xs font-medium">Waste Reduction Opportunity:</div>
          <div className="text-base font-bold">{potentialSaved} units could be saved if all products reach median discard rate ({medianRate.toFixed(2)}%)</div>
        </div>
        {anomalyRows.length > 0 && (
          <div className="mt-4">
            <div className="font-medium text-xs mb-1">Anomalous Products (Discard Rate Outliers)</div>
            <div className="overflow-x-auto rounded border bg-background">
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                <table className="min-w-full border text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr>
                      {columns.map((col, idx) => (
                        <th
                          key={col.key}
                          scope="col"
                          className={
                            `px-2 py-1 border-b cursor-pointer whitespace-nowrap bg-background z-20 ${
                              idx === 0 ? 'sticky left-0 bg-background' : ''
                            } ${col.key !== 'product_name' ? 'text-right' : 'text-left'}`
                          }
                          onClick={() => {
                            if (sortKey === col.key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            else { setSortKey(col.key); setSortOrder('desc'); }
                          }}
                          style={idx === 0 ? { minWidth: 160, maxWidth: 240 } : {}}
                        >
                          {col.label} {sortKey === col.key ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, rowIdx) => (
                      <tr
                        key={row.product_id}
                        className={
                          `${rowIdx % 2 === 0 ? 'bg-muted/40' : ''} hover:bg-accent/30 transition`}
                      >
                        <th
                          scope="row"
                          className="px-2 py-1 border-b sticky left-0 bg-background font-medium whitespace-nowrap z-10"
                          style={{ minWidth: 160, maxWidth: 240 }}
                        >
                          <span
                            className="truncate block max-w-[200px]"
                            title={row.product_name.length > 20 ? row.product_name : undefined}
                          >
                            {row.product_name}
                          </span>
                        </th>
                        <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.total_discarded}</td>
                        <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.days_discarded}</td>
                        <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.avg_per_day}</td>
                        <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.total_produced}</td>
                        <td className="px-2 py-1 border-b text-right whitespace-nowrap">{row.discard_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                    </div>
              {sorted.length === 0 && <div className="text-center text-muted-foreground py-4">No data for selected range.</div>}
            </div>
          </div>
        )}
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-xs font-medium mb-1">Product</label>
          <select className="border rounded px-2 py-1 text-sm" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
            {productNames.map(name => (
              <option key={name} value={name}>{name === 'all' ? 'All Products' : name}</option>
            ))}
          </select>
    </div>
        <div>
          <label className="block text-xs font-medium mb-1">Category</label>
          <select className="border rounded px-2 py-1 text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Min Discard Rate (%)</label>
          <input type="number" className="border rounded px-2 py-1 w-20 text-sm" value={minRate} onChange={e => setMinRate(e.target.value)} placeholder="0" min="0" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Max Discard Rate (%)</label>
          <input type="number" className="border rounded px-2 py-1 w-20 text-sm" value={maxRate} onChange={e => setMaxRate(e.target.value)} placeholder="100" min="0" />
        </div>
      </div>
      {/* Table and Export */}
      <div className="mb-2 flex justify-end">
        <button className="px-3 py-1 rounded bg-primary text-white text-xs hover:bg-primary/90" onClick={exportCSV}>
          Export CSV
        </button>
      </div>
    </div>
  );
}

// Day-of-Week Waste Pattern Component
function DayOfWeekWastePattern({ productionEntries, disposalEntries, fromDate, toDate }: { productionEntries: any[]; disposalEntries: any[]; fromDate: Date; toDate: Date; }) {
  // Helper: get day of week string
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Aggregate by day of week
  const data = useMemo(() => {
    const prodByDOW: Record<number, number> = {};
    const dispByDOW: Record<number, number> = {};
    productionEntries.forEach(e => {
      const d = new Date(e.date);
      const dow = d.getDay();
      prodByDOW[dow] = (prodByDOW[dow] || 0) + Number(e.quantity);
    });
    disposalEntries.forEach(e => {
      const d = new Date(e.date);
      const dow = d.getDay();
      dispByDOW[dow] = (dispByDOW[dow] || 0) + Number(e.quantity);
    });
    return days.map((name, i) => {
      const produced = prodByDOW[i] || 0;
      const discarded = dispByDOW[i] || 0;
      return {
        day: name,
        produced,
        discarded,
        discardRate: produced > 0 ? Number(((discarded / produced) * 100).toFixed(2)) : 0
      };
    });
  }, [productionEntries, disposalEntries]);
  const best = useMemo(() => {
    if (!data.length) return undefined;
    return data.reduce<{ day: string; produced: number; discarded: number; discardRate: number } | undefined>((min, d) => {
      if (!min) return d;
      return d.discardRate < min.discardRate ? d : min;
    }, undefined);
  }, [data]);
  const worst = useMemo(() => {
    if (!data.length) return undefined;
    return data.reduce<{ day: string; produced: number; discarded: number; discardRate: number } | undefined>((max, d) => {
      if (!max) return d;
      return d.discardRate > max.discardRate ? d : max;
    }, undefined);
  }, [data]);
  if (data.every(d => d.produced === 0 && d.discarded === 0)) return null;
  return (
    <div className="mb-6">
      <div className="font-medium mb-2 text-sm">Day-of-Week Waste Pattern</div>
      <div className="h-[220px] bg-card rounded-lg p-4 shadow mb-2">
        <ReResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <ReCartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <ReXAxis dataKey="day" tick={{ fontSize: 12 }} />
            <ReYAxis tick={{ fontSize: 12 }} domain={[0, Math.max(20, ...data.map(d => d.discardRate))]} />
            <ReTooltip />
            <ReBar dataKey="discardRate" fill="#FF8042" name="Discard Rate (%)" radius={[4, 4, 0, 0]} />
          </ReBarChart>
        </ReResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="bg-accent/20 rounded px-3 py-1">Best Day: <span className="font-semibold">{best ? best.day : '-'}</span> ({best ? best.discardRate : '-'}% discard rate)</div>
        <div className="bg-accent/20 rounded px-3 py-1">Worst Day: <span className="font-semibold">{worst ? worst.day : '-'}</span> ({worst ? worst.discardRate : '-'}% discard rate)</div>
      </div>
    </div>
  );
}

// Trend Analysis Component
function WasteTrendAnalysis({ productionEntries, disposalEntries, fromDate, toDate }: { productionEntries: any[]; disposalEntries: any[]; fromDate: Date; toDate: Date; }) {
  // Build daily discard rate time series
  const daysCount = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const dailyData = useMemo(() => {
    const arr = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + i);
      const prod = productionEntries.filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
      });
      const disp = disposalEntries.filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
      });
      const produced = prod.reduce((sum, e) => sum + Number(e.quantity), 0);
      const discarded = disp.reduce((sum, e) => sum + Number(e.quantity), 0);
      arr.push({
        date: d,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        produced,
        discarded,
        rate: produced > 0 ? Number(((discarded / produced) * 100).toFixed(2)) : 0
      });
    }
    return arr;
  }, [productionEntries, disposalEntries, fromDate, toDate, daysCount]);
  // Linear regression (least squares) for rate
  const slope = useMemo(() => {
    const n = dailyData.length;
    if (n < 2) return 0;
    const x = dailyData.map((_, i) => i);
    const y = dailyData.map(d => d.rate);
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const num = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
    const den = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    return den !== 0 ? Number((num / den).toFixed(4)) : 0;
  }, [dailyData]);
  let trend: string;
  if (slope > 0.05) trend = 'Increasing';
  else if (slope < -0.05) trend = 'Decreasing';
  else trend = 'Stable';
  if (dailyData.every(d => d.produced === 0 && d.discarded === 0)) return null;
                            return (
    <div className="mb-6">
      <div className="font-medium mb-2 text-sm">Waste Trend Analysis</div>
      <div className="flex flex-col md:flex-row md:items-center md:gap-6">
        <div className="flex-1 h-[120px] bg-card rounded-lg p-4 shadow mb-2 md:mb-0">
          <ReResponsiveContainer width="100%" height="100%">
            <ReBarChart data={dailyData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <ReCartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <ReXAxis dataKey="label" tick={{ fontSize: 11 }} />
              <ReYAxis tick={{ fontSize: 11 }} domain={[0, Math.max(20, ...dailyData.map(d => d.rate))]} />
              <ReTooltip />
              <ReBar dataKey="rate" fill="#7856FF" name="Discard Rate (%)" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ReResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <div>Trend: <span className={trend === 'Increasing' ? 'text-destructive' : trend === 'Decreasing' ? 'text-green-700' : ''}>{trend}</span></div>
          <div>Slope: <span className="font-mono">{slope}</span></div>
          <div>(A positive slope means discard rate is rising over time.)</div>
        </div>
      </div>
                              </div>
                            );
                          }

// KPIs by Shift and Category
function PerformanceKPIsByShiftCategory({ productionEntries, disposalEntries, products }: { productionEntries: any[]; disposalEntries: any[]; products: any[] }) {
  // By Shift
  const shifts = ['morning', 'afternoon', 'night'];
  const shiftStats = shifts.map(shift => {
    const prod = productionEntries.filter(e => e.shift === shift).reduce((sum, e) => sum + Number(e.quantity), 0);
    const disp = disposalEntries.filter(e => e.shift === shift).reduce((sum, e) => sum + Number(e.quantity), 0);
    return {
      shift,
      production: prod,
      disposal: disp,
      rate: prod > 0 ? (disp / prod) * 100 : 0
    };
  }).filter(s => s.production > 0 || s.disposal > 0);
  const bestShift = shiftStats.reduce((min, s) => s.rate < (min?.rate ?? Infinity) ? s : min, undefined as any);
  const worstShift = shiftStats.reduce((max, s) => s.rate > (max?.rate ?? -Infinity) ? s : max, undefined as any);
  // By Category
  const categories = Array.from(new Set(products.map(p => p.category)));
  const categoryStats = categories.map(cat => {
    const prodIds = products.filter(p => p.category === cat).map(p => p.id);
    const prod = productionEntries.filter(e => prodIds.includes(e.product_id)).reduce((sum, e) => sum + Number(e.quantity), 0);
    const disp = disposalEntries.filter(e => prodIds.includes(e.product_id)).reduce((sum, e) => sum + Number(e.quantity), 0);
    return {
      category: cat,
      production: prod,
      disposal: disp,
      rate: prod > 0 ? (disp / prod) * 100 : 0
    };
  }).filter(c => c.production > 0 || c.disposal > 0);
  const bestCat = categoryStats.reduce((min, c) => c.rate < (min?.rate ?? Infinity) ? c : min, undefined as any);
  const worstCat = categoryStats.reduce((max, c) => c.rate > (max?.rate ?? -Infinity) ? c : max, undefined as any);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{bestShift ? bestShift.shift.charAt(0).toUpperCase() + bestShift.shift.slice(1) : '-'}</div>
          <div className="text-xs text-muted-foreground">{bestShift ? bestShift.rate.toFixed(1) : '-'}% disposal rate</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Worst Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{worstShift ? worstShift.shift.charAt(0).toUpperCase() + worstShift.shift.slice(1) : '-'}</div>
          <div className="text-xs text-muted-foreground">{worstShift ? worstShift.rate.toFixed(1) : '-'}% disposal rate</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{bestCat ? bestCat.category : '-'}</div>
          <div className="text-xs text-muted-foreground">{bestCat ? bestCat.rate.toFixed(1) : '-'}% disposal rate</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Worst Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{worstCat ? worstCat.category : '-'}</div>
          <div className="text-xs text-muted-foreground">{worstCat ? worstCat.rate.toFixed(1) : '-'}% disposal rate</div>
              </CardContent>
            </Card>
          </div>
  );
}

// Bar Charts by Shift and Category
function PerformanceBarChartsByShiftCategory({ productionEntries, disposalEntries, products }: { productionEntries: any[]; disposalEntries: any[]; products: any[] }) {
  // By Shift
  const shifts = ['morning', 'afternoon', 'night'];
  const shiftData = shifts.map(shift => {
    const prod = productionEntries.filter(e => e.shift === shift).reduce((sum, e) => sum + Number(e.quantity), 0);
    const disp = disposalEntries.filter(e => e.shift === shift).reduce((sum, e) => sum + Number(e.quantity), 0);
    return {
      shift: shift.charAt(0).toUpperCase() + shift.slice(1),
      rate: prod > 0 ? Number(((disp / prod) * 100).toFixed(2)) : 0
    };
  });
  // By Category
  const categories = Array.from(new Set(products.map(p => p.category)));
  const catData = categories.map(cat => {
    const prodIds = products.filter(p => p.category === cat).map(p => p.id);
    const prod = productionEntries.filter(e => prodIds.includes(e.product_id)).reduce((sum, e) => sum + Number(e.quantity), 0);
    const disp = disposalEntries.filter(e => prodIds.includes(e.product_id)).reduce((sum, e) => sum + Number(e.quantity), 0);
    return {
      category: cat,
      rate: prod > 0 ? Number(((disp / prod) * 100).toFixed(2)) : 0
    };
  });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Disposal Rate by Shift</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ReResponsiveContainer width="100%" height="100%">
            <ReBarChart data={shiftData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <ReCartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <ReXAxis dataKey="shift" tick={{ fontSize: 12 }} />
              <ReYAxis tick={{ fontSize: 12 }} />
              <ReTooltip />
              <ReBar dataKey="rate" fill="#7856FF" name="Disposal Rate (%)" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ReResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Disposal Rate by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ReResponsiveContainer width="100%" height="100%">
            <ReBarChart data={catData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <ReCartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <ReXAxis dataKey="category" tick={{ fontSize: 12 }} />
              <ReYAxis tick={{ fontSize: 12 }} />
              <ReTooltip />
              <ReBar dataKey="rate" fill="#FF8042" name="Disposal Rate (%)" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ReResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}