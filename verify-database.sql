-- Verification Query: Check if admin tracking columns exist in reports table
-- Run this in Supabase SQL Editor to verify

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reports' 
AND column_name IN ('viewed_by_admin', 'admin_viewed_at', 'resolved_by')
ORDER BY column_name;

-- If no results, run the migration:

-- Add admin tracking fields
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS viewed_by_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS admin_viewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS resolved_by TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_reports_viewed_by_admin ON reports(viewed_by_admin);

-- Test query: Check actual data
SELECT id, title, viewed_by_admin, admin_viewed_at, status, resolved_by 
FROM reports 
LIMIT 5;
