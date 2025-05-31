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
  if (!date) return "N/A";
  
  // Convert string to Date if needed
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if valid date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }
  
  // Format based on requested format
  switch (format) {
    case "short":
      return dateObj.toLocaleDateString();
    case "long":
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case "medium":
    default:
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
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