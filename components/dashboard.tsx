"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "./providers/data-provider"
import { formatDate, formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { format, isWithinInterval, parseISO, subDays } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowDown, ArrowUp, BarChart3, PieChartIcon, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DatabaseSetupGuide } from "./database-setup-guide"
import type { DateRange } from "react-day-picker"
import { generateProductWasteReport } from "@/lib/report-utils";
import type { ProductWasteReport } from "@/lib/report-utils";

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#6B66FF"]

// Default date range (30 days)
const defaultDateRange: DateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-2 text-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Custom pie chart label
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function Dashboard() {
  const { productionEntries, disposalEntries, products, isLoading, error } = useData()
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)

  // Add a wrapper function to handle the DateRange type correctly
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  // Filter data by date range
  const filteredProduction = useMemo(() => {
    // Check if entries array exists and has items
    if (!productionEntries?.length) return [];
    // Check if date range is valid
    if (!dateRange?.from || !dateRange?.to) return [];

    // After null checks, we can safely assert these are Date objects
    const from = dateRange.from as Date;
    const to = dateRange.to as Date;

    // Create date-only objects for range boundaries
    const startDate = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate()
    );
    const endDate = new Date(
      to.getFullYear(),
      to.getMonth(),
      to.getDate()
    );

    return productionEntries.filter((entry) => {
      // 1. Capture potentially undefined value
      const rawDate = entry.date;
      
      // 2. Define a safe/fallback default
      const safeDate = (rawDate !== undefined && rawDate !== null)
        ? new Date(rawDate)
        : new Date(); // Default to current date
      
      // 3. Validate the date
      if (isNaN(safeDate.getTime())) {
        console.warn("Invalid production date:", rawDate);
        return false;
      }

      // 4. Compare only the date parts (year, month, day)
      const entryDate = new Date(
        safeDate.getFullYear(),
        safeDate.getMonth(),
        safeDate.getDate()
      );
      
      return entryDate >= startDate && entryDate <= endDate;
    })
  }, [productionEntries, dateRange])

  const filteredDisposal = useMemo(() => {
    // Check if entries array exists and has items
    if (!disposalEntries?.length) return [];
    // Check if date range is valid
    if (!dateRange?.from || !dateRange?.to) return [];

    // After null checks, we can safely assert these are Date objects
    const from = dateRange.from as Date;
    const to = dateRange.to as Date;

    // Create date-only objects for range boundaries
    const startDate = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate()
    );
    const endDate = new Date(
      to.getFullYear(),
      to.getMonth(),
      to.getDate()
    );

    return disposalEntries.filter((entry) => {
      // 1. Capture potentially undefined value
      const rawDate = entry.date;
      
      // 2. Define a safe/fallback default
      const safeDate = (rawDate !== undefined && rawDate !== null)
        ? new Date(rawDate)
        : new Date(); // Default to current date
      
      // 3. Validate the date
      if (isNaN(safeDate.getTime())) {
        console.warn("Invalid disposal date:", rawDate);
        return false;
      }

      // 4. Compare only the date parts (year, month, day)
      const entryDate = new Date(
        safeDate.getFullYear(),
        safeDate.getMonth(),
        safeDate.getDate()
      );
      
      return entryDate >= startDate && entryDate <= endDate;
    })
  }, [disposalEntries, dateRange])

  // Calculate metrics
  const metrics = useMemo(() => {
    // Default empty metrics
    const defaultMetrics = {
      totalProduction: 0,
      totalDisposal: 0,
      disposalRate: 0,
      productionByProduct: {},
      disposalByReason: {},
      productionByShift: {},
      disposalByShift: {},
      productionByDay: {},
      disposalByDay: {},
      productionTrend: 0,
      disposalTrend: 0,
    };

    // Check if we have any entries to process
    if (!filteredProduction?.length && !filteredDisposal?.length) {
      return defaultMetrics;
    }

    // Total production and disposal
    const totalProduction = filteredProduction?.reduce((sum, entry) => sum + (entry?.quantity || 0), 0) || 0;
    const totalDisposal = filteredDisposal?.reduce((sum, entry) => sum + (entry?.quantity || 0), 0) || 0;

    // Disposal rate
    const disposalRate = totalProduction > 0 ? (totalDisposal / totalProduction) * 100 : 0;

    // Production by product
    const productionByProduct = filteredProduction?.reduce(
      (acc, entry) => {
        if (entry?.product_name) {
          acc[entry.product_name] = (acc[entry.product_name] || 0) + (entry.quantity || 0);
        }
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Disposal by reason
    const disposalByReason = filteredDisposal?.reduce(
      (acc, entry) => {
        if (entry?.reason) {
          // Extract just the English part of the reason (before the slash)
          const reasonParts = entry.reason.split("/");
          const reason = reasonParts[0].trim();
          acc[reason] = (acc[reason] || 0) + (entry.quantity || 0);
        }
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Production by shift
    const productionByShift = filteredProduction?.reduce(
      (acc, entry) => {
        if (entry?.shift) {
          acc[entry.shift] = (acc[entry.shift] || 0) + (entry.quantity || 0);
        }
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Disposal by shift
    const disposalByShift = filteredDisposal?.reduce(
      (acc, entry) => {
        if (entry?.shift) {
          acc[entry.shift] = (acc[entry.shift] || 0) + (entry.quantity || 0);
        }
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Production by day
    const productionByDay = filteredProduction?.reduce(
      (acc, entry) => {
        if (entry?.date) {
          try {
            const date = new Date(entry.date);
            // Validate the date before formatting
            if (!isNaN(date.getTime())) {
              const dateStr = date.toISOString().split('T')[0]; // Use native formatting instead of date-fns
              acc[dateStr] = (acc[dateStr] || 0) + (entry.quantity || 0);
            } else {
              console.warn('Invalid date in production entry:', entry.id, entry.date);
            }
          } catch (error) {
            console.error('Error processing production entry date:', error, entry.id);
          }
        }
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Disposal by day
    const disposalByDay = filteredDisposal?.reduce(
      (acc, entry) => {
        if (entry?.date) {
          try {
            const date = new Date(entry.date);
            // Validate the date before formatting
            if (!isNaN(date.getTime())) {
              const dateStr = date.toISOString().split('T')[0]; // Use native formatting instead of date-fns
              acc[dateStr] = (acc[dateStr] || 0) + (entry.quantity || 0);
            } else {
              console.warn('Invalid date in disposal entry:', entry.id, entry.date);
            }
          } catch (error) {
            console.error('Error processing disposal entry date:', error, entry.id);
          }
        }
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Trend analysis (compare last 7 days with previous 7 days)
    const today = new Date();
    const last7Days = subDays(today, 7);
    const previous7Days = subDays(last7Days, 7);

    // Create date-only objects for comparison
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const last7DaysDate = new Date(last7Days.getFullYear(), last7Days.getMonth(), last7Days.getDate());
    const previous7DaysDate = new Date(previous7Days.getFullYear(), previous7Days.getMonth(), previous7Days.getDate());

    const last7DaysProduction = filteredProduction?.filter((entry) => {
      if (!entry?.date) return false;
      const entryDate = new Date(entry.date);
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      return entryDateOnly >= last7DaysDate && entryDateOnly <= todayDate;
    }).reduce((sum, entry) => sum + (entry?.quantity || 0), 0) || 0;

    const previous7DaysProduction = filteredProduction?.filter((entry) => {
      if (!entry?.date) return false;
      const entryDate = new Date(entry.date);
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      return entryDateOnly >= previous7DaysDate && entryDateOnly <= last7DaysDate;
    }).reduce((sum, entry) => sum + (entry?.quantity || 0), 0) || 0;

    const productionTrend =
      previous7DaysProduction > 0
        ? ((last7DaysProduction - previous7DaysProduction) / previous7DaysProduction) * 100
        : 0;

    const last7DaysDisposal = filteredDisposal?.filter((entry) => {
      if (!entry?.date) return false;
      const entryDate = new Date(entry.date);
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      return entryDateOnly >= last7DaysDate && entryDateOnly <= todayDate;
    }).reduce((sum, entry) => sum + (entry?.quantity || 0), 0) || 0;

    const previous7DaysDisposal = filteredDisposal?.filter((entry) => {
      if (!entry?.date) return false;
      const entryDate = new Date(entry.date);
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      return entryDateOnly >= previous7DaysDate && entryDateOnly <= last7DaysDate;
    }).reduce((sum, entry) => sum + (entry?.quantity || 0), 0) || 0;

    const disposalTrend =
      previous7DaysDisposal > 0 ? ((last7DaysDisposal - previous7DaysDisposal) / previous7DaysDisposal) * 100 : 0;

    return {
      totalProduction,
      totalDisposal,
      disposalRate,
      productionByProduct,
      disposalByReason,
      productionByShift,
      disposalByShift,
      productionByDay,
      disposalByDay,
      productionTrend,
      disposalTrend,
    }
  }, [filteredProduction, filteredDisposal])

  // Format data for charts
  const productionByProductChart = useMemo(() => {
    return Object.entries(metrics.productionByProduct)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 10) // Limit to top 10 for better visualization
  }, [metrics.productionByProduct])

  const disposalByReasonChart = useMemo(() => {
    return Object.entries(metrics.disposalByReason)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
  }, [metrics.disposalByReason])

  const productionByShiftChart = useMemo(() => {
    return Object.entries(metrics.productionByShift).map(([name, value]) => ({
      name: name === "day" ? "Day Shift" : "Night Shift",
      value,
    }))
  }, [metrics.productionByShift])

  const disposalByShiftChart = useMemo(() => {
    return Object.entries(metrics.disposalByShift).map(([name, value]) => ({
      name: name === "day" ? "Day Shift" : "Night Shift",
      value,
    }))
  }, [metrics.disposalByShift])

  const timeSeriesData = useMemo(() => {
    const dates = new Set([...Object.keys(metrics.productionByDay), ...Object.keys(metrics.disposalByDay)])

    return Array.from(dates)
      .sort()
      .map((date) => ({
        date: format(parseISO(date), "dd/MM"),
        fullDate: date,
        production: metrics.productionByDay[date as keyof typeof metrics.productionByDay] || 0,
        disposal: metrics.disposalByDay[date as keyof typeof metrics.disposalByDay] || 0,
      }))
  }, [metrics.productionByDay, metrics.disposalByDay])

  // Check for database setup errors - AFTER all hooks have been called
  const isDatabaseSetupError = error && (
    error.includes("table") || 
    error.includes("doesn't exist") ||
    error.includes("not exist") ||
    error.includes("relation")
  )

  // If there's a database setup error, show the setup guide
  if (isDatabaseSetupError) {
    return <DatabaseSetupGuide errorMessage={error} />
  }

  // Show general error message for other errors
  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[60px] w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }

  // If we get here, we're ready to render the dashboard content
  return <DashboardContent 
    dateRange={dateRange} 
    onDateChange={handleDateRangeChange}
    productionEntries={filteredProduction}
    disposalEntries={filteredDisposal}
    products={products}
    metrics={metrics}
    productionByProductChart={productionByProductChart}
    disposalByReasonChart={disposalByReasonChart}
    productionByShiftChart={productionByShiftChart}
    disposalByShiftChart={disposalByShiftChart}
    timeSeriesData={timeSeriesData}
  />
}

// Separate component to render the dashboard content
function DashboardContent({
  dateRange,
  onDateChange,
  productionEntries,
  disposalEntries,
  products,
  metrics,
  productionByProductChart,
  disposalByReasonChart,
  productionByShiftChart,
  disposalByShiftChart,
  timeSeriesData,
}: {
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
  productionEntries: any[];
  disposalEntries: any[];
  products: any[];
  metrics: any;
  productionByProductChart: any[];
  disposalByReasonChart: any[];
  productionByShiftChart: any[];
  disposalByShiftChart: any[];
  timeSeriesData: any[];
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalProduction)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.productionTrend > 0 ? (
                <span className="flex items-center text-green-500">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  {metrics.productionTrend.toFixed(1)}% from last week
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <ArrowDown className="mr-1 h-3 w-3" />
                  {Math.abs(metrics.productionTrend).toFixed(1)}% from last week
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disposal</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalDisposal)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.disposalTrend > 0 ? (
                <span className="flex items-center text-red-500">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  {metrics.disposalTrend.toFixed(1)}% from last week
                </span>
              ) : (
                <span className="flex items-center text-green-500">
                  <ArrowDown className="mr-1 h-3 w-3" />
                  {Math.abs(metrics.disposalTrend).toFixed(1)}% from last week
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disposal Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.disposalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.disposalRate > 10 ? (
                <span className="text-red-500">High disposal rate</span>
              ) : (
                <span className="text-green-500">Normal disposal rate</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.length > 0 ? (
                <span className="text-green-500">Products configured</span>
              ) : (
                <span className="text-red-500">No products configured</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="disposal">Disposal</TabsTrigger>
          <TabsTrigger value="waste">Waste Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Production by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productionByProductChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productionByProductChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Waste Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={disposalByReasonChart}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
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
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        fill="#FF8042" 
                        name="Quantity"
                        radius={[0, 4, 4, 0]}
                      >
                        {disposalByReasonChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Production and Disposal Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="production" stroke="#0088FE" name="Production" />
                    <Line type="monotone" dataKey="disposal" stroke="#FF8042" name="Disposal" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Production by Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productionByShiftChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productionByShiftChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Production by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionByProductChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" fill="#0088FE" name="Production" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="disposal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Disposal by Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disposalByShiftChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {disposalByShiftChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Disposal by Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={disposalByReasonChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" fill="#FF8042" name="Disposal" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="waste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Waste Analytics Report</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Waste Analytics Visualizations */}
              <WasteAnalyticsVisuals
                productionEntries={productionEntries}
                disposalEntries={disposalEntries}
                products={products}
                fromDate={dateRange.from ?? new Date()}
                toDate={dateRange.to ?? new Date()}
              />
              {/* Table and Export */}
              <WasteAnalyticsExportWrapper
                productionEntries={productionEntries}
                disposalEntries={disposalEntries}
                products={products}
                fromDate={dateRange.from ?? new Date()}
                toDate={dateRange.to ?? new Date()}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <Card><CardHeader><CardTitle>Performance</CardTitle></CardHeader><CardContent>Performance coming soon.</CardContent></Card>
        </TabsContent>
        <TabsContent value="ai" className="space-y-4">
          <Card><CardHeader><CardTitle>AI Insights</CardTitle></CardHeader><CardContent>AI Insights coming soon.</CardContent></Card>
        </TabsContent>
        <TabsContent value="entries" className="space-y-4">
          <Card><CardHeader><CardTitle>Entries</CardTitle></CardHeader><CardContent>Entries coming soon.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// WasteAnalyticsExportWrapper wraps the table and export button
function WasteAnalyticsExportWrapper({ productionEntries, disposalEntries, products, fromDate, toDate }: {
  productionEntries: any[];
  disposalEntries: any[];
  products: any[];
  fromDate: Date;
  toDate: Date;
}) {
  const [sortKey, setSortKey] = useState<keyof ProductWasteReport>('total_discarded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const report = useMemo(() => generateProductWasteReport({ productionEntries, disposalEntries, products, fromDate, toDate }), [productionEntries, disposalEntries, products, fromDate, toDate]);
  const sorted = useMemo(() => {
    return [...report].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string') return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [report, sortKey, sortOrder]);
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
    // Standard download approach for all modern browsers
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
    // For legacy IE support, see: https://stackoverflow.com/a/30832210/1106414
  }
  return (
    <>
      <div className="mb-2 flex justify-end">
        <button className="px-3 py-1 rounded bg-primary text-white text-xs hover:bg-primary/90" onClick={exportCSV}>
          Export CSV
        </button>
      </div>
      <WasteAnalyticsTable
        report={sorted}
        columns={columns}
        sortKey={sortKey}
        setSortKey={setSortKey}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
    </>
  );
}
// WasteAnalyticsTable now receives report, columns, sortKey, setSortKey, sortOrder, setSortOrder
function WasteAnalyticsTable({ report, columns, sortKey, setSortKey, sortOrder, setSortOrder }: {
  report: ProductWasteReport[];
  columns: { key: keyof ProductWasteReport; label: string }[];
  sortKey: keyof ProductWasteReport;
  setSortKey: (k: keyof ProductWasteReport) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (o: 'asc' | 'desc') => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-2 py-1 border-b cursor-pointer" onClick={() => {
                if (sortKey === col.key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortKey(col.key); setSortOrder('desc'); }
              }}>
                {col.label} {sortKey === col.key ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.map(row => (
            <tr key={row.product_id}>
              <td className="px-2 py-1 border-b">{row.product_name}</td>
              <td className="px-2 py-1 border-b text-right">{row.total_discarded}</td>
              <td className="px-2 py-1 border-b text-right">{row.days_discarded}</td>
              <td className="px-2 py-1 border-b text-right">{row.avg_per_day}</td>
              <td className="px-2 py-1 border-b text-right">{row.total_produced}</td>
              <td className="px-2 py-1 border-b text-right">{row.discard_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {report.length === 0 && <div className="text-center text-muted-foreground py-4">No data for selected range.</div>}
    </div>
  );
}

// WasteAnalyticsVisuals: new component for charts
function WasteAnalyticsVisuals({ productionEntries, disposalEntries, products, fromDate, toDate }: {
  productionEntries: any[];
  disposalEntries: any[];
  products: any[];
  fromDate: Date;
  toDate: Date;
}) {
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

