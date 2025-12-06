-- ============================================
-- FIX REPORT SUBMISSION ISSUES
-- ============================================
-- Run this in Supabase SQL Editor if users can't submit reports

-- 1. Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'reports';

-- 2. DROP existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;
DROP POLICY IF EXISTS "Users can only insert authenticated reports" ON reports;

-- 3. CREATE new policies that allow EVERYONE to insert reports
-- This allows both authenticated and anonymous users to submit

CREATE POLICY "Anyone can insert reports"
ON reports FOR INSERT
WITH CHECK (true);

-- Also ensure everyone can VIEW reports
CREATE POLICY "Anyone can view reports"
ON reports FOR SELECT
USING (true);

-- Allow users to UPDATE their own reports (for upvotes, etc.)
CREATE POLICY "Users can update their own reports"
ON reports FOR UPDATE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
       OR user_id LIKE 'anon_%'); -- Allow anonymous users too

-- Allow admins to UPDATE any report (for status changes)
CREATE POLICY "Admins can update any report"
ON reports FOR UPDATE
USING (true); -- You can add admin check here if needed

-- Allow users to DELETE their own reports
CREATE POLICY "Users can delete their own reports"
ON reports FOR DELETE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
       OR user_id LIKE 'anon_%');

-- Verify policies were created
SELECT 
    policyname,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'reports'
ORDER BY cmd, policyname;

-- If you want to completely disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION):
-- ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS:
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
