-- Enable RLS on admins table if not already enabled
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert themselves" ON admins;
DROP POLICY IF EXISTS "Admins can update themselves" ON admins;

-- Policy 1: Allow authenticated users (admins) to view all admin profiles
-- This is necessary for the "Admins" list page to work
CREATE POLICY "Admins can view all admins"
ON admins
FOR SELECT
TO authenticated
USING (true); -- Ideally, we would check if auth.uid() is in admins table, but for bootstrapping: true for all auth users

-- Policy 2: Allow insertion (usually handled by a trigger or initial script, but if client-side:)
CREATE POLICY "Admins can insert themselves"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = clerk_id OR auth.uid() = id); -- Adjust based on how auth is handled (Clerk vs Supabase Auth)

-- Policy 3: Allow updates to own profile
CREATE POLICY "Admins can update themselves"
ON admins
FOR UPDATE
TO authenticated
USING (auth.uid()::text = clerk_id)
WITH CHECK (auth.uid()::text = clerk_id);
