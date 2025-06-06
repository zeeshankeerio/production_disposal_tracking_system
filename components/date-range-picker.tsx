"use client"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerWithRangeProps {
  date: DateRange
  onDateChange: (date: DateRange) => void
  className?: string
}

export function DatePickerWithRange({ date, onDateChange, className }: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Predefined date ranges
  const handleSelectPreset = (preset: string) => {
    const today = new Date()

    switch (preset) {
      case "last7days":
        const last7Days = new Date()
        last7Days.setDate(today.getDate() - 7)
        onDateChange({ from: last7Days, to: today })
        break
      case "last30days":
        const last30Days = new Date()
        last30Days.setDate(today.getDate() - 30)
        onDateChange({ from: last30Days, to: today })
        break
      case "thisMonth":
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        onDateChange({ from: firstDayOfMonth, to: today })
        break
      case "lastMonth":
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        onDateChange({ from: firstDayOfLastMonth, to: lastDayOfLastMonth })
        break
      case "thisYear":
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
        onDateChange({ from: firstDayOfYear, to: today })
        break
    }

    setIsOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn("w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <Select onValueChange={handleSelectPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 days</SelectItem>
                  <SelectItem value="last30days">Last 30 days</SelectItem>
                  <SelectItem value="thisMonth">This month</SelectItem>
                  <SelectItem value="lastMonth">Last month</SelectItem>
                  <SelectItem value="thisYear">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={onDateChange}
              numberOfMonths={2}
              required
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

