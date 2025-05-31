"use client"

import type { ProductionEntry, DisposalEntry } from "./types"

// Mock AI-powered insights and recommendations
export async function generateInsights(productionEntries: ProductionEntry[], disposalEntries: DisposalEntry[]) {
  // Prepare data for the AI
  const productionData = productionEntries.map((entry) => ({
    date: entry.date,
    product: entry.productName,
    quantity: entry.quantity,
    shift: entry.shift,
  }))

  const disposalData = disposalEntries.map((entry) => ({
    date: entry.date,
    product: entry.productName,
    quantity: entry.quantity,
    reason: entry.reason,
    shift: entry.shift,
  }))

  // Calculate some basic metrics
  const totalProduction = productionEntries.reduce((sum, entry) => sum + entry.quantity, 0)
  const totalDisposal = disposalEntries.reduce((sum, entry) => sum + entry.quantity, 0)
  const disposalRate = totalProduction > 0 ? (totalDisposal / totalProduction) * 100 : 0

  // Group disposal by reason
  const disposalByReason = disposalEntries.reduce(
    (acc, entry) => {
      const reason = entry.reason.split("/")[0] // Use only English part
      acc[reason] = (acc[reason] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  try {
    // In a real implementation, we would call the AI API here
    // For now, we'll return mock data

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate insights based on the data
    const insights = [
      {
        title: "High Disposal Rate for Confeitaria Products",
        description:
          "Confectionery products have a 15% higher disposal rate compared to other categories. Consider adjusting production quantities or improving storage conditions.",
      },
      {
        title: "Day Shift Produces More Efficiently",
        description:
          "Day shift has a 12% lower disposal-to-production ratio compared to night shift. This suggests better quality control or fresher ingredients during day operations.",
      },
      {
        title: "Weekend Production Surplus",
        description:
          "Production on Fridays exceeds demand, resulting in higher Monday disposals due to expiration. Consider reducing Friday production by 20%.",
      },
    ]

    const recommendations = [
      {
        title: "Adjust Night Shift Quality Control",
        description:
          "Implement additional quality checks during night shift production to reduce the higher disposal rate observed during these hours.",
        impact: "High",
      },
      {
        title: "Optimize Friday Production",
        description: "Reduce Friday production volumes by 20% to prevent Monday disposals due to weekend surplus.",
        impact: "Medium",
      },
      {
        title: "Improve Confeitaria Storage",
        description:
          "Invest in better storage solutions for confectionery products to extend shelf life and reduce disposal rates.",
        impact: "High",
      },
    ]

    const prediction =
      "If current patterns continue, disposal rates will increase by approximately 5% next month, primarily driven by confectionery products and night shift production."

    return {
      insights,
      recommendations,
      prediction,
    }
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return {
      insights: [{ title: "Data Analysis Unavailable", description: "Unable to generate insights at this time." }],
      recommendations: [
        {
          title: "Continue Monitoring",
          description: "Continue collecting data for future analysis.",
          impact: "Medium",
        },
      ],
      prediction: "Prediction unavailable at this time.",
    }
  }
}

// Mock AI-powered anomaly detection
export async function detectAnomalies(productionEntries: ProductionEntry[], disposalEntries: DisposalEntry[]) {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // In a real implementation, we would analyze the data for anomalies
    // For now, we'll return mock anomalies based on the data

    const hasAnomalies = disposalEntries.length > 5 && productionEntries.length > 10

    if (hasAnomalies) {
      return {
        anomalies: [
          {
            type: "disposal",
            severity: "High",
            description: "Unusual spike in 'Expired' disposals for Bolo de Chocolate on weekends",
            recommendation: "Review weekend storage procedures or reduce Friday production",
          },
          {
            type: "production",
            severity: "Medium",
            description: "Inconsistent production volumes for Pão Francês between shifts",
            recommendation: "Standardize production planning across shifts",
          },
        ],
      }
    } else {
      return {
        anomalies: [],
      }
    }
  } catch (error) {
    console.error("Error detecting anomalies:", error)
    return {
      anomalies: [],
    }
  }
}

// Mock AI-powered product forecasting
export async function forecastProduction(productionEntries: ProductionEntry[], days = 7) {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Group production by product
    const productsByName = productionEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.productName]) {
          acc[entry.productName] = []
        }
        acc[entry.productName].push(entry)
        return acc
      },
      {} as Record<string, ProductionEntry[]>,
    )

    // Generate forecast for each product
    const forecast = Object.entries(productsByName).map(([product, entries]) => {
      // Calculate average daily production
      const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0)
      const avgQuantity = Math.round(totalQuantity / Math.max(1, entries.length))

      // Generate daily forecast with some random variation
      const dailyForecast = Array.from({ length: days }).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)
        const dateStr = date.toISOString().split("T")[0]

        // Add some variation to the forecast
        const variation = Math.random() * 0.3 - 0.15 // -15% to +15%
        const quantity = Math.max(1, Math.round(avgQuantity * (1 + variation)))

        // Determine confidence based on variation
        const confidence = Math.abs(variation) < 0.05 ? "High" : Math.abs(variation) < 0.1 ? "Medium" : "Low"

        return {
          date: dateStr,
          quantity,
          confidence,
        }
      })

      return {
        product,
        dailyForecast,
      }
    })

    return { forecast }
  } catch (error) {
    console.error("Error forecasting production:", error)
    return {
      forecast: [],
    }
  }
}

// Mock AI-powered natural language search
export async function searchWithNaturalLanguage(
  query: string,
  productionEntries: ProductionEntry[],
  disposalEntries: DisposalEntry[],
) {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simple keyword-based search (in a real implementation, this would use NLP)
    const keywords = query.toLowerCase().split(/\s+/)

    // Search in production entries
    const matchingProduction = productionEntries
      .map((entry, index) => {
        const searchText = `${entry.productName} ${entry.staffName} ${entry.date} ${entry.shift}`.toLowerCase()
        const matchScore = keywords.filter((keyword) => searchText.includes(keyword)).length
        return { index, matchScore }
      })
      .filter((item) => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5)
      .map((item) => item.index)

    // Search in disposal entries
    const matchingDisposal = disposalEntries
      .map((entry, index) => {
        const searchText =
          `${entry.productName} ${entry.staffName} ${entry.date} ${entry.shift} ${entry.reason} ${entry.notes || ""}`.toLowerCase()
        const matchScore = keywords.filter((keyword) => searchText.includes(keyword)).length
        return { index, matchScore }
      })
      .filter((item) => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5)
      .map((item) => item.index)

    return {
      matchingProduction,
      matchingDisposal,
      explanation: `Found ${matchingProduction.length} production entries and ${matchingDisposal.length} disposal entries matching your search for "${query}".`,
    }
  } catch (error) {
    console.error("Error searching with natural language:", error)
    return {
      matchingProduction: [],
      matchingDisposal: [],
      explanation: "Search failed. Please try again with different keywords.",
    }
  }
}

