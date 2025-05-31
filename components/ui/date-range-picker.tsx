import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { useState, useEffect, useCallback } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangePickerProps {
  value: DateRange | undefined
  onValueChange: (range: DateRange | undefined) => void
  className?: string
  align?: "center" | "start" | "end"
  fromYear?: number
  toYear?: number
}

export function DateRangePicker({
  value,
  onValueChange,
  className,
  align = "start",
  fromYear = 2020,
  toYear = 2030,
}: DateRangePickerProps) {
  const [mounted, setMounted] = useState(false)
  const [month, setMonth] = useState<Date>(
    value?.from ? new Date(value.from) : new Date()
  )

  // Generate years for dropdown
  const years = React.useMemo(() => {
    const yearsArray = [];
    for (let year = fromYear; year <= toYear; year++) {
      yearsArray.push(year);
    }
    return yearsArray;
  }, [fromYear, toYear]);

  // Generate months for dropdown
  const months = React.useMemo(() => [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ], []);

  // Update display month when value changes
  React.useEffect(() => {
    if (value?.from) {
      setMonth(new Date(value.from));
    }
  }, [value]);

  // Handler for month change
  const handleMonthChange = useCallback((monthIndex: string) => {
    const newMonth = new Date(month);
    newMonth.setMonth(parseInt(monthIndex));
    setMonth(newMonth);
  }, [month]);

  // Handler for year change
  const handleYearChange = useCallback((year: string) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(parseInt(year));
    setMonth(newMonth);
  }, [month]);

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant={"outline"}
        size="sm"
        className={cn(
          "w-[260px] justify-start text-left font-normal",
          "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span>Loading...</span>
      </Button>
    )
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-wrap p-3 bg-muted/20 border-b">
            <Select
              value={month.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[120px] mr-2 mb-1 sm:mb-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent position="popper">
                {months.map((monthName, index) => (
                  <SelectItem key={monthName} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={month.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent position="popper">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onValueChange}
              numberOfMonths={2}
              month={month}
              onMonthChange={setMonth}
              className="rounded-md border shadow-sm"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 