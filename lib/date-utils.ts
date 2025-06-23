/**
 * Date Utilities for consistent date handling between forms and database
 * Supports dynamic timezone handling while maintaining TEXT field compatibility
 */

import { DEFAULT_TIMEZONE, DATE_FORMAT_OPTIONS } from './config';

/**
 * Converts any date to the user's local timezone
 * @param date The date to convert
 * @returns Date object in local timezone
 */
export function toLocalTime(date: Date | string | undefined): Date {
  if (!date) {
    return getCurrentLocalTime();
  }
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Date(dateObj.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
}

/**
 * Gets current time in user's local timezone
 * @returns Current Date object in local timezone
 */
export function getCurrentLocalTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
}

/**
 * Formats a date in the user's local timezone
 * Always displays in US Eastern Time to match the digital clock
 * @param date The date to format
 * @param format The format type or format string
 * @returns Formatted date string in Eastern time
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: "short" | "medium" | "long" | string = "medium"
): string {
  if (!date) return "N/A";
  
  try {
    let dateObj: Date;
    
    // If it's a string, handle it as potentially being in Eastern time format
    if (typeof date === 'string') {
      // Check if it's in the format "YYYY-MM-DD HH:MM:SS" (our stored format)
      const match = date.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        // Parse as if it's in Eastern time
        const [_, year, month, day, hour, minute, second] = match;
        // Create a Date object and treat it as Eastern time
        dateObj = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
      } else {
        // Try parsing as regular date string
        dateObj = new Date(date);
      }
    } else {
      dateObj = date as Date;
    }
    
    // Check if valid date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn("Invalid date in formatDate:", date);
      return "Invalid Date";
    }
    
    // Always display in Eastern timezone to match the digital clock
    const easternTime = dateObj.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE });
    const easternDate = new Date(easternTime);
    
    // Handle predefined format types
    if (format in DATE_FORMAT_OPTIONS) {
      return easternDate.toLocaleDateString('en-US', {
        ...DATE_FORMAT_OPTIONS[format as keyof typeof DATE_FORMAT_OPTIONS],
        timeZone: DEFAULT_TIMEZONE
      });
    }
    
    // Handle custom format strings using date-fns
    try {
      const { format: dateFnsFormat } = require('date-fns');
      return dateFnsFormat(easternDate, format, { timeZone: DEFAULT_TIMEZONE });
    } catch (error) {
      // Fallback to native formatting if date-fns is not available
      return easternDate.toLocaleString('en-US', {
        timeZone: DEFAULT_TIMEZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.error("Error in formatDate:", error, "Input:", date);
    return "Invalid Date";
  }
}

/**
 * Creates a timestamp string for database storage
 * Maintains compatibility with TEXT fields while supporting any timezone
 * @returns Formatted date string for database storage
 */
export function createTimestamp(): string {
  const now = new Date();
  // Store in a more consistent format that's easier to parse
  return now.toLocaleString('en-US', { 
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');
}

/**
 * Formats a date for database storage in TEXT fields
 * @param date The date to format
 * @returns Formatted date string for database storage
 */
export function formatDateForDatabase(date: Date | string | undefined): string {
  if (!date) {
    return createTimestamp();
  }
  const localDate = toLocalTime(date);
  return localDate.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE });
}

/**
 * Parses a date from TEXT database field
 * @param dateString The date string from database
 * @returns Date object in local timezone
 */
export function parseDateFromDatabase(dateString: string | null | undefined): Date {
  if (!dateString) {
    return getCurrentLocalTime();
  }
  
  try {
    // If the date string is already in Eastern time format (like "6/19/2025, 8:22:34 PM")
    // we need to ensure it's properly converted to Eastern timezone
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      // Convert to Eastern timezone to ensure consistency
      return new Date(parsedDate.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
    }
    return getCurrentLocalTime();
  } catch (error) {
    console.error("Error parsing date from database:", error, "Date string:", dateString);
    return getCurrentLocalTime();
  }
}

/**
 * Converts a date to an ISO string format for database storage
 * @param date The date to convert
 * @returns ISO string format of the date
 */
export function dateToISOString(date: Date | undefined): string | null {
  if (!date) return null;
  return date.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE });
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
 * Converts a Date object to Eastern timezone (US Eastern Time)
 * This function properly handles timezone conversion to America/New_York
 * @param date The date to convert
 * @returns Date object in Eastern timezone
 */
export function toEastern(date: Date): Date {
  // Use proper timezone conversion instead of manual hour adjustment
  return new Date(date.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
}

/**
 * Converts a Date object from Eastern timezone to UTC
 * This function properly handles timezone conversion from America/New_York
 * @param date The date in Eastern timezone
 * @returns Date object in UTC
 */
export function fromEastern(date: Date): Date {
  // Create a new date object and convert from Eastern to UTC
  const utcDate = new Date();
  const easternTime = date.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE });
  const utcTime = new Date(easternTime);
  return utcTime;
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
        timeZone: DEFAULT_TIMEZONE
      });
    }
    
    if (format === "long") {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: DEFAULT_TIMEZONE
      });
    }
    
    // Default to medium format
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: DEFAULT_TIMEZONE
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
  const localDate = toLocalTime(date);
  // Convert to ISO string without timezone offset
  return localDate.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE });
}

// Maintain backward compatibility with existing code
export const toNewYorkTime = toLocalTime;
export const formatEastern = formatDate;
export const createEasternTimestamp = createTimestamp;
export const formatDateForTextDatabase = formatDateForDatabase;
export const getCurrentEasternTime = getCurrentLocalTime;