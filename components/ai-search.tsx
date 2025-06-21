"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useData } from "./providers/data-provider"
import { searchWithNaturalLanguage } from "@/lib/ai-service"
import { format } from "date-fns"
import { ProductionEntry, DisposalEntry } from "@/lib/types"
import { formatNumber, formatDate } from "@/lib/utils"

export function AISearch() {
  const { productionEntries, disposalEntries } = useData()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchPerformed(true)

    try {
      const searchResults = await searchWithNaturalLanguage(query, productionEntries, disposalEntries)

      setResults(searchResults)
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search with natural language (e.g., 'Show me all chocolate cake disposals last week')"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            "Search"
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
            <>
              {results.explanation && (
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">{results.explanation}</p>
                  </CardContent>
                </Card>
              )}

              {results.matchingProduction.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Production Entries</h3>
                  {results.matchingProduction.map((index: number) => {
                    const entry = productionEntries[index]
                    if (!entry) return null

                    return (
                      <Card key={`prod-${entry.id}`}>
                        <CardContent className="py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{entry.product_name}</span>
                              <Badge variant="outline" className="capitalize">
                                {entry.shift} Shift
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Quantity: {entry.quantity} units</span>
                              <span>Date: {formatDate(entry.date, "medium")}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">Staff: {entry.staff_name}</div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {results.matchingDisposal.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Disposal Entries</h3>
                  {results.matchingDisposal.map((index: number) => {
                    const entry = disposalEntries[index]
                    if (!entry) return null

                    return (
                      <Card key={`disp-${entry.id}`}>
                        <CardContent className="py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{entry.product_name}</span>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {entry.shift} Shift
                                </Badge>
                                <Badge variant="outline">{entry.reason.split("/")[0]}</Badge>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Quantity: {entry.quantity} units</span>
                              <span>Date: {formatDate(entry.date, "medium")}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">Staff: {entry.staff_name}</div>
                            {entry.notes && <div className="text-sm italic">Notes: {entry.notes}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {results.matchingProduction.length === 0 && results.matchingDisposal.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground">No matching entries found.</p>
                  </CardContent>
                </Card>
              )}
            </>
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

