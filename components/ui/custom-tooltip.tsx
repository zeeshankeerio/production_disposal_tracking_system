"use client"

import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/utils"

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
  showPercentage?: boolean
  fixedPrecision?: number
}

export function CustomTooltip({ 
  active, 
  payload, 
  label, 
  className,
  showPercentage = true,
  fixedPrecision = 1
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 backdrop-blur-md",
      className
    )}>
      {label && (
        <p className="text-sm font-semibold border-b pb-1 mb-2 text-gray-800 dark:text-gray-200">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const value = typeof entry.value === "number" 
            ? (entry.value % 1 === 0 ? entry.value : entry.value.toFixed(fixedPrecision))
            : entry.value;
            
          const isPercentage = showPercentage && (
            entry.name.toLowerCase().includes('rate') || 
            entry.name.toLowerCase().includes('efficiency') ||
            entry.name.toLowerCase().includes('percent')
          );
          
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {entry.name}:
                </span>
              </div>
              <span className="text-xs font-bold">
                {formatNumber(value)}
                {isPercentage ? '%' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
} 