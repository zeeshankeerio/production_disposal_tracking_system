"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"
import { Search, Sparkles, X, Loader2, ArrowRight, BarChart2, PieChart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "./providers/data-provider"
import { formatDate, formatNumber } from "@/lib/utils"
import { format, parseISO, subDays } from "date-fns"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { ProductionEntry, DisposalEntry } from "@/lib/types"

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#6B66FF"]

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-2 text-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === "number" ? formatNumber(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function NLSearch() {
  const { productionEntries, disposalEntries, products } = useData()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Example search suggestions
  const searchSuggestions = [
    "Show me production for last week",
    "What's the disposal rate for chocolate cake?",
    "Which products have the highest disposal rates?",
    "Compare day shift vs night shift production",
    "Show me expired products from last month",
    "What's the trend for bread production?",
  ]

  useEffect(() => {
    // Filter suggestions based on input
    if (query.trim()) {
      const filtered = searchSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(query.toLowerCase()))
      setSuggestions(filtered.length > 0 ? filtered : searchSuggestions)
    } else {
      setSuggestions(searchSuggestions)
    }
  }, [query])

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchPerformed(true)
    setShowSuggestions(false)

    try {
      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const searchResults = processNaturalLanguageQuery(query)
      setResults(searchResults)
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setQuery("")
    setResults(null)
    setSearchPerformed(false)
    setShowSuggestions(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    handleSearch()
  }

  const processNaturalLanguageQuery = (query: string) => {
    const lowerQuery = query.toLowerCase()

    // Check for production queries
    if (lowerQuery.includes("production") || lowerQuery.includes("produced")) {
      // Production for last week
      if (lowerQuery.includes("last week") || lowerQuery.includes("past week")) {
        const today = new Date()
        const lastWeekStart = subDays(today, 7)

        const lastWeekProduction = productionEntries
          .filter((entry) => new Date(entry.date) >= lastWeekStart)
          .reduce((sum, entry) => sum + entry.quantity, 0)

        // Get daily breakdown
        const dailyProduction: Record<string, number> = {}
        productionEntries
          .filter((entry) => new Date(entry.date) >= lastWeekStart)
          .forEach((entry) => {
            const dateKey = formatDate(entry.date, "short")
            dailyProduction[dateKey] = (dailyProduction[dateKey] || 0) + entry.quantity
          })

        const chartData = Object.entries(dailyProduction)
          .map(([date, value]) => ({
            date: format(parseISO(date), "dd/MM"),
            value,
          }))
          .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

        return {
          type: "timeAnalysis",
          title: "Production for Last Week",
          value: lastWeekProduction,
          description: `Total production for the last 7 days is ${formatNumber(lastWeekProduction)} units.`,
          chartData,
          chartType: "bar",
        }
      }

      // Total production
      if (lowerQuery.includes("total")) {
        const total = productionEntries.reduce((sum, entry) => sum + entry.quantity, 0)
        return {
          type: "summary",
          title: "Total Production",
          value: total,
          description: `Total production across all products is ${formatNumber(total)} units.`,
        }
      }

      // Production by product
      if (lowerQuery.includes("by product") || lowerQuery.includes("per product")) {
        const byProduct = productionEntries.reduce(
          (acc, entry) => {
            acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
            return acc
          },
          {} as Record<string, number>,
        )

        const chartData = Object.entries(byProduct)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // Top 10 for better visualization

        return {
          type: "breakdown",
          title: "Production by Product",
          data: chartData,
          chartType: "bar",
        }
      }

      // Production by day
      if (lowerQuery.includes("by day") || lowerQuery.includes("per day") || lowerQuery.includes("daily")) {
        const byDay = productionEntries.reduce(
          (acc, entry) => {
            const dateKey = formatDate(entry.date, "short")
            acc[dateKey] = (acc[dateKey] || 0) + entry.quantity
            return acc
          },
          {} as Record<string, number>,
        )

        const chartData = Object.entries(byDay)
          .map(([date, value]) => ({
            date: format(parseISO(date), "dd/MM"),
            value,
          }))
          .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

        return {
          type: "timeSeries",
          title: "Production by Day",
          data: chartData,
          chartType: "bar",
        }
      }

      // Production by shift
      if (lowerQuery.includes("shift")) {
        const byShift = productionEntries.reduce(
          (acc, entry) => {
            acc[entry.shift.charAt(0).toUpperCase() + entry.shift.slice(1)] = 
              (acc[entry.shift.charAt(0).toUpperCase() + entry.shift.slice(1)] || 0) + entry.quantity
            return acc
          },
          {} as Record<string, number>,
        )

        const chartData = Object.entries(byShift).map(([name, value]) => ({
          name,
          value,
        }))

        return {
          type: "breakdown",
          title: "Production by Shift",
          data: chartData,
          chartType: "pie",
        }
      }

      // Specific product
      for (const product of products) {
        if (lowerQuery.includes(product.name.toLowerCase())) {
          const productEntries = productionEntries.filter((entry) => entry.product_id === product.id)

          const total = productEntries.reduce((sum, entry) => sum + entry.quantity, 0)

          // Get production trend by day
          const byDay = productEntries.reduce(
            (acc, entry) => {
              const dateKey = formatDate(entry.date, "short")
              acc[dateKey] = (acc[dateKey] || 0) + entry.quantity
              return acc
            },
            {} as Record<string, number>,
          )

          const chartData = Object.entries(byDay)
            .map(([date, value]) => ({
              date: format(parseISO(date), "dd/MM"),
              value,
            }))
            .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

          return {
            type: "productDetail",
            title: `Production of ${product.name}`,
            product,
            total,
            entries: productEntries.slice(0, 5),
            chartData,
            chartType: "bar",
          }
        }
      }
    }

    // Check for disposal queries
    if (lowerQuery.includes("disposal") || lowerQuery.includes("disposed") || lowerQuery.includes("waste")) {
      // Total disposal
      if (lowerQuery.includes("total")) {
        const total = disposalEntries.reduce((sum, entry) => sum + entry.quantity, 0)
        return {
          type: "summary",
          title: "Total Disposal",
          value: total,
          description: `Total disposal across all products is ${formatNumber(total)} units.`,
        }
      }

      // Disposal by reason
      if (lowerQuery.includes("reason") || lowerQuery.includes("why")) {
        const byReason = disposalEntries.reduce(
          (acc, entry) => {
            // Extract just the English part of the reason (before the slash)
            const reasonParts = entry.reason.split("/")
            const reason = reasonParts[0].trim()
            acc[reason] = (acc[reason] || 0) + entry.quantity
            return acc
          },
          {} as Record<string, number>,
        )

        const chartData = Object.entries(byReason)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        return {
          type: "breakdown",
          title: "Disposal by Reason",
          data: chartData,
          chartType: "pie",
        }
      }

      // Disposal by product
      if (lowerQuery.includes("by product") || lowerQuery.includes("per product")) {
        const byProduct = disposalEntries.reduce(
          (acc, entry) => {
            acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
            return acc
          },
          {} as Record<string, number>,
        )

        const chartData = Object.entries(byProduct)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // Top 10 for better visualization

        return {
          type: "breakdown",
          title: "Disposal by Product",
          data: chartData,
          chartType: "bar",
        }
      }

      // Specific product
      for (const product of products) {
        if (lowerQuery.includes(product.name.toLowerCase())) {
          const productEntries = disposalEntries.filter((entry) => entry.product_id === product.id)

          const total = productEntries.reduce((sum, entry) => sum + entry.quantity, 0)

          // Get disposal by reason for this product
          const byReason = productEntries.reduce(
            (acc, entry) => {
              // Extract just the English part of the reason (before the slash)
              const reasonParts = entry.reason.split("/")
              const reason = reasonParts[0].trim()
              acc[reason] = (acc[reason] || 0) + entry.quantity
              return acc
            },
            {} as Record<string, number>,
          )

          const chartData = Object.entries(byReason)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)

          return {
            type: "productDetail",
            title: `Disposal of ${product.name}`,
            product,
            total,
            entries: productEntries.slice(0, 5),
            chartData,
            chartType: "pie",
          }
        }
      }
    }

    // Check for disposal rate queries
    if (lowerQuery.includes("rate") || lowerQuery.includes("ratio") || lowerQuery.includes("percentage")) {
      // Overall disposal rate
      const totalProduction = productionEntries.reduce((sum, entry) => sum + entry.quantity, 0)
      const totalDisposal = disposalEntries.reduce((sum, entry) => sum + entry.quantity, 0)
      const rate = totalProduction > 0 ? (totalDisposal / totalProduction) * 100 : 0

      // Disposal rate by product
      const rateByProduct = products
        .map((product) => {
          const produced = productionEntries
            .filter((entry) => entry.product_id === product.id)
            .reduce((sum, entry) => sum + entry.quantity, 0)

          const disposed = disposalEntries
            .filter((entry) => entry.product_id === product.id)
            .reduce((sum, entry) => sum + entry.quantity, 0)

          const productRate = produced > 0 ? (disposed / produced) * 100 : 0

          return {
            name: product.name,
            rate: productRate,
            produced,
            disposed,
          }
        })
        .filter((item) => item.produced > 0)
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 10)

      return {
        type: "rateAnalysis",
        title: "Disposal Rate Analysis",
        value: `${rate.toFixed(1)}%`,
        description: `The overall disposal rate is ${rate.toFixed(1)}% (${formatNumber(totalDisposal)} disposed out of ${formatNumber(totalProduction)} produced).`,
        chartData: rateByProduct,
      }
    }

    // Check for comparison queries (day vs night)
    if (lowerQuery.includes("compare") && lowerQuery.includes("shift")) {
      const morningProduction = productionEntries
        .filter((entry) => entry.shift === "morning")
        .reduce((sum, entry) => sum + entry.quantity, 0)

      const afternoonProduction = productionEntries
        .filter((entry) => entry.shift === "afternoon")
        .reduce((sum, entry) => sum + entry.quantity, 0)

      const nightProduction = productionEntries
        .filter((entry) => entry.shift === "night")
        .reduce((sum, entry) => sum + entry.quantity, 0)

      const morningDisposal = disposalEntries
        .filter((entry) => entry.shift === "morning")
        .reduce((sum, entry) => sum + entry.quantity, 0)

      const afternoonDisposal = disposalEntries
        .filter((entry) => entry.shift === "afternoon")
        .reduce((sum, entry) => sum + entry.quantity, 0)

      const nightDisposal = disposalEntries
        .filter((entry) => entry.shift === "night")
        .reduce((sum, entry) => sum + entry.quantity, 0)

      const morningRate = morningProduction > 0 ? (morningDisposal / morningProduction) * 100 : 0
      const afternoonRate = afternoonProduction > 0 ? (afternoonDisposal / afternoonProduction) * 100 : 0
      const nightRate = nightProduction > 0 ? (nightDisposal / nightProduction) * 100 : 0

      const chartData = [
        { name: "Morning Shift", production: morningProduction, disposal: morningDisposal, rate: morningRate },
        { name: "Afternoon Shift", production: afternoonProduction, disposal: afternoonDisposal, rate: afternoonRate },
        { name: "Night Shift", production: nightProduction, disposal: nightDisposal, rate: nightRate },
      ]

      // Find best and worst performing shifts
      const shifts = chartData.sort((a, b) => a.rate - b.rate)
      const bestShift = shifts[0]
      const worstShift = shifts[shifts.length - 1]

      return {
        type: "comparison",
        title: "Shift Performance Comparison",
        description: `Best performing: ${bestShift.name} (${bestShift.rate.toFixed(1)}% disposal rate), Worst performing: ${worstShift.name} (${worstShift.rate.toFixed(1)}% disposal rate)`,
        chartData,
      }
    }

    // Check for best/worst queries
    if (
      lowerQuery.includes("best") ||
      lowerQuery.includes("worst") ||
      lowerQuery.includes("top") ||
      lowerQuery.includes("highest") ||
      lowerQuery.includes("lowest")
    ) {
      // Calculate disposal rates by product
      const productStats = products
        .map((product) => {
          const produced = productionEntries
            .filter((entry) => entry.product_id === product.id)
            .reduce((sum, entry) => sum + entry.quantity, 0)

          const disposed = disposalEntries
            .filter((entry) => entry.product_id === product.id)
            .reduce((sum, entry) => sum + entry.quantity, 0)

          const rate = produced > 0 ? (disposed / produced) * 100 : 0

          return {
            id: product.id,
            name: product.name,
            category: product.category,
            produced,
            disposed,
            rate,
          }
        })
        .filter((p) => p.produced > 0)

      if (lowerQuery.includes("best") || lowerQuery.includes("lowest")) {
        const bestProducts = [...productStats].sort((a, b) => a.rate - b.rate).slice(0, 5)

        return {
          type: "ranking",
          title: "Products with Lowest Disposal Rates",
          data: bestProducts,
        }
      } else {
        const worstProducts = [...productStats].sort((a, b) => b.rate - a.rate).slice(0, 5)

        return {
          type: "ranking",
          title: "Products with Highest Disposal Rates",
          data: worstProducts,
        }
      }
    }

    // Default response if no specific query is matched
    return {
      type: "noMatch",
      title: "No Specific Results",
      description: "Try asking about production, disposal, rates, or specific products.",
    }
  }

  const renderResults = () => {
    if (!results) return null

    switch (results.type) {
      case "summary":
        return (
          <div className="p-4">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <div className="text-3xl font-bold my-4">
              {typeof results.value === "number" ? formatNumber(results.value) : results.value}
            </div>
            <p className="text-muted-foreground">{results.description}</p>
          </div>
        )

      case "breakdown":
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <div className="h-[300px]">
              {results.chartType === "pie" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={results.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {results.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results.data}
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
              )}
            </div>
          </div>
        )

      case "timeSeries":
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={results.data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#0088FE" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case "productDetail":
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <div className="flex items-center gap-2 mt-1 mb-4">
              <Badge variant="outline">{results.product.category}</Badge>
              <div className="text-muted-foreground">Total: {formatNumber(results.total)}</div>
            </div>

            <div className="h-[250px]">
              {results.chartType === "pie" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={results.chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {results.chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results.chartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#0088FE" name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <h4 className="font-medium mt-4 mb-2">Recent Entries:</h4>
            <div className="space-y-3">
              {results.entries.map((entry: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="text-sm">
                    {formatDate(entry.date)} - {entry.staff_name}
                  </div>
                  <div className="font-medium">{formatNumber(entry.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case "rateAnalysis":
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <div className="text-3xl font-bold my-4">{results.value}</div>
            <p className="text-muted-foreground mb-4">{results.description}</p>

            <h4 className="font-medium mb-2">Disposal Rate by Product</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={results.chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => (value.length > 10 ? `${value.substring(0, 10)}...` : value)}
                  />
                  <YAxis label={{ value: "Disposal Rate (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" fill="#FF8042" name="Disposal Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case "comparison":
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <p className="text-muted-foreground mb-4">{results.description}</p>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={results.chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="production" fill="#0088FE" name="Production" />
                  <Bar yAxisId="left" dataKey="disposal" fill="#FF8042" name="Disposal" />
                  <Bar yAxisId="right" dataKey="rate" fill="#FFBB28" name="Disposal Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case "timeAnalysis":
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <div className="text-3xl font-bold my-4">{formatNumber(results.value)}</div>
            <p className="text-muted-foreground mb-4">{results.description}</p>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={results.chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#0088FE" name="Production" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case "ranking":
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold mb-4">{results.title}</h3>
            <div className="space-y-3">
              {results.data.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(item.disposed)} of {formatNumber(item.produced)} units
                    </div>
                  </div>
                  <div className="font-bold">{item.rate.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        )

      case "noMatch":
        return (
          <div className="p-4 text-center">
            <h3 className="text-xl font-bold">{results.title}</h3>
            <p className="text-muted-foreground mt-2">{results.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => selectSuggestion(suggestion)}
                  className="justify-start text-left"
                >
                  <Search className="mr-2 h-3 w-3" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ask about your production and disposal data..."
            className="pl-8 pr-10"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.trim()) {
                setShowSuggestions(true)
              } else {
                setShowSuggestions(false)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
            onFocus={() => {
              if (query.trim()) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow for clicks
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            ref={inputRef}
          />
          {query && (
            <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={clearSearch}>
              <X className="h-4 w-4" />
            </Button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 shadow-lg">
              <CardContent className="p-0">
                <ul className="py-2">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center text-sm"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <Search className="mr-2 h-3 w-3 text-muted-foreground" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>

      {searchPerformed && (
        <div className="space-y-4">
          {isSearching ? (
            <Card>
              <CardContent className="py-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Analyzing your query...</p>
              </CardContent>
            </Card>
          ) : results ? (
            <Card className="animate-in">
              <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{results.title}</CardTitle>
                  <div className="flex gap-2">
                    {(results.type === "breakdown" ||
                      results.type === "timeSeries" ||
                      results.type === "productDetail") && (
                      <Button variant="ghost" size="icon" title="Toggle Chart Type">
                        {results.chartType === "bar" ? (
                          <PieChart className="h-4 w-4" />
                        ) : (
                          <BarChart2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="View Full Report">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">{renderResults()}</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">No results to display.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

