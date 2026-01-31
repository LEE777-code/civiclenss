-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert themselves" ON admins;
DROP POLICY IF EXISTS "Admins can update themselves" ON admins;

-- Policy 1: Allow ALL authenticated users to view the admins list
-- This ensures the "Admins" page loads for any logged-in staff
CREATE POLICY "Admins can view all admins"
ON admins
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow admins to update their OWN profile only
-- We assume 'id' matches the authenticated user's ID (auth.uid())
CREATE POLICY "Admins can update themselves"
ON admins
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow insertion if ID matches auth ID (Self-registration/Seeding)
CREATE POLICY "Admins can insert themselves"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
