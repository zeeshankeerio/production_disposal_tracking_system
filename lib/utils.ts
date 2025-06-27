import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { UI_CONFIG } from "@/lib/config"
import { formatEastern } from '@/lib/date-utils'
import { formatDate as formatDateWithTimezone } from './date-utils'

/**
 * Combines multiple class names into a single string using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string with flexible output formatting
 * Always displays in US Eastern Time to match the digital clock
 * @param dateString - The date string to format
 * @param formatType - Optional format type: 'date', 'time', 'datetime', or custom format string
 * @returns Formatted date string in Eastern time
 */
export function formatDate(
  dateString: string | Date | undefined | null, 
  formatType: 'date' | 'time' | 'datetime' | string = 'date'
): string {
  if (!dateString) return "No date"
  
  try {
    // Handle the case where dateString might be undefined or null despite the check above
    if (dateString === undefined || dateString === null) {
      return "No date"
    }
    
    let date: Date;
    
    // If it's a string, handle it as potentially being in Eastern time format
    if (typeof dateString === 'string') {
      // Handle empty strings
      if (dateString.trim() === '') {
        return "No date"
      }
      
      // Check if it's in the format "YYYY-MM-DD HH:MM:SS" (our stored format)
      const match = dateString.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        // Parse as if it's in Eastern time
        const [_, year, month, day, hour, minute, second] = match;
        // Create a Date object and treat it as Eastern time
        date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
      } else {
        // Try parsing as regular date string
        date = new Date(dateString);
      }
    } else {
      // Check if it's already an invalid Date object
      if (isNaN(dateString.getTime())) {
        console.warn("Invalid Date object provided:", dateString)
        return "Invalid date"
      }
      date = dateString;
    }
    
    // Check if date is valid
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString)
      return "Invalid date"
    }
    
    // Always display in Eastern timezone to match the digital clock
    const easternTime = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const easternDate = new Date(easternTime);
    
    // Handle predefined format types
    if (formatType === 'date') {
      return easternDate.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    if (formatType === 'time') {
      return easternDate.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    if (formatType === 'datetime') {
      return easternDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Handle specific format strings
    if (formatType === 'PPP p' || formatType === 'PPpp') {
      return easternDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    if (formatType === 'medium') {
      return easternDate.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    if (formatType === 'short') {
      return easternDate.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        year: '2-digit',
        month: 'numeric',
        day: 'numeric'
      });
    }
    
    // Default format
    return easternDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

/**
 * Formats a number with thousands separators
 * @param num - The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number) {
  return num.toLocaleString()
}

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text - The text to truncate
 * @param length - The maximum length before truncating
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, length: number) {
  if (!text) return ""
  if (text.length <= length) return text
  return text.substring(0, length) + "..."
}

/**
 * Generates a random hexadecimal color code
 * @returns Random color hex code
 */
export function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
}

/**
 * Calculates percentage with flexible formatting options
 * @param value - The numerator (part)
 * @param total - The denominator (whole)
 * @param options - Configuration options
 * @returns Percentage value or formatted string based on options
 */
export function calculatePercentage(
  value: number, 
  total: number, 
  options: { 
    asString?: boolean; 
    decimals?: number;
    clamp?: boolean;
  } = {}
): number | string {
  if (total === 0) return options.asString ? "0%" : 0
  
  const percentage = (value / total) * 100
  const decimals = options.decimals ?? 1
  
  // Clamp value between 0-100 if requested
  const calculatedValue = options.clamp !== false 
    ? Math.min(100, Math.max(0, Number(percentage.toFixed(decimals))))
    : Number(percentage.toFixed(decimals))
  
  return options.asString ? `${calculatedValue}%` : calculatedValue
}

/**
 * Format date as YYYY-MM-DD for filenames
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Export data as CSV file
 * @param data Array of objects to export
 * @param filename Name of the file without extension
 * @returns A toast function that can be called
 */
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) {
  return {
      title: "Export failed",
      description: "No data to export",
      variant: "destructive" as const,
    }
  }
  
  try {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV rows
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle special cases (undefined, null, comma in string, etc.)
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'string' && value.includes(',')) {
          // Quote strings containing commas
          return `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    // Combine into CSV content
    const csvContent = csvRows.join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set download attributes
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    
    // Append to document, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return {
      title: "Export successful",
      description: `Data has been exported to ${filename}.csv`,
    }
  } catch (error) {
    console.error("Export error:", error);
    return {
      title: "Export failed",
      description: "An error occurred during export",
      variant: "destructive" as const,
    }
  }
}

/**
 * Maps a database product record to the Product type
 */
export function mapProductFromDB(dbProduct: any): any {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category,
    created_at: dbProduct.created_at
  }
}

/**
 * Maps a database production entry record to the ProductionEntry type
 */
export function mapProductionEntryFromDB(dbEntry: any): any {
  return {
    id: dbEntry.id,
    staff_name: dbEntry.staff_name,
    date: dbEntry.date,
    product_id: dbEntry.product_id,
    product_name: dbEntry.product_name,
    quantity: dbEntry.quantity,
    shift: dbEntry.shift,
    expiration_date: dbEntry.expiration_date,
    notes: dbEntry.notes,
    created_at: dbEntry.created_at
  }
}

/**
 * Maps a database disposal entry record to the DisposalEntry type
 */
export function mapDisposalEntryFromDB(dbEntry: any): any {
  return {
    id: dbEntry.id,
    staff_name: dbEntry.staff_name,
    date: dbEntry.date,
    product_id: dbEntry.product_id,
    product_name: dbEntry.product_name,
    quantity: dbEntry.quantity,
    shift: dbEntry.shift,
    reason: dbEntry.reason,
    notes: dbEntry.notes,
    created_at: dbEntry.created_at
  }
}

/**
 * Formats a shift string to proper case
 */
export function formatShift(shift: string): string {
  switch (shift.toLowerCase()) {
    case "morning": return "Morning";
    case "afternoon": return "Afternoon";
    case "night": return "Night";
    default: return "Unknown";
  }
}

