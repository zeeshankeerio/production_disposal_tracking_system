/**
 * Date Utilities for consistent date handling between forms and database
 */

const NEW_YORK_TIMEZONE = 'America/New_York';

/**
 * Converts a Date object to an ISO string format for database storage in EST
 * @param date The date to convert
 * @returns ISO string format of the date in EST
 */
export function dateToISOString(date: Date | undefined): string | null {
  if (!date) return null;
  return date.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE });
}

/**
 * Converts an ISO string from the database to a Date object in EST
 * @param isoString The ISO string to convert
 * @returns Date object in EST or undefined if invalid
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
 * Converts a Date object to Eastern timezone
 * @param date The date to convert
 * @returns Date object in Eastern timezone
 */
export function toEastern(date: Date): Date {
  const easternDate = new Date(date);
  easternDate.setHours(easternDate.getHours() - 4); // Convert to Eastern time (UTC-4)
  return easternDate;
}

/**
 * Converts a Date object from Eastern timezone to UTC
 * @param date The date in Eastern timezone
 * @returns Date object in UTC
 */
export function fromEastern(date: Date): Date {
  const utcDate = new Date(date);
  utcDate.setHours(utcDate.getHours() + 4); // Convert from Eastern time (UTC-4)
  return utcDate;
}

/**
 * Gets the current date and time in New York timezone
 * @returns Date object in New York timezone
 */
export function getCurrentEasternTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE }));
}

/**
 * Formats a date in New York timezone
 * @param date The date to format
 * @param format The format type or format string
 * @returns Formatted date string in New York timezone
 */
export function formatEastern(
  date: Date | string | null | undefined,
  format: "long" | "short" | "medium" | string = "medium"
): string {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Convert to New York timezone
    const newYorkDate = new Date(dateObj.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE }));
    
    // Handle predefined format types
    if (format === "short") {
      return newYorkDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        timeZone: NEW_YORK_TIMEZONE
      });
    }
    
    if (format === "long") {
      return newYorkDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: NEW_YORK_TIMEZONE
      });
    }
    
    if (format === "medium") {
      return newYorkDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: NEW_YORK_TIMEZONE
      });
    }
    
    // Handle custom format strings using date-fns
    const { format: dateFnsFormat } = require('date-fns');
    return dateFnsFormat(newYorkDate, format);
  } catch (error) {
    console.error("Error in formatEastern:", error, "Input:", date);
    return "Invalid Date";
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
        year: '2-digit',
        timeZone: NEW_YORK_TIMEZONE
      });
    }
    
    if (format === "long") {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: NEW_YORK_TIMEZONE
      });
    }
    
    // Default to medium format
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: NEW_YORK_TIMEZONE
    });
  } catch (error) {
    console.error("Error in formatDateForDisplay:", error, "Input:", date);
    return "Invalid Date";
  }
}

/**
 * Ensures a date is properly formatted for database submission in EST
 * @param date The date from a form submission
 * @returns Properly formatted date string in EST
 */
export function prepareDateForSubmission(date: Date | string | undefined): string {
  if (!date) {
    return getCurrentEasternTime().toISOString();
  }
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const newYorkDate = new Date(dateObj.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE }));
  return newYorkDate.toISOString();
}