-- Migration script to update database schema for proper timezone handling
-- This script converts TEXT date fields to TIMESTAMP WITH TIME ZONE

-- Step 1: Add new columns with proper timestamp types
ALTER TABLE public.production_entries 
ADD COLUMN date_new TIMESTAMP WITH TIME ZONE,
ADD COLUMN expiration_date_new TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.disposal_entries 
ADD COLUMN date_new TIMESTAMP WITH TIME ZONE;

-- Step 2: Convert existing TEXT dates to TIMESTAMP WITH TIME ZONE
-- For production entries
UPDATE public.production_entries 
SET 
  date_new = CASE 
    WHEN date ~ '^\d{4}-\d{2}-\d{2}$' THEN (date || ' 00:00:00')::timestamp with time zone
    WHEN date ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' THEN date::timestamp with time zone
    ELSE CURRENT_TIMESTAMP
  END,
  expiration_date_new = CASE 
    WHEN expiration_date ~ '^\d{4}-\d{2}-\d{2}$' THEN (expiration_date || ' 00:00:00')::timestamp with time zone
    WHEN expiration_date ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' THEN expiration_date::timestamp with time zone
    ELSE CURRENT_TIMESTAMP
  END;

-- For disposal entries
UPDATE public.disposal_entries 
SET date_new = CASE 
  WHEN date ~ '^\d{4}-\d{2}-\d{2}$' THEN (date || ' 00:00:00')::timestamp with time zone
  WHEN date ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' THEN date::timestamp with time zone
  ELSE CURRENT_TIMESTAMP
END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE public.production_entries 
DROP COLUMN date,
DROP COLUMN expiration_date;

ALTER TABLE public.production_entries 
RENAME COLUMN date_new TO date;
ALTER TABLE public.production_entries 
RENAME COLUMN expiration_date_new TO expiration_date;

ALTER TABLE public.disposal_entries 
DROP COLUMN date;

ALTER TABLE public.disposal_entries 
RENAME COLUMN date_new TO date;

-- Step 4: Add NOT NULL constraints
ALTER TABLE public.production_entries 
ALTER COLUMN date SET NOT NULL,
ALTER COLUMN expiration_date SET NOT NULL;

ALTER TABLE public.disposal_entries 
ALTER COLUMN date SET NOT NULL;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_production_entries_date ON public.production_entries(date);
CREATE INDEX IF NOT EXISTS idx_production_entries_created_at ON public.production_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_disposal_entries_date ON public.disposal_entries(date);
CREATE INDEX IF NOT EXISTS idx_disposal_entries_created_at ON public.disposal_entries(created_at); 