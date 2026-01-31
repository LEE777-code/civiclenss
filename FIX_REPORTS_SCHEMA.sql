-- FIX REPORTS SCHEMA & CACHE
-- Ensures 'department' column exists to prevent API 400 Errors

-- 1. Explicitly Add Column if Missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' AND column_name = 'department'
    ) THEN
        ALTER TABLE reports ADD COLUMN department TEXT;
        RAISE NOTICE 'Added missing department column';
    ELSE
        RAISE NOTICE 'Department column already exists';
    END IF;
END $$;

-- 2. Populate it immediately (Backfill) to ensure no nulls break logic
-- Re-run the mapping logic for safety
UPDATE reports SET department = 'Power/Electricity' WHERE category ILIKE '%Electricity%' OR category ILIKE '%Streetlight%' OR category ILIKE '%Power%';
UPDATE reports SET department = 'Water Supply' WHERE category ILIKE '%Water%' OR category ILIKE '%Drainage%';
UPDATE reports SET department = 'Infrastructure' WHERE category ILIKE '%Road%' OR category ILIKE '%Pothole%';
UPDATE reports SET department = 'Sanitation' WHERE category ILIKE '%Garbage%' OR category ILIKE '%Sanitation%';
UPDATE reports SET department = 'General Administration' WHERE department IS NULL;

-- 3. Force Schema Cache Reload (Critical for API to see new column)
NOTIFY pgrst, 'reload config';

RAISE NOTICE '✅ Reports Schema Fixed & Cache Reloaded';
