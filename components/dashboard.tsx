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
    if (!dateRange.from || !dateRange.to || !productionEntries.length) return [];

    return productionEntries.filter((entry) => {
      const entryDate = parseISO(entry.date)
      return isWithinInterval(entryDate, {
        start: dateRange.from as Date,
        end: dateRange.to as Date,
      })
    })
  }, [productionEntries, dateRange])

  const filteredDisposal = useMemo(() => {
    if (!dateRange.from || !dateRange.to || !disposalEntries.length) return [];

    return disposalEntries.filter((entry) => {
      const entryDate = parseISO(entry.date)
      return isWithinInterval(entryDate, {
        start: dateRange.from as Date,
        end: dateRange.to as Date,
      })
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

    if (!filteredProduction.length && !filteredDisposal.length) {
      return defaultMetrics;
    }

    // Total production and disposal
    const totalProduction = filteredProduction.reduce((sum, entry) => sum + entry.quantity, 0)
    const totalDisposal = filteredDisposal.reduce((sum, entry) => sum + entry.quantity, 0)

    // Disposal rate
    const disposalRate = totalProduction > 0 ? (totalDisposal / totalProduction) * 100 : 0

    // Production by product
    const productionByProduct = filteredProduction.reduce(
      (acc, entry) => {
        acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
        return acc
      },
      {} as Record<string, number>,
    )

    // Disposal by reason
    const disposalByReason = filteredDisposal.reduce(
      (acc, entry) => {
        // Extract just the English part of the reason (before the slash)
        const reasonParts = entry.reason.split("/")
        const reason = reasonParts[0].trim()
        acc[reason] = (acc[reason] || 0) + entry.quantity
        return acc
      },
      {} as Record<string, number>,
    )

    // Production by shift
    const productionByShift = filteredProduction.reduce(
      (acc, entry) => {
        acc[entry.shift] = (acc[entry.shift] || 0) + entry.quantity
        return acc
      },
      {} as Record<string, number>,
    )

    // Disposal by shift
    const disposalByShift = filteredDisposal.reduce(
      (acc, entry) => {
        acc[entry.shift] = (acc[entry.shift] || 0) + entry.quantity
        return acc
      },
      {} as Record<string, number>,
    )

    // Production by day
    const productionByDay = filteredProduction.reduce(
      (acc, entry) => {
        const date = entry.date
        acc[date] = (acc[date] || 0) + entry.quantity
        return acc
      },
      {} as Record<string, number>,
    )

    // Disposal by day
    const disposalByDay = filteredDisposal.reduce(
      (acc, entry) => {
        const date = entry.date
        acc[date] = (acc[date] || 0) + entry.quantity
        return acc
      },
      {} as Record<string, number>,
    )

    // Trend analysis (compare last 7 days with previous 7 days)
    const today = new Date()
    const last7Days = subDays(today, 7)
    const previous7Days = subDays(last7Days, 7)

    const last7DaysProduction = filteredProduction
      .filter((entry) => {
        const entryDate = parseISO(entry.date)
        return isWithinInterval(entryDate, { start: last7Days, end: today })
      })
      .reduce((sum, entry) => sum + entry.quantity, 0)

    const previous7DaysProduction = filteredProduction
      .filter((entry) => {
        const entryDate = parseISO(entry.date)
        return isWithinInterval(entryDate, { start: previous7Days, end: last7Days })
      })
      .reduce((sum, entry) => sum + entry.quantity, 0)

    const productionTrend =
      previous7DaysProduction > 0
        ? ((last7DaysProduction - previous7DaysProduction) / previous7DaysProduction) * 100
        : 0

    const last7DaysDisposal = filteredDisposal
      .filter((entry) => {
        const entryDate = parseISO(entry.date)
        return isWithinInterval(entryDate, { start: last7Days, end: today })
      })
      .reduce((sum, entry) => sum + entry.quantity, 0)

    const previous7DaysDisposal = filteredDisposal
      .filter((entry) => {
        const entryDate = parseISO(entry.date)
        return isWithinInterval(entryDate, { start: previous7Days, end: last7Days })
      })
      .reduce((sum, entry) => sum + entry.quantity, 0)

    const disposalTrend =
      previous7DaysDisposal > 0 ? ((last7DaysDisposal - previous7DaysDisposal) / previous7DaysDisposal) * 100 : 0

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
    error.message.includes("table") || 
    error.message.includes("doesn't exist") ||
    error.message.includes("not exist") ||
    error.message.includes("relation")
  )

  // If there's a database setup error, show the setup guide
  if (isDatabaseSetupError) {
    return <DatabaseSetupGuide errorMessage={error.message} />
  }

  // Show general error message for other errors
  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
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
    setDateRange={handleDateRangeChange}
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
  setDateRange,
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
  setDateRange: (range: DateRange) => void;
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalProduction)}</div>
            <div className="flex items-center mt-1">
              {metrics.productionTrend > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{metrics.productionTrend.toFixed(1)}% from previous period
                  </span>
                </>
              ) : metrics.productionTrend < 0 ? (
                <>
                  <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-600">
                    {metrics.productionTrend.toFixed(1)}% from previous period
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No change from previous period</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disposal</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalDisposal)}</div>
            <div className="flex items-center mt-1">
              {metrics.disposalTrend > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-600">
                    +{metrics.disposalTrend.toFixed(1)}% from previous period
                  </span>
                </>
              ) : metrics.disposalTrend < 0 ? (
                <>
                  <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600">
                    {Math.abs(metrics.disposalTrend).toFixed(1)}% from previous period
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No change from previous period</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disposal Rate</CardTitle>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.disposalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Percentage of production that was disposed</p>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Total number of products tracked</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="disposal">Disposal</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2 transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Production vs Disposal Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(value) => value} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="production"
                        name="Production"
                        stroke="#0088FE"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="disposal"
                        name="Disposal"
                        stroke="#FF8042"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Shift Comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {productionByShiftChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productionByShiftChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={renderCustomizedLabel}
                      >
                        {productionByShiftChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Recent Production</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productionEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{entry.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(entry.date)} - {entry.staff_name}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {formatNumber(entry.quantity)} units
                        <Badge variant="outline" className="ml-2">
                          {entry.shift === "day" ? "Day" : "Night"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {productionEntries.length === 0 && (
                    <p className="text-muted-foreground">No production entries for the selected period</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Recent Disposal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disposalEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{entry.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(entry.date)} - {entry.reason.split("/")[0]}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {formatNumber(entry.quantity)} units
                        <Badge variant="outline" className="ml-2">
                          {entry.shift === "day" ? "Day" : "Night"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {disposalEntries.length === 0 && (
                    <p className="text-muted-foreground">No disposal entries for the selected period</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Production by Product</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {productionByProductChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productionByProductChart}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 100,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#0088FE" name="Quantity" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Production by Shift</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {productionByShiftChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productionByShiftChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={renderCustomizedLabel}
                      >
                        {productionByShiftChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                      <Legend />
                    </PieChart>
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
        <TabsContent value="disposal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Disposal by Reason</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {disposalByReasonChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={disposalByReasonChart}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 100,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#FF8042" name="Quantity" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Disposal by Shift</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {disposalByShiftChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disposalByShiftChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={renderCustomizedLabel}
                      >
                        {disposalByShiftChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                      <Legend />
                    </PieChart>
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
      </Tabs>
    </div>
  )
}

