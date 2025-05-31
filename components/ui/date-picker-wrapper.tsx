"use client"

import { useState, useCallback, useEffect } from "react"
import { type DateRange } from "react-day-picker"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DatePickerFallback } from "@/components/ui/client-pickers"

// Single Date Picker Wrapper
interface DatePickerWrapperProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disableFutureDates?: boolean
  disablePastDates?: boolean
  minDate?: Date
  maxDate?: Date
  fromYear?: number
  toYear?: number
}

export function DatePickerWrapper(props: DatePickerWrapperProps) {
  const { value, onChange, className, ...rest } = props
  
  // Use local state to handle the date
  const [date, setDate] = useState<Date | undefined>(value)
  const [mounted, setMounted] = useState(false)
  
  // Set mounted state on client
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Keep local state in sync with prop value
  useEffect(() => {
    if (value !== date) {
      setDate(value)
    }
  }, [value, date])
  
  // Create a safe handler that won't trigger serialization issues
  const handleDateChange = useCallback((newDate: Date | undefined) => {
    setDate(newDate)
    onChange(newDate)
  }, [onChange])
  
  if (!mounted) {
    return <DatePickerFallback className={className} />
  }
  
  // Only render on client
  return (
    <SimpleDatePicker
      date={date}
      onDateChange={handleDateChange}
      className={className}
      {...rest}
    />
  )
}

// Date Range Picker Wrapper
interface DateRangePickerWrapperProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
  align?: "center" | "start" | "end"
  fromYear?: number
  toYear?: number
}

export function DateRangePickerWrapper(props: DateRangePickerWrapperProps) {
  const { value, onChange, className, ...rest } = props
  
  // Use local state to handle the date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>(value)
  const [mounted, setMounted] = useState(false)
  
  // Set mounted state on client
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Keep local state in sync with prop value
  useEffect(() => {
    if (value !== dateRange) {
      setDateRange(value)
    }
  }, [value, dateRange])
  
  // Create a safe handler that won't trigger serialization issues
  const handleDateRangeChange = useCallback((newRange: DateRange | undefined) => {
    setDateRange(newRange)
    onChange(newRange)
  }, [onChange])
  
  if (!mounted) {
    return <DatePickerFallback className={className} />
  }
  
  // Only render on client
  return (
    <DateRangePicker
      value={dateRange}
      onValueChange={handleDateRangeChange}
      className={className}
      {...rest}
    />
  )
} 