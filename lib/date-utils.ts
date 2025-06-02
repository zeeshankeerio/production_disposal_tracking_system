/**
 * Date Utilities for consistent date handling between forms and database
 */

/**
 * Converts a Date object to an ISO string format for database storage
 * @param date The date to convert
 * @returns ISO string format of the date
 */
export function dateToISOString(date: Date | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Converts an ISO string from the database to a Date object
 * @param isoString The ISO string to convert
 * @returns Date object or undefined if invalid
 */
export function isoStringToDate(isoString: string | null | undefined): Date | undefined {
  if (!isoString) return undefined;
  try {
    return new Date(isoString);
  } catch (error) {
    console.error("Invalid date string:", isoString);
    return undefined;
  }
}

/**
 * Formats a date for display in the UI
 * @param date The date to format
 * @param format The format type
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  date: Date | string | null | undefined,
  format: "short" | "medium" | "long" = "medium"
): string {
  if (date === undefined || date === null) return "N/A";
  
  try {
    // Convert string to Date if needed
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if valid date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn("Invalid date in formatDateForDisplay:", date);
      return "Invalid Date";
    }
  
  // Format based on requested format
  if (format === "short") {
    return dateObj.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit'
    });
  }
  
  if (format === "long") {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // Default to medium format
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  } catch (error) {
    console.error("Error in formatDateForDisplay:", error, "Input:", date);
    return "Invalid Date";
  }
}

/**
 * Ensures a date is properly formatted for database submission
 * @param date The date from a form submission
 * @returns Properly formatted date string
 */
export function prepareDateForSubmission(date: Date | string | undefined): string {
  if (!date) return new Date().toISOString();
  
  if (typeof date === "string") {
    // Check if already in ISO format
    if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*$/)) {
      return date;
    }
    // Try to convert to Date then to ISO
    return new Date(date).toISOString();
  }
  
  return date.toISOString();
}