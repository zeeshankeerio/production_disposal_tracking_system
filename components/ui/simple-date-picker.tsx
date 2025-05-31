import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

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

interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disableFutureDates?: boolean
  disablePastDates?: boolean
  minDate?: Date
  maxDate?: Date
  fromYear?: number
  toYear?: number
}

export function SimpleDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disableFutureDates = false,
  disablePastDates = false,
  minDate,
  maxDate,
  fromYear = 2020,
  toYear = 2030,
}: DatePickerProps) {
  const disabledDates = React.useCallback(
    (date: Date) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      
      if (disableFutureDates && date > today) return true
      
      if (disablePastDates && date < today) return true
      
      return false
    },
    [disableFutureDates, disablePastDates, minDate, maxDate]
  )

  // Current selected year/month or default to current date
  const [month, setMonth] = React.useState<Date>(
    date ? new Date(date) : new Date()
  );

  // Generate years range for the select dropdown
  const years = React.useMemo(() => {
    const yearsArray = [];
    for (let year = fromYear; year <= toYear; year++) {
      yearsArray.push(year);
    }
    return yearsArray;
  }, [fromYear, toYear]);

  // Generate months
  const months = React.useMemo(() => [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ], []);

  // Update display month when date changes
  React.useEffect(() => {
    if (date) {
      setMonth(new Date(date));
    }
  }, [date]);

  // Handler for month change from dropdown
  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month);
    newMonth.setMonth(parseInt(monthIndex));
    setMonth(newMonth);
  };

  // Handler for year change from dropdown
  const handleYearChange = (year: string) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(parseInt(year));
    setMonth(newMonth);
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !date && "text-muted-foreground"
            )}
            type="button"
          >
            {date ? (
              format(date, "PPP")
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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
              mode="single"
              selected={date}
              onSelect={onDateChange}
              disabled={disabledDates}
              initialFocus
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