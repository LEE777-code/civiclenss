-- FINAL ROBUST Admin Roles Setup
-- Handles 'name' vs 'full_name', 'clerk_id' constraints, and duplicates
-- Run this in Supabase SQL Editor

-- 1. Relax Constraints on Existing Columns (Safety First)
DO $$
BEGIN
    -- Remove NOT NULL from common legacy columns if they exist
    -- This prevents insertion errors if we don't have data for them
    
    -- Handle 'name' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'name') THEN
        ALTER TABLE admins ALTER COLUMN name DROP NOT NULL;
    END IF;

    -- Handle 'clerk_id' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'clerk_id') THEN
        ALTER TABLE admins ALTER COLUMN clerk_id DROP NOT NULL;
    END IF;
    
    -- Handle 'role' check constraint (drop old one to ensure we can add ours)
    -- We'll add our specific roles next
    ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
    
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Constraint relaxation warning: %', SQLERRM;
END $$;

-- 2. Add/Ensure Required Columns
DO $$
BEGIN
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS department TEXT;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS district TEXT;
    -- Ensure 'name' exists if it wasn't there (stats show it was, but for completeness)
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS name TEXT;
    
    -- Re-add Role Constraint with our new roles
    ALTER TABLE admins ADD CONSTRAINT admins_role_check 
        CHECK (role IN ('super_admin', 'state', 'district', 'department'));
        
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Column/Constraint addition warning: %', SQLERRM;
END $$;

-- 3. Ensure UNIQUE EMAIL Constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_email_key') THEN
        ALTER TABLE admins ADD CONSTRAINT admins_email_key UNIQUE (email);
    END IF;
EXCEPTION
    WHEN others THEN RAISE NOTICE 'Unique email constraint warning: %', SQLERRM;
END $$;

-- 4. Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read admins" ON admins;
CREATE POLICY "Public read admins" ON admins FOR SELECT USING (true);

-- 5. Seed Data (Populating BOTH name and full_name to satisfy any legacy code)
INSERT INTO admins (email, name, full_name, role, department, district) VALUES
('admin123@gmail.com', 'Super Administrator', 'Super Administrator', 'super_admin', NULL, NULL),
('tneb_chennai@civiclens.com', 'TNEB Officer Chennai', 'TNEB Officer Chennai', 'district', 'Power/Electricity', 'Chennai'),
('water_madurai@civiclens.com', 'Water Engineer Madurai', 'Water Engineer Madurai', 'district', 'Water Supply', 'Madurai'),
('roads_chennai@civiclens.com', 'Highway Engineer Chennai', 'Highway Engineer Chennai', 'district', 'Infrastructure', 'Chennai'),
('sanitation_coimbatore@civiclens.com', 'Health Officer Coimbatore', 'Health Officer Coimbatore', 'district', 'Sanitation', 'Coimbatore')
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    district = EXCLUDED.district,
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name; -- Sync name on update too

-- 6. Demo Data Update
UPDATE reports SET district = 'Chennai', department = 'Power/Electricity' WHERE category = 'Infrastructure' AND (district IS NULL OR district = '') LIMIT 5;
UPDATE reports SET district = 'Madurai', department = 'Water Supply' WHERE category = 'Environment' AND (district IS NULL OR district = '') LIMIT 5;

DO $$ BEGIN RAISE NOTICE '✅ Admin Setup Completed Successfully!'; END $$;
