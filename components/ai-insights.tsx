"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/components/providers/data-provider"
import { formatNumber, formatDate } from "@/lib/utils"
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RotateCcw, ArrowRight, AlertCircle, Info, CheckCircle2, BrainCircuit, Filter, RefreshCw, BarChart3, LineChart, PieChart, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Insight, ProductionEntry, DisposalEntry } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { addDays, isSameDay, isWithinInterval, startOfWeek, endOfWeek, format, subDays, differenceInDays } from "date-fns"

// Define animation variants for the cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

// Define colors for different insights
const insightTypeColors = {
  warning: "amber",
  info: "blue",
  success: "green"
};

interface AIInsightsProps {
  dateFrom?: Date
  dateTo?: Date
  selectedProduct?: string
}

export function AIInsights({ dateFrom, dateTo, selectedProduct }: AIInsightsProps) {
  const { productionEntries, disposalEntries, isLoading, error } = useData()
  const [insights, setInsights] = useState<Insight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("all")
  const [insightFilter, setInsightFilter] = useState<"all" | "warning" | "info" | "success">("all")
  const [showProgress, setShowProgress] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  // Use useEffect to set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Filter entries by date range and product
  const filteredEntries = useMemo(() => {
    let fromDate = dateFrom
    let toDate = dateTo || new Date()
    
    if (timeframe !== "all") {
      if (timeframe === "week") {
        fromDate = subDays(new Date(), 7)
      } else if (timeframe === "month") {
        fromDate = subDays(new Date(), 30)
      }
    }
    
    return {
      production: productionEntries.filter(entry => {
        const entryDate = new Date(entry.date)
        const isInDateRange = (!fromDate || entryDate >= fromDate) && (entryDate <= toDate)
        const matchesProduct = !selectedProduct || entry.product_name === selectedProduct
        return isInDateRange && matchesProduct
      }),
      disposal: disposalEntries.filter(entry => {
        const entryDate = new Date(entry.date)
        const isInDateRange = (!fromDate || entryDate >= fromDate) && (entryDate <= toDate)
        const matchesProduct = !selectedProduct || entry.product_name === selectedProduct
        return isInDateRange && matchesProduct
      })
    }
  }, [productionEntries, disposalEntries, dateFrom, dateTo, selectedProduct, timeframe])
  
  // Generate insights when entries change or timeframe changes
  useEffect(() => {
    if (!isLoading && (filteredEntries.production.length > 0 || filteredEntries.disposal.length > 0) && mounted) {
        generateInsights()
    }
  }, [filteredEntries, isLoading, timeframe, mounted])
  
  // Function to generate insights with progress animation
  const handleGenerateInsights = () => {
    setIsAnalyzing(true)
    setShowProgress(true)
    setProgressValue(0)
    
    // Simulate AI analysis with progress updates
    const progressInterval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 5
      })
    }, 100)
    
    // Generate insights after "analysis" is complete
    setTimeout(() => {
      clearInterval(progressInterval)
      setProgressValue(100)
      
      // Wait a bit after reaching 100% for smoother UX
      setTimeout(() => {
        generateInsights()
        setIsAnalyzing(false)
        setShowProgress(false)
      }, 500)
    }, 2000)
  }
  
  // Function to generate insights from the data
  const generateInsights = () => {
    setIsAnalyzing(true)
    try {
      const newInsights: Insight[] = []
      
      // Calculate total production and disposal
      const totalProduction = filteredEntries.production.reduce((sum, entry) => sum + entry.quantity, 0)
      const totalDisposal = filteredEntries.disposal.reduce((sum, entry) => sum + entry.quantity, 0)
      
      // Calculate disposal rate
      const disposalRate = totalProduction > 0 ? (totalDisposal / totalProduction) * 100 : 0
      
      // 1. Insight on overall disposal rate
      if (disposalRate > 15) {
        newInsights.push({
          id: "disposal-rate-high",
          title: "High Disposal Rate",
          description: `Your overall disposal rate of ${disposalRate.toFixed(1)}% exceeds the recommended limit of 15%. Consider reviewing your production processes and quality control measures to identify potential improvement areas.`,
          type: "warning",
          priority: "high",
          date: new Date().toISOString(),
          category: "performance",
          icon: <AlertTriangle className="h-4 w-4" />,
          data: { rate: disposalRate }
        })
      } else if (disposalRate < 5) {
        newInsights.push({
          id: "disposal-rate-excellent",
          title: "Excellent Disposal Rate",
          description: `Your overall disposal rate of ${disposalRate.toFixed(1)}% is below 5%, which is excellent. Continue maintaining these high standards and document your current processes for training and reference.`,
          type: "success",
          priority: "medium",
          date: new Date().toISOString(),
          category: "performance",
          icon: <CheckCircle2 className="h-4 w-4" />,
          data: { rate: disposalRate }
        })
      } else {
        newInsights.push({
          id: "disposal-rate-moderate",
          title: "Moderate Disposal Rate",
          description: `Your disposal rate of ${disposalRate.toFixed(1)}% is within acceptable range but could be improved. Focus on your highest disposal products to bring this rate down further.`,
          type: "info",
          priority: "medium",
          date: new Date().toISOString(),
          category: "performance",
          icon: <Info className="h-4 w-4" />,
          data: { rate: disposalRate }
        })
      }
      
      // 2. Product-specific insights
      if (filteredEntries.production.length > 0) {
        // Group by product
        const productMap = new Map<string, { production: number, disposal: number }>()
        
        // Sum production by product
        filteredEntries.production.forEach(entry => {
          const current = productMap.get(entry.product_name) || { production: 0, disposal: 0 }
          productMap.set(entry.product_name, {
            ...current,
            production: current.production + entry.quantity
          })
        })
        
        // Sum disposal by product
        filteredEntries.disposal.forEach(entry => {
          const current = productMap.get(entry.product_name) || { production: 0, disposal: 0 }
          productMap.set(entry.product_name, {
            ...current,
            disposal: current.disposal + entry.quantity
          })
        })
        
        // Calculate stats
        const productStats = Array.from(productMap.entries()).map(([name, data]) => {
          const rate = data.production > 0 ? (data.disposal / data.production) * 100 : 0
      return {
            name,
            production: data.production,
            disposal: data.disposal,
            rate
          }
        })
        
        // Find products with high disposal rates
        const highDisposalProducts = productStats
          .filter(p => p.production > 10 && p.rate > 20)
      .sort((a, b) => b.rate - a.rate)

        if (highDisposalProducts.length > 0) {
          const worst = highDisposalProducts[0]
          newInsights.push({
            id: `high-disposal-${worst.name}`,
            title: `High Disposal Rate: ${worst.name}`,
            description: `${worst.name} has a disposal rate of ${worst.rate.toFixed(1)}%, which is significantly above average. Consider reviewing quality control procedures, ingredient specifications, or production settings for this product specifically.`,
            type: "warning",
            priority: "high",
            date: new Date().toISOString(),
            category: "performance",
            icon: <AlertTriangle className="h-4 w-4" />,
            data: { product: worst.name, rate: worst.rate }
          })
        }
        
        // Find products with excellent efficiency
        const lowDisposalProducts = productStats
          .filter(p => p.production > 20 && p.rate < 3)
          .sort((a, b) => a.rate - b.rate)
        
        if (lowDisposalProducts.length > 0) {
          const best = lowDisposalProducts[0]
          newInsights.push({
            id: `low-disposal-${best.name}`,
            title: `Excellent Efficiency: ${best.name}`,
            description: `${best.name} has an exceptional disposal rate of only ${best.rate.toFixed(1)}%. Study the production process for this product to identify practices that could be applied to other products with higher disposal rates.`,
            type: "success",
            priority: "medium",
            date: new Date().toISOString(),
            category: "performance",
            icon: <CheckCircle2 className="h-4 w-4" />,
            data: { product: best.name, rate: best.rate }
          })
        }
        
        // Insight on production volume
        const totalProductionInsight: Insight = {
          id: "total-production",
          title: "Production Volume Analysis",
          description: `Total production of ${formatNumber(totalProduction)} units across ${productStats.length} products. ${
            selectedProduct 
              ? `${selectedProduct} accounts for ${formatNumber(productMap.get(selectedProduct)?.production || 0)} units.` 
              : `Top product by volume is ${productStats.sort((a, b) => b.production - a.production)[0].name}.`
          }`,
          type: "info",
          priority: "low",
          date: new Date().toISOString(),
          category: "performance",
          icon: <BarChart3 className="h-4 w-4" />,
          data: { totalProduction, productStats }
        }
        
        newInsights.push(totalProductionInsight)
      }
      
      // 3. Reason analysis
      if (filteredEntries.disposal.length > 0) {
        const disposalReasons: Record<string, number> = {}
        filteredEntries.disposal.forEach(entry => {
          if (entry.reason) {
            disposalReasons[entry.reason] = (disposalReasons[entry.reason] || 0) + entry.quantity
          }
        })
        
        const sortedReasons = Object.entries(disposalReasons)
          .sort((a, b) => b[1] - a[1])
          .map(([reason, quantity]) => ({ reason, quantity }))
        
        if (sortedReasons.length > 0 && totalDisposal > 0) {
          const topReason = sortedReasons[0]
          const percentage = (topReason.quantity / totalDisposal) * 100
          
          const reasonInsight: Insight = {
            id: `top-reason-${topReason.reason}`,
            title: `Main Disposal Reason: ${topReason.reason}`,
            description: `${topReason.reason} accounts for ${percentage.toFixed(1)}% of all disposals. ${
              percentage > 50 
                ? "This single reason represents more than half of all disposals, suggesting a focused improvement effort could have significant impact." 
                : "Consider targeted training or process improvements focused on reducing this specific issue."
            }`,
            type: percentage > 40 ? "warning" : "info",
            priority: percentage > 40 ? "high" : "medium",
            date: new Date().toISOString(),
            category: "analysis",
            icon: <PieChart className="h-4 w-4" />,
            data: { reason: topReason.reason, percentage }
          }
          
          newInsights.push(reasonInsight)
        }
      }
      
      // 4. Shift performance
      if (filteredEntries.production.length > 0 && filteredEntries.disposal.length > 0) {
        const shiftMap = new Map<string, { production: number, disposal: number }>()
        
        // Initialize shifts
        const shifts = ["morning", "afternoon", "night"]
        shifts.forEach(shift => {
          shiftMap.set(shift, { production: 0, disposal: 0 })
        })
        
        // Sum production by shift
        filteredEntries.production.forEach(entry => {
          const current = shiftMap.get(entry.shift) || { production: 0, disposal: 0 }
          shiftMap.set(entry.shift, {
            ...current,
            production: current.production + entry.quantity
          })
        })
        
        // Sum disposal by shift
        filteredEntries.disposal.forEach(entry => {
          const current = shiftMap.get(entry.shift) || { production: 0, disposal: 0 }
          shiftMap.set(entry.shift, {
            ...current,
            disposal: current.disposal + entry.quantity
          })
        })
        
        // Calculate rates and identify best/worst shifts
        const shiftRates = Array.from(shiftMap.entries())
          .map(([shift, data]) => ({
            shift,
            production: data.production,
            disposal: data.disposal,
            rate: data.production > 0 ? (data.disposal / data.production) * 100 : 0
          }))
          .filter(s => s.production > 0)
          .sort((a, b) => a.rate - b.rate)
        
        if (shiftRates.length >= 2) {
          const bestShift = shiftRates[0]
          const worstShift = shiftRates[shiftRates.length - 1]
          
          if (worstShift.rate - bestShift.rate > 5) {
            newInsights.push({
              id: "shift-performance-gap",
              title: "Shift Performance Gap",
              description: `The ${worstShift.shift} shift has a disposal rate of ${worstShift.rate.toFixed(1)}%, which is ${(worstShift.rate - bestShift.rate).toFixed(1)}% higher than the best performing ${bestShift.shift} shift (${bestShift.rate.toFixed(1)}%). Review staffing, training, and procedures between shifts to identify possible improvements.`,
              type: "warning",
              priority: "medium",
              date: new Date().toISOString(),
              category: "performance",
              icon: <Clock className="h-4 w-4" />,
              data: { shift: worstShift }
            })
          } else {
            newInsights.push({
              id: "shift-performance-consistent",
              title: "Consistent Shift Performance",
              description: `All shifts are performing within 5% of each other, indicating good standardization of processes across shifts. Best: ${bestShift.shift} (${bestShift.rate.toFixed(1)}%), Worst: ${worstShift.shift} (${worstShift.rate.toFixed(1)}%).`,
              type: "success",
              priority: "low",
              date: new Date().toISOString(),
              category: "performance",
              icon: <CheckCircle2 className="h-4 w-4" />,
              data: { shift: bestShift }
            })
          }
        }
      }
      
      // 5. Recent trend analysis
      if (dateFrom && dateTo && filteredEntries.production.length > 0) {
        const days = differenceInDays(dateTo, dateFrom) + 1
        
        if (days >= 14) {
          // Split the date range into two equal periods
          const midPoint = new Date(dateFrom.getTime() + (dateTo.getTime() - dateFrom.getTime()) / 2)
          
          // Filter entries for first and second half
          const firstHalfProduction = filteredEntries.production.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate <= midPoint
          })
          
          const firstHalfDisposal = filteredEntries.disposal.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate <= midPoint
          })
          
          const secondHalfProduction = filteredEntries.production.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate > midPoint
          })
          
          const secondHalfDisposal = filteredEntries.disposal.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate > midPoint
          })
          
          // Calculate rates for both periods
          const firstHalfTotal = firstHalfProduction.reduce((sum, entry) => sum + entry.quantity, 0)
          const firstHalfDisposalTotal = firstHalfDisposal.reduce((sum, entry) => sum + entry.quantity, 0)
          const firstHalfRate = firstHalfTotal > 0 ? (firstHalfDisposalTotal / firstHalfTotal) * 100 : 0
          
          const secondHalfTotal = secondHalfProduction.reduce((sum, entry) => sum + entry.quantity, 0)
          const secondHalfDisposalTotal = secondHalfDisposal.reduce((sum, entry) => sum + entry.quantity, 0)
          const secondHalfRate = secondHalfTotal > 0 ? (secondHalfDisposalTotal / secondHalfTotal) * 100 : 0
          
          // Calculate the trend
          const rateDifference = secondHalfRate - firstHalfRate
          
          if (Math.abs(rateDifference) >= 1) {
            const improving = rateDifference < 0
            
            newInsights.push({
              id: "disposal-trend",
              title: `${improving ? "Improving" : "Worsening"} Disposal Trend`,
              description: `Disposal rate has ${improving ? "decreased" : "increased"} by ${Math.abs(rateDifference).toFixed(1)}% over the analyzed period (from ${firstHalfRate.toFixed(1)}% to ${secondHalfRate.toFixed(1)}%). ${
                improving
                  ? "Continue with current improvement initiatives and document successful practices."
                  : "Review recent changes to production processes, staffing, or materials to identify potential causes."
              }`,
              type: improving ? "success" : "warning",
              priority: improving ? "medium" : "high",
              date: new Date().toISOString(),
              category: "trend",
              icon: improving ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
              data: { rateChange: rateDifference, recentRate: secondHalfRate, previousRate: firstHalfRate }
            })
          } else {
            newInsights.push({
              id: "disposal-trend-stable",
              title: "Stable Disposal Rate",
              description: `Disposal rate has remained relatively stable over the analyzed period, shifting only ${Math.abs(rateDifference).toFixed(1)}% (from ${firstHalfRate.toFixed(1)}% to ${secondHalfRate.toFixed(1)}%).`,
              type: "info",
              priority: "low",
              date: new Date().toISOString(),
              category: "trend",
              icon: <Info className="h-4 w-4" />,
              data: { rateChange: rateDifference, recentRate: secondHalfRate, previousRate: firstHalfRate }
            })
          }
        }
      }
      
      // Anomaly detection
      const dailyRates = new Map<string, number>()
      
      filteredEntries.production.forEach(entry => {
        const date = format(new Date(entry.date), "yyyy-MM-dd")
        const current = dailyRates.get(date) || 0
        dailyRates.set(date, current + entry.quantity)
      })
      
      filteredEntries.disposal.forEach(entry => {
        const date = format(new Date(entry.date), "yyyy-MM-dd")
        const current = dailyRates.get(date) || 0
        dailyRates.set(date, current - entry.quantity)
      })

      const rates = Array.from(dailyRates.values())
      const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      const stdDev = Math.sqrt(
        rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length
      )

      const anomalies = rates.filter(rate => Math.abs(rate - mean) > 2 * stdDev)
      if (anomalies.length > 0) {
        newInsights.push({
          id: "anomalies",
          title: "Unusual Activity Detected",
          description: `Found ${anomalies.length} days with unusual disposal patterns.`,
          type: "warning",
          priority: "high",
          date: new Date().toISOString(),
          category: "anomaly",
          icon: <AlertTriangle className="h-4 w-4" />,
          data: { anomalies: anomalies.length }
        })
      }
      
      // Filter insights based on the selected filter
      const filteredInsights = insightFilter === "all" 
        ? newInsights 
        : newInsights.filter(insight => insight.type === insightFilter)
      
      setInsights(filteredInsights)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error generating insights:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  // Get chart data for the trend analysis
  const trendChartData = useMemo(() => {
    if (!dateFrom || !dateTo) return []
    
    const days = differenceInDays(dateTo, dateFrom) + 1
    const data = []
    
    // Create data points for each day
    for (let i = 0; i < days; i++) {
      const date = addDays(dateFrom, i)
      const dateStr = format(date, "yyyy-MM-dd")
      
      // Find production and disposal for this day
      const dayProduction = filteredEntries.production
        .filter(entry => isSameDay(new Date(entry.date), date))
        .reduce((sum, entry) => sum + entry.quantity, 0)
      
      const dayDisposal = filteredEntries.disposal
        .filter(entry => isSameDay(new Date(entry.date), date))
        .reduce((sum, entry) => sum + entry.quantity, 0)
      
      const rate = dayProduction > 0 ? (dayDisposal / dayProduction) * 100 : 0
      
      data.push({
        date: dateStr,
        formattedDate: format(date, "MMM dd"),
        rate: parseFloat(rate.toFixed(1)),
        production: dayProduction,
        disposal: dayDisposal
      })
    }
    
    return data
  }, [dateFrom, dateTo, filteredEntries])
  
  // Calculate average disposal rate
  const averageRate = trendChartData.length > 0
    ? trendChartData.reduce((sum, item) => sum + item.rate, 0) / trendChartData.length
    : 0
  
  // Get icon based on insight type
  const getIconForType = (insight: Insight) => {
    if (insight.icon) {
      return insight.icon;
    }
    
    switch (insight.type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }
  
  // Get badge for priority
  const getBadgeForPriority = (insight: Insight) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
    
    switch (insight.priority) {
      case "high":
        variant = "destructive"
        break
      case "medium":
        variant = "default"
        break
      case "low":
      default:
        variant = "secondary"
    }
    
    return (
      <Badge variant={variant} className="ml-2">
        {insight.priority}
      </Badge>
    )
  }
  
  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Error analyzing data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to analyze production data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Handle loading state
  if (isLoading) {
  return (
      <Card>
      <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          <CardDescription>Analyzing your production data...</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
                      </div>
                    </CardContent>
                  </Card>
    )
  }

  if (!mounted) {
    return (
      <Card>
                    <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Analyzing your production data...</CardDescription>
                </CardHeader>
                <CardContent>
          <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
    )
  }
  
  return (
    <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>
            {lastUpdated 
              ? `Last updated ${format(lastUpdated, "MMM d, h:mm a")}`
              : "Analyzing your production data..."}
          </CardDescription>
                      </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateInsights}
          disabled={isAnalyzing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`} />
          {isAnalyzing ? "Analyzing..." : "Refresh"}
        </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
          {insights.map((insight) => (
            <Alert key={insight.id} variant={insight.type === "warning" ? "destructive" : "default"} className="dark:border-border/50">
              <div className="flex items-start space-x-2">
                {getIconForType(insight)}
                <div className="flex-1">
                  <AlertTitle className="flex items-center justify-between">
                    <span>{insight.title}</span>
                    {getBadgeForPriority(insight)}
                  </AlertTitle>
                  <AlertDescription>{insight.description}</AlertDescription>
                  {insight.data?.rate && (
                    <Progress 
                      value={Math.min(100, insight.data.rate * 2)} 
                      className="h-1.5 mt-3" 
                    />
                  )}
                      </div>
                      </div>
            </Alert>
          ))}
          {insights.length === 0 && !isAnalyzing && (
            <Alert className="dark:border-border/50">
              <Info className="h-4 w-4" />
              <AlertTitle>No Insights Available</AlertTitle>
              <AlertDescription>
                No significant patterns or issues detected in the current data.
              </AlertDescription>
            </Alert>
                  )}
                </div>
      </CardContent>
    </Card>
  )
}

