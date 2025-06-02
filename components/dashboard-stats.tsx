"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber } from "@/lib/utils"
import { TrendingUp, TrendingDown, AlertTriangle, PercentIcon, Activity, ShoppingBag, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { differenceInDays, format, isSameDay, isWithinInterval, subDays } from "date-fns"
import { useData } from "@/components/providers/data-provider"
import { Skeleton } from "@/components/ui/skeleton"

// Define animation classes
const animationClasses = "transition-transform hover:scale-105 hover:shadow-lg duration-300 ease-in-out"

interface DashboardStatsProps {
  productionEntries: ProductionEntry[]
  disposalEntries: DisposalEntry[]
  dateFrom?: Date
  dateTo?: Date
}

export function DashboardStats({ productionEntries, disposalEntries, dateFrom, dateTo }: DashboardStatsProps) {
  const { isLoading } = useData()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter entries based on provided dateFrom and dateTo
  const filteredData = useMemo(() => {
    const now = new Date()
    const effectiveStart = dateFrom || subDays(now, 7) // Default to last 7 days if dateFrom is not provided
    const effectiveEnd = dateTo || now

    const filtered = {
      production: productionEntries.filter(entry => {
        const entryDate = new Date(entry.date)
        return isWithinInterval(entryDate, { start: effectiveStart, end: effectiveEnd })
      }),
      disposal: disposalEntries.filter(entry => {
        const entryDate = new Date(entry.date)
        return isWithinInterval(entryDate, { start: effectiveStart, end: effectiveEnd })
      })
    }
    return filtered
  }, [productionEntries, disposalEntries, dateFrom, dateTo])
  
  // Calculate key metrics
  const metrics = useMemo(() => {
    // Get previous time period for comparison
    const now = new Date()
    let periodLength: number = 7 // Initialize with default value
    const currentStart = subDays(now, periodLength)
    const previousStart = subDays(currentStart, periodLength)
    
    // Current period stats
    const totalProduction = filteredData.production.reduce((sum, entry) => sum + entry.quantity, 0)
    const totalDisposal = filteredData.disposal.reduce((sum, entry) => sum + entry.quantity, 0)
    const disposalRate = totalProduction > 0 ? (totalDisposal / totalProduction) * 100 : 0
    
    // Previous period stats
    const previousPeriodProduction = productionEntries
      .filter(entry => {
        const entryDate = new Date(entry.date)
        return isWithinInterval(entryDate, { start: previousStart, end: currentStart })
      })
      .reduce((sum, entry) => sum + entry.quantity, 0)
    
    const previousPeriodDisposal = disposalEntries
      .filter(entry => {
        const entryDate = new Date(entry.date)
        return isWithinInterval(entryDate, { start: previousStart, end: currentStart })
      })
      .reduce((sum, entry) => sum + entry.quantity, 0)
    
    const previousDisposalRate = previousPeriodProduction > 0 
      ? (previousPeriodDisposal / previousPeriodProduction) * 100 
      : 0
    
    // Calculate changes
    const productionChange = previousPeriodProduction > 0 
      ? ((totalProduction - previousPeriodProduction) / previousPeriodProduction) * 100 
      : 0
    
    const disposalChange = previousPeriodDisposal > 0 
      ? ((totalDisposal - previousPeriodDisposal) / previousPeriodDisposal) * 100 
      : 0
    
    const rateChange = previousDisposalRate > 0 
      ? disposalRate - previousDisposalRate 
      : 0
    
    return {
      production: {
        total: totalProduction,
        change: productionChange,
        improving: productionChange > 0
      },
      disposal: {
        total: totalDisposal,
        change: disposalChange,
        improving: disposalChange < 0
      },
      rate: {
        value: disposalRate,
        change: rateChange,
        improving: rateChange < 0
      },
      efficiency: {
        value: 100 - disposalRate,
        change: -rateChange,
        improving: rateChange < 0
      }
    }
  }, [filteredData, productionEntries, disposalEntries])
  
  // Calculate daily trends
  const dailyTrends = useMemo(() => {
    const days = 7
    const dailyData = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i)
      
      const dayProduction = filteredData.production
        .filter(entry => isSameDay(new Date(entry.date), date))
        .reduce((sum, entry) => sum + entry.quantity, 0)
      
      const dayDisposal = filteredData.disposal
        .filter(entry => isSameDay(new Date(entry.date), date))
        .reduce((sum, entry) => sum + entry.quantity, 0)
      
      const dayRate = dayProduction > 0 ? (dayDisposal / dayProduction) * 100 : 0
      
      dailyData.push({
        date: format(date, "EEE"),
        fullDate: format(date, "MMM dd"),
        production: dayProduction,
        disposal: dayDisposal,
        rate: parseFloat(dayRate.toFixed(1))
      })
    }
    
    return dailyData
  }, [filteredData])
  
  // Get color based on change
  const getChangeColor = (change: number, improving: boolean) => {
    if (Math.abs(change) < 0.5) return "text-gray-500"
    return improving ? "text-green-500" : "text-red-500"
  }
  
  // Get icon based on change
  const getChangeIcon = (change: number, improving: boolean) => {
    if (Math.abs(change) < 0.5) return null
    
    return improving ? (
      <TrendingUp className="h-4 w-4 ml-1" />
    ) : (
      <TrendingDown className="h-4 w-4 ml-1" />
    )
  }
  
  if (!mounted) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs 
        className="w-full sm:max-w-[400px]"
      >
        {/* Removed TabsList and TabsTrigger for 'Today', 'This Week', and 'This Month' */}
      </Tabs>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Production Card */}
        <Card className={`bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 ${animationClasses}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.production.total)}</div>
            <div className="flex items-center mt-1">
              <p className={`text-xs ${getChangeColor(metrics.production.change, metrics.production.improving)}`}>
                {metrics.production.change > 0 ? "+" : ""}
                {metrics.production.change.toFixed(1)}% from previous period
                {getChangeIcon(metrics.production.change, metrics.production.improving)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Disposal Card */}
        <Card className={`bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 ${animationClasses}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disposal</CardTitle>
            <Trash2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.disposal.total)}</div>
            <div className="flex items-center mt-1">
              <p className={`text-xs ${getChangeColor(metrics.disposal.change, metrics.disposal.improving)}`}>
                {metrics.disposal.change > 0 ? "+" : ""}
                {metrics.disposal.change.toFixed(1)}% from previous period
                {getChangeIcon(metrics.disposal.change, metrics.disposal.improving)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Disposal Rate Card */}
        <Card className={`bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 ${animationClasses}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disposal Rate</CardTitle>
            <PercentIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rate.value.toFixed(1)}%</div>
            <div className="flex items-center mt-1">
              <p className={`text-xs ${getChangeColor(metrics.rate.change, metrics.rate.improving)}`}>
                {metrics.rate.change > 0 ? "+" : ""}
                {metrics.rate.change.toFixed(1)}% from previous period
                {getChangeIcon(metrics.rate.change, metrics.rate.improving)}
              </p>
            </div>
            <Progress 
              value={Math.min(100, metrics.rate.value * 2)} 
              className="h-1.5 mt-3" 
            />
          </CardContent>
        </Card>
        
        {/* Efficiency Card */}
        <Card className={`bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 ${animationClasses}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.efficiency.value.toFixed(1)}%</div>
            <div className="flex items-center mt-1">
              <p className={`text-xs ${getChangeColor(metrics.efficiency.change, metrics.efficiency.improving)}`}>
                {metrics.efficiency.change > 0 ? "+" : ""}
                {metrics.efficiency.change.toFixed(1)}% from previous period
                {getChangeIcon(metrics.efficiency.change, metrics.efficiency.improving)}
              </p>
            </div>
            <Progress 
              value={metrics.efficiency.value} 
              className="h-1.5 mt-3" 
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Daily Insights */}
      <Card className="mt-6 dark:border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>
            Efficiency trends across recent days
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-2 min-w-[500px]">
            {dailyTrends.map((day, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <span className="text-xs text-muted-foreground">{day.date}</span>
                <div className="mt-1 flex h-14 w-full flex-col items-center justify-end">
                  <div 
                    className={`w-full rounded-sm ${
                      day.rate > 15 
                        ? "bg-red-500" 
                        : day.rate > 10 
                          ? "bg-amber-500" 
                          : "bg-green-500"
                    }`}
                    style={{ height: `${Math.max(8, Math.min(100, day.rate * 4))}%` }}
                  />
                </div>
                <span className="mt-1 text-xs">{day.rate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-center w-full gap-3 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
              <span>Good (&lt;10%)</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-amber-500 mr-1"></div>
              <span>Warning (10-15%)</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
              <span>Critical (&gt;15%)</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}