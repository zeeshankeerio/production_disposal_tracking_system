# Timezone Migration Guide

## Overview

This document outlines the timezone migration changes made to ensure proper US Eastern timezone handling for production and disposal entries, along with correct created date/time alignment.

## Changes Made

### 1. Database Schema Updates

**Before:**
```sql
-- Production entries table
date TEXT NOT NULL,
expiration_date TEXT NOT NULL,

-- Disposal entries table  
date TEXT NOT NULL,
```

**After:**
```sql
-- Production entries table
date TIMESTAMP WITH TIME ZONE NOT NULL,
expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,

-- Disposal entries table
date TIMESTAMP WITH TIME ZONE NOT NULL,
```

### 2. Date Utility Functions

Updated `lib/date-utils.ts` with consistent US Eastern timezone handling:

- **`toEastern(date)`**: Now uses proper timezone conversion instead of manual hour adjustments
- **`toNewYorkTime(date)`**: Converts any date to America/New_York timezone
- **`createEasternTimestamp()`**: Creates proper timestamps for database created_at fields
- **`formatTimestampForDatabase(date)`**: Formats dates for TIMESTAMP WITH TIME ZONE database fields

### 3. Database Service Updates

Updated both `lib/db-service.ts` and `lib/supabase-db.ts` to:
- Use consistent timezone handling functions
- Remove manual hour adjustments (+4/-4 hours)
- Properly format dates for database storage
- Ensure created_at timestamps are in US Eastern time

## Migration Process

### For New Installations

1. Run the updated `setup-database.sql` script
2. The new schema will use proper TIMESTAMP WITH TIME ZONE fields

### For Existing Installations

1. Run the migration script `migrate-database-schema.sql`
2. This will:
   - Add new timestamp columns
   - Convert existing TEXT dates to proper timestamps
   - Drop old columns and rename new ones
   - Add performance indexes

## Timezone Handling Best Practices

### 1. Always Use America/New_York Timezone

```typescript
const NEW_YORK_TIMEZONE = 'America/New_York';
```

### 2. Use Proper Timezone Conversion

```typescript
// ✅ Correct way
const easternDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));

// ❌ Avoid manual hour adjustments
const easternDate = new Date(date);
easternDate.setHours(easternDate.getHours() - 4); // Don't do this
```

### 3. Database Storage

```typescript
// ✅ Store as ISO string with timezone info
const timestamp = easternDate.toISOString();

// ❌ Don't store as locale string
const timestamp = easternDate.toLocaleString('en-US', { timeZone: 'America/New_York' });
```

### 4. Display Formatting

```typescript
// ✅ Format for display using timezone
const displayDate = date.toLocaleDateString('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
```

## Key Functions

### `createEasternTimestamp()`
Creates a proper timestamp for database created_at fields in US Eastern time.

### `formatTimestampForDatabase(date)`
Formats dates for TIMESTAMP WITH TIME ZONE database fields.

### `toEastern(date)`
Converts any date to US Eastern timezone using proper timezone conversion.

### `toNewYorkTime(date)`
Converts any date to New York timezone (US Eastern Time).

## Testing Timezone Handling

### 1. Check Current Timezone
```typescript
console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Eastern time:', getCurrentEasternTime());
```

### 2. Test Date Conversion
```typescript
const testDate = new Date('2024-01-15T10:30:00Z');
const easternDate = toEastern(testDate);
console.log('Original:', testDate);
console.log('Eastern:', easternDate);
```

### 3. Test Database Storage
```typescript
const timestamp = formatTimestampForDatabase(testDate);
console.log('Database timestamp:', timestamp);
```

## Common Issues and Solutions

### Issue: Dates showing wrong time
**Solution**: Ensure all date operations use the timezone-aware functions from `date-utils.ts`

### Issue: Created_at timestamps in wrong timezone
**Solution**: Use `createEasternTimestamp()` for all created_at fields

### Issue: Date filtering not working correctly
**Solution**: Convert entry dates to Eastern timezone before comparison:
```typescript
const entryDate = toEastern(new Date(entry.date));
```

## Verification Checklist

- [ ] Database schema uses TIMESTAMP WITH TIME ZONE
- [ ] All date utilities use America/New_York timezone
- [ ] No manual hour adjustments (+4/-4) in code
- [ ] Created_at fields use `createEasternTimestamp()`
- [ ] Date filtering works correctly across timezone boundaries
- [ ] Display dates show correct US Eastern time
- [ ] Database migration completed successfully

## Support

If you encounter timezone-related issues:

1. Check that all date operations use functions from `lib/date-utils.ts`
2. Verify database schema has proper TIMESTAMP WITH TIME ZONE fields
3. Ensure no manual hour adjustments are being used
4. Test with dates around daylight saving time transitions

## Notes

- The application now consistently uses US Eastern timezone (America/New_York)
- All database timestamps include timezone information
- Date filtering and sorting work correctly across timezone boundaries
- Created_at timestamps are properly aligned with US Eastern time 