-- ============================================
-- ADD MISSING COLUMNS TO EXISTING REPORTS TABLE
-- ============================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Then click RUN

-- Add admin tracking columns
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS viewed_by_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS admin_viewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS resolved_by TEXT;

-- Add timestamp columns (important for tracking updates)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_viewed_by_admin ON reports(viewed_by_admin);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Update existing reports to have updated_at value
UPDATE reports 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- You should now see these columns in the results:
-- - viewed_by_admin (boolean, nullable, default: false)
-- - admin_viewed_at (timestamp with time zone, nullable)
-- - resolved_by (text, nullable)
-- - updated_at (timestamp with time zone, not null, default: timezone('utc'::text, now()))
-- - resolved_at (timestamp with time zone, nullable)
