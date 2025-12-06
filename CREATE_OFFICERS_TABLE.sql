-- Use existing admins table for officer assignments
-- Just add assignment tracking to reports table

-- Add assignment tracking columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES admins(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_by TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_assigned_admin ON reports(assigned_admin_id);

-- Update existing admins to have phone numbers (if needed)
-- UPDATE admins SET phone = '919876543210' WHERE email = 'your-admin@example.com';

-- Verification queries
SELECT 'Assignment tracking columns added successfully!' as status;

-- Check admins with phone numbers (these can be assigned reports)
SELECT 
  id,
  name,
  email,
  phone,
  department,
  role,
  state,
  district,
  local_body
FROM admins
WHERE phone IS NOT NULL
ORDER BY name;

-- Show count of admins with phone numbers
SELECT 
  COUNT(*) as admins_with_phone,
  COUNT(*) FILTER (WHERE phone IS NOT NULL) as can_receive_assignments
FROM admins;
