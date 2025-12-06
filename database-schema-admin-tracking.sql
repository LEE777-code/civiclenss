-- Add admin tracking fields to reports table
-- Run this in your Supabase SQL Editor

-- Add viewed_by_admin field (boolean to track if any admin has viewed)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS viewed_by_admin BOOLEAN DEFAULT FALSE;

-- Add admin_viewed_at timestamp (when first viewed by admin)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS admin_viewed_at TIMESTAMP WITH TIME ZONE;

-- Add resolved_by field (admin who resolved it)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS resolved_by TEXT;

-- Create index for quick filtering
CREATE INDEX IF NOT EXISTS idx_reports_viewed_by_admin ON reports(viewed_by_admin);

-- Update existing reports to set viewed_by_admin based on status
UPDATE reports 
SET viewed_by_admin = TRUE 
WHERE status IN ('resolved', 'rejected') AND viewed_by_admin = FALSE;

-- Comment: This migration adds admin tracking to help citizens know if their report has been seen
