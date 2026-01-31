-- COMPREHENSIVE CIVICLENS DATABASE SETUP
-- This script consolidates all previous schema fixes into one robust setup.
-- It handles Users, Admins, RLS Policies, and initial Seed Data.
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR.

-- =====================================================================================
-- 1. SETUP EXTENSIONS & UTILITIES
-- =====================================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- 2. PUBLIC USERS TABLE (Syncs with Auth)
-- =====================================================================================
RAISE NOTICE 'Setting up public.users table...';

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
DO $$ 
BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    
    -- Relax constraints if needed (handling legacy clerk_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'clerk_id') THEN
        ALTER TABLE public.users ALTER COLUMN clerk_id DROP NOT NULL;
    END IF;
END $$;

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read users" ON public.users;
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to Auto-Sync Auth User to Public User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, phone_number, created_at)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.phone,
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Sync existing users (Safe recovery)
INSERT INTO public.users (id, full_name, phone_number, created_at)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', ''),
    phone,
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number;

-- =====================================================================================
-- 3. ADMINS TABLE (Role Based Access)
-- =====================================================================================
RAISE NOTICE 'Setting up admins table...';

-- Recreate table to ensure clean state or compatible update
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    name TEXT, -- Kept for frontend compatibility
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'state', 'district', 'department')),
    department TEXT,
    district TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Ensure columns exist
DO $$
BEGIN
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS department TEXT;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS district TEXT;
    
    -- Relax constraints
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'clerk_id') THEN
        ALTER TABLE admins ALTER COLUMN clerk_id DROP NOT NULL;
    END IF;
    
    -- Drop old check constraint if exists to update allowed roles
    ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
    ALTER TABLE admins ADD CONSTRAINT admins_role_check 
        CHECK (role IN ('super_admin', 'state', 'district', 'department'));
END $$;

-- Enable RLS for Admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read admins" ON admins;
CREATE POLICY "Public read admins" ON admins FOR SELECT USING (true);

-- =====================================================================================
-- 4. SEED ADMIN DATA
-- =====================================================================================
RAISE NOTICE 'Seeding admin data...';

INSERT INTO admins (email, full_name, name, role, department, district) VALUES
('admin123@gmail.com', 'Super Administrator', 'Super Administrator', 'super_admin', NULL, NULL),
('tneb_chennai@civiclens.com', 'TNEB Engineer Chennai', 'TNEB Engineer Chennai', 'department', 'Power/Electricity', 'Chennai'),
('water_madurai@civiclens.com', 'Water Supply Engineer', 'Water Supply Engineer', 'department', 'Water Supply', 'Madurai'),
('roads_coimbatore@civiclens.com', 'Highways Dept Officer', 'Highways Dept Officer', 'department', 'Infrastructure', 'Coimbatore'),
('health_salem@civiclens.com', 'Sanitation Officer', 'Sanitation Officer', 'department', 'Sanitation', 'Salem')
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    district = EXCLUDED.district,
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name;

-- =====================================================================================
-- 5. FIX FOREIGN KEYS (Reports)
-- =====================================================================================
RAISE NOTICE 'Fixing reports foreign keys...';

-- Fix existing bad references in reports
UPDATE reports 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM public.users);

-- Re-establish constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE reports ADD CONSTRAINT reports_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- =====================================================================================
-- 6. PERMISSIONS
-- =====================================================================================
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

RAISE NOTICE '✅ COMPREHENSIVE SCHEMA SETUP COMPLETED SUCCESSFULLY.';
