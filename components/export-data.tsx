"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "./providers/data-provider"
import { FileDown, FileText, Table, BarChart, Loader2, Check } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FieldSelection {
  date: boolean;
  staff_name: boolean;
  product_name: boolean;
  quantity: boolean;
  shift: boolean;
  expiration_date?: boolean;
  reason?: boolean;
  notes?: boolean;
}

interface SelectedFields {
  production: FieldSelection;
  disposal: FieldSelection;
}

export function ExportData() {
  const { productionEntries, disposalEntries, products } = useData()
  const [exportType, setExportType] = useState("csv")
  const [dateRange, setDateRange] = useState("all")
  const [exportStatus, setExportStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({
    production: {
      date: true,
      staff_name: true,
      product_name: true,
      quantity: true,
      shift: true,
      expiration_date: true,
    },
    disposal: {
      date: true,
      staff_name: true,
      product_name: true,
      quantity: true,
      shift: true,
      reason: true,
      notes: true,
    },
  })

  const handleFieldToggle = (category: keyof SelectedFields, field: keyof FieldSelection) => {
    setSelectedFields((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field],
      },
    }))
  }

  const exportData = async (dataType: keyof SelectedFields) => {
    const entries = dataType === "production" ? productionEntries : disposalEntries

    setExportStatus("processing")
    setProgress(10)

    try {
      // Filter by date range if needed
      let filteredEntries = [...entries]
      const today = new Date()

      if (dateRange === "last7days") {
        const cutoffDate = subDays(today, 7)
        filteredEntries = entries.filter((entry) => new Date(entry.date) >= cutoffDate)
      } else if (dateRange === "last30days") {
        const cutoffDate = subDays(today, 30)
        filteredEntries = entries.filter((entry) => new Date(entry.date) >= cutoffDate)
      } else if (dateRange === "thisMonth") {
        const firstDayOfMonth = startOfMonth(today)
        filteredEntries = entries.filter((entry) => new Date(entry.date) >= firstDayOfMonth)
      } else if (dateRange === "lastMonth") {
        const firstDayOfLastMonth = startOfMonth(subDays(startOfMonth(today), 1))
        const lastDayOfLastMonth = endOfMonth(firstDayOfLastMonth)
        filteredEntries = entries.filter((entry) => {
          const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : entry.date
          return entryDate >= firstDayOfLastMonth && entryDate <= lastDayOfLastMonth
        })
      }

      setProgress(30)

      // Filter fields
      const fields = selectedFields[dataType]
      const mappedEntries = filteredEntries.map((entry) => {
        const mappedEntry: Record<string, any> = {}

        Object.keys(fields).forEach((field) => {
          if (fields[field as keyof FieldSelection]) {
            // Format dates properly
            if (field === 'date' || field === 'expiration_date') {
              const dateValue = entry[field as keyof typeof entry]
              mappedEntry[field] = dateValue 
                ? format(new Date(dateValue as string | Date), "yyyy-MM-dd")
                : ""
            } else {
              mappedEntry[field] = entry[field as keyof typeof entry]
            }
          }
        })

        return mappedEntry
      })

      setProgress(60)

      // Generate file content
      let content = ""
      let filename = ""

      if (exportType === "csv") {
        // CSV export
        if (mappedEntries.length === 0) {
          // Handle empty data
          content = "No data available for the selected period"
        } else {
          const headers = Object.keys(mappedEntries[0] || {}).join(",")
          const rows = mappedEntries
            .map((entry) =>
              Object.values(entry)
                .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
                .join(","),
            )
            .join("\n")

          content = headers + "\n" + rows
        }
        filename = `${dataType}_data_${format(new Date(), "yyyy-MM-dd")}.csv`
      } else if (exportType === "json") {
        // JSON export
        content = JSON.stringify(mappedEntries, null, 2)
        filename = `${dataType}_data_${format(new Date(), "yyyy-MM-dd")}.json`
      }

      setProgress(80)

      // Create and download file
      const blob = new Blob([content], { type: exportType === "csv" ? "text/csv" : "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      setExportStatus("success")

      // Reset status after a delay
      setTimeout(() => {
        setExportStatus("idle")
        setProgress(0)
      }, 3000)
    } catch (error) {
      console.error("Error exporting data:", error)
      setExportStatus("error")

      // Reset status after a delay
      setTimeout(() => {
        setExportStatus("idle")
        setProgress(0)
      }, 3000)
    }
  }

  const generateReport = () => {
    setExportStatus("processing")
    setProgress(10)

    // Simulate report generation
    setTimeout(() => {
      setProgress(30)
    }, 500)

    setTimeout(() => {
      setProgress(60)
    }, 1000)

    setTimeout(() => {
      setProgress(90)
    }, 1500)

    setTimeout(() => {
      setProgress(100)
      setExportStatus("success")

      // Create and download a sample report
      const reportContent = `
# Production and Disposal Report
Generated on: ${format(new Date(), "MMMM dd, yyyy")}

## Summary
- Total Production: ${productionEntries.reduce((sum, entry) => sum + entry.quantity, 0)} units
- Total Disposal: ${disposalEntries.reduce((sum, entry) => sum + entry.quantity, 0)} units
- Disposal Rate: ${(
        (disposalEntries.reduce((sum, entry) => sum + entry.quantity, 0) /
          Math.max(
            1,
            productionEntries.reduce((sum, entry) => sum + entry.quantity, 0),
          )) *
          100
      ).toFixed(1)}%

## Top Products by Production
${Object.entries(
  productionEntries.reduce(
    (acc, entry) => {
      acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map((entry, index) => `${index + 1}. ${entry[0]}: ${entry[1]} units`)
  .join("\n")}

## Top Disposal Reasons
${Object.entries(
  disposalEntries.reduce(
    (acc, entry) => {
      acc[entry.reason] = (acc[entry.reason] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map((entry, index) => `${index + 1}. ${entry[0]}: ${entry[1]} units`)
  .join("\n")}
      `

      const blob = new Blob([reportContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `production_disposal_report_${format(new Date(), "yyyy-MM-dd")}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Reset status after a delay
      setTimeout(() => {
        setExportStatus("idle")
        setProgress(0)
      }, 3000)
    }, 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>Download your production and disposal data for analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {exportStatus === "processing" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Preparing export...</span>
              <span className="text-sm">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {exportStatus === "success" && (
          <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Export completed successfully!
            </AlertDescription>
          </Alert>
        )}

        {exportStatus === "error" && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>An error occurred during export. Please try again.</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="production" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="production">Production Data</TabsTrigger>
            <TabsTrigger value="disposal">Disposal Data</TabsTrigger>
          </TabsList>

          <TabsContent value="production" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium mb-3">Export Format</h3>
                <RadioGroup
                  defaultValue="csv"
                  value={exportType}
                  onValueChange={setExportType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      CSV File
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="flex items-center">
                      <Table className="mr-2 h-4 w-4" />
                      JSON File
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Date Range</h3>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Fields to Include</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.keys(selectedFields.production).map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={`production-${field}`}
                      checked={selectedFields.production[field as keyof typeof selectedFields.production]}
                      onCheckedChange={() => handleFieldToggle("production", field as keyof FieldSelection)}
                    />
                    <Label htmlFor={`production-${field}`} className="capitalize">
                      {field.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => exportData("production")} disabled={exportStatus === "processing"}>
                {exportStatus === "processing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Production Data
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="disposal" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium mb-3">Export Format</h3>
                <RadioGroup
                  defaultValue="csv"
                  value={exportType}
                  onValueChange={setExportType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv-disposal" />
                    <Label htmlFor="csv-disposal" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      CSV File
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json-disposal" />
                    <Label htmlFor="json-disposal" className="flex items-center">
                      <Table className="mr-2 h-4 w-4" />
                      JSON File
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Date Range</h3>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Fields to Include</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.keys(selectedFields.disposal).map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={`disposal-${field}`}
                      checked={selectedFields.disposal[field as keyof typeof selectedFields.disposal]}
                      onCheckedChange={() => handleFieldToggle("disposal", field as keyof FieldSelection)}
                    />
                    <Label htmlFor={`disposal-${field}`} className="capitalize">
                      {field.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => exportData("disposal")} disabled={exportStatus === "processing"}>
                {exportStatus === "processing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Disposal Data
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {productionEntries.length} production entries and {disposalEntries.length} disposal entries available
        </div>
        <Button variant="outline" onClick={generateReport} disabled={exportStatus === "processing"}>
          {exportStatus === "processing" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BarChart className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

