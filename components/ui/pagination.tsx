"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showEdges?: boolean
  maxPagesShown?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showEdges = true,
  maxPagesShown = 5
}: PaginationProps) {
  // Handle previous and next
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Generate array of page numbers to display
  const generatePagesArray = (): (number | "ellipsis")[] => {
    // If total pages is less than max visible pages, show all
    if (totalPages <= maxPagesShown) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - 1, 1)
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1

    // Case 1: Show left ellipsis only
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = maxPagesShown - 1
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, "ellipsis", totalPages]
    }

    // Case 2: Show right ellipsis only
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = maxPagesShown - 1
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      )
      return [1, "ellipsis", ...rightRange]
    }

    // Case 3: Show both ellipses
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      )
      return [1, "ellipsis", ...middleRange, "ellipsis", totalPages]
    }

    // Default
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = generatePagesArray()

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-center space-x-1">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={goToPreviousPage}
        className="h-8 w-8 dark:border-border/50"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>
      
      {pages.map((page, i) => (
        page === "ellipsis" ? (
          <Button
            key={`ellipsis-${i}`}
            variant="ghost"
            size="icon"
            disabled
            className="h-8 w-8"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 dark:border-border/50"
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={goToNextPage}
        className="h-8 w-8 dark:border-border/50"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}
