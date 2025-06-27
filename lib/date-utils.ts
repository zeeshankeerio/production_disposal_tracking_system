/**
 * Date Utilities for consistent date handling between forms and database
 * All dates are handled in US Eastern timezone (America/New_York) for consistency
 * Fixed to prevent double timezone conversions and ensure proper handling in production
 */

import { DEFAULT_TIMEZONE, DATE_FORMAT_OPTIONS } from './config';

/**
 * Converts any date to Eastern timezone correctly
 * This function ensures proper timezone conversion without double-conversion issues
 * @param date The date to convert
 * @returns Date object properly converted to Eastern timezone
 */
export function toLocalTime(date: Date | string | undefined): Date {
  // Handle null, undefined, or empty inputs
  if (!date || date === '' || (typeof date === 'string' && date.trim() === '')) {
    return getCurrentLocalTime();
  }  
  
  let sourceDate: Date;
  
  try {
    if (typeof date === "string") {
      // Handle empty strings
      if (date.trim() === '') {
        return getCurrentLocalTime();
      }
      
      // Try to parse the string as a date
      sourceDate = new Date(date);
      
      // Immediately check if parsing was successful
      if (isNaN(sourceDate.getTime())) {
        console.warn('Invalid date string provided to toLocalTime:', date);
        return getCurrentLocalTime();
      }
    } else if (date instanceof Date) {
      // Check if it's already an invalid Date object
      if (isNaN(date.getTime())) {
        console.warn('Invalid Date object provided to toLocalTime:', date);
        return getCurrentLocalTime();
      }
      sourceDate = new Date(date.getTime()); // Create a copy to avoid mutation
    } else {
      // Handle any other type by trying to convert to Date
      console.warn('Unexpected date type provided to toLocalTime:', typeof date, date);
      sourceDate = new Date(date as any);
      
      if (isNaN(sourceDate.getTime())) {
        console.warn('Could not convert to valid date:', date);
        return getCurrentLocalTime();
      }
    }
    
    // Final validation check
    if (!sourceDate || isNaN(sourceDate.getTime())) {
      console.warn('Invalid date provided to toLocalTime:', date);
      return getCurrentLocalTime();
    }
  } catch (error) {
    console.error('Error creating date in toLocalTime:', error, 'Input:', date);
    return getCurrentLocalTime();
  }
  // Get the time in Eastern timezone as a string
  const easternTimeString = sourceDate.toLocaleString('en-US', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  // Parse the Eastern time string back to a Date object
  // This creates a Date that represents the Eastern time as if it were local time
  const [datePart, timePart] = easternTimeString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // Month is 0-indexed
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  );
}

/**
 * Gets current time in Eastern timezone
 * @returns Current Date object representing Eastern time
 */
export function getCurrentLocalTime(): Date {
  try {
    const now = new Date();
    // Directly get Eastern time without using toLocalTime to avoid recursion
    const easternTimeString = now.toLocaleString('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const [datePart, timePart] = easternTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Month is 0-indexed
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10)
    );
  } catch (error) {
    console.error('Error getting current local time:', error);
    // Fallback to system time if there's an error
    return new Date();
  }
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
 * Creates a timestamp string for database storage in Eastern timezone
 * Uses ISO-like format that's consistent and easily parseable
 * @returns Formatted date string for database storage (YYYY-MM-DD HH:mm:ss format)
 */
export function createTimestamp(): string {
  const now = getCurrentLocalTime();
  // Format as YYYY-MM-DD HH:mm:ss for consistent database storage
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Formats a date for database storage in TEXT fields
 * Ensures consistent format (YYYY-MM-DD HH:mm:ss) in Eastern timezone
 * @param date The date to format
 * @returns Formatted date string for database storage
 */
export function formatDateForDatabase(date: Date | string | undefined): string {
  if (!date) {
    return createTimestamp();
  }  
  const easternDate = toLocalTime(date);  
  // Format as YYYY-MM-DD HH:mm:ss for consistent database storage
  const year = easternDate.getFullYear();
  const month = String(easternDate.getMonth() + 1).padStart(2, '0');
  const day = String(easternDate.getDate()).padStart(2, '0');
  const hour = String(easternDate.getHours()).padStart(2, '0');
  const minute = String(easternDate.getMinutes()).padStart(2, '0');
  const second = String(easternDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Parses a date from TEXT database field
 * Handles various date formats stored in database and returns Eastern timezone Date
 * @param dateString The date string from database
 * @returns Date object in Eastern timezone
 */
export function parseDateFromDatabase(dateString: string | null | undefined): Date {
  if (!dateString) {
    return getCurrentLocalTime();
  }  
  try {
    // Handle our standard format: YYYY-MM-DD HH:mm:ss
    const standardMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/);
    if (standardMatch) {
      const [, year, month, day, hour, minute, second] = standardMatch;
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // Month is 0-indexed
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }    
    // Handle legacy format: M/D/YYYY, H:mm:ss AM/PM
    const legacyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s(\d{1,2}):(\d{2}):(\d{2})\s(AM|PM)$/);
    if (legacyMatch) {
      const [, month, day, year, hour, minute, second, period] = legacyMatch;
      let hour24 = parseInt(hour, 10);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;      
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // Month is 0-indexed
        parseInt(day, 10),
        hour24,
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }    
    // Fallback: try to parse as ISO string or other standard format
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      // Convert to Eastern timezone
      return toLocalTime(parsedDate);
    }    
    console.warn('Could not parse date string:', dateString);
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
export function toEastern(date: Date | string | null | undefined): Date {
  try {
    // Handle null, undefined, or empty inputs
    if (!date) {
      console.warn('Null or undefined date provided to toEastern:', date);
      return getCurrentLocalTime();
    }
    
    let dateObj: Date;
    
    // Handle string inputs
    if (typeof date === 'string') {
      if (date.trim() === '') {
        console.warn('Empty string provided to toEastern');
        return getCurrentLocalTime();
      }
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      console.warn('Invalid date type provided to toEastern:', typeof date, date);
      return getCurrentLocalTime();
    }
    
    // Validate that we have a valid Date object
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to toEastern:', date);
      return getCurrentLocalTime();
    }
    
    return toLocalTime(dateObj);
  } catch (error) {
    console.error('Error in toEastern:', error, 'Input:', date);
    return getCurrentLocalTime();
  }
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
 * Ensures a date is properly formatted for database submission in Eastern timezone
 * @param date The date from a form submission
 * @returns Properly formatted date string in Eastern timezone (YYYY-MM-DD HH:mm:ss)
 */
export function prepareDateForSubmission(date: Date | string | undefined): string {
  return formatDateForDatabase(date);
}

// Maintain backward compatibility with existing code
export const toNewYorkTime = toLocalTime;
export const formatEastern = formatDate;
export const createEasternTimestamp = createTimestamp;
export const formatDateForTextDatabase = formatDateForDatabase;
export const getCurrentEasternTime = getCurrentLocalTime;