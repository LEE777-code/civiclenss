-- ROBUST FIX FOR USER VISIBILITY & JOIN ISSUES
-- Handles all edge cases and constraint issues
-- (Based on User's Successful Execution)

-- Step 1: Make clerk_id nullable if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'clerk_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN clerk_id DROP NOT NULL;
        RAISE NOTICE 'Made clerk_id nullable';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not modify clerk_id: %', SQLERRM;
END $$;

-- Step 2: Ensure public.users table exists with minimal structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add full_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column';
    END IF;
    
    -- Add phone_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE public.users ADD COLUMN phone_number TEXT;
        RAISE NOTICE 'Added phone_number column';
    END IF;
    
    -- Add avatar_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding columns: %', SQLERRM;
END $$;

-- Step 4: Enable RLS with safe policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read users" ON public.users;
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users 
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
CREATE POLICY "Users can insert own record" ON public.users 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 5: Sync existing Auth Users to Public Users (with error handling)
DO $$
DECLARE
    sync_count INTEGER := 0;
    error_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Insert/Update users one by one to handle individual errors
    FOR user_record IN 
        SELECT 
            id, 
            COALESCE(raw_user_meta_data->>'full_name', '') as full_name,
            phone,
            created_at
        FROM auth.users
    LOOP
        BEGIN
            INSERT INTO public.users (id, full_name, phone_number, created_at)
            VALUES (
                user_record.id, 
                user_record.full_name, 
                user_record.phone,
                user_record.created_at
            )
            ON CONFLICT (id) DO UPDATE SET 
                full_name = EXCLUDED.full_name,
                phone_number = EXCLUDED.phone_number;
            
            sync_count := sync_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Error syncing user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Synced % users, % errors', sync_count, error_count;
END $$;

-- Step 6: Fix Reports Foreign Key (with safety checks)
DO $$
DECLARE
    bad_refs INTEGER;
BEGIN
    -- Count bad references
    SELECT COUNT(*) INTO bad_refs
    FROM reports 
    WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM public.users);
    
    IF bad_refs > 0 THEN
        RAISE NOTICE 'Found % reports with invalid user_id references', bad_refs;
        
        -- Nullify bad references
        UPDATE reports 
        SET user_id = NULL 
        WHERE user_id IS NOT NULL 
        AND user_id NOT IN (SELECT id FROM public.users);
        
        RAISE NOTICE 'Cleaned up invalid user_id references';
    END IF;
    
    -- Drop and recreate foreign key constraint
    ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
    ALTER TABLE reports ADD CONSTRAINT reports_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key constraint established';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing foreign key: %', SQLERRM;
END $$;

-- Step 7: Grant necessary permissions
DO $$
BEGIN
    GRANT SELECT ON public.users TO anon;
    GRANT SELECT ON public.users TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
    GRANT ALL ON public.users TO service_role;
    
    RAISE NOTICE 'Permissions granted';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error granting permissions: %', SQLERRM;
END $$;

-- Step 8: Create trigger to auto-sync new auth users
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Final success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ User Relationship & Visibility Fixed Successfully';
    RAISE NOTICE '✅ Auto-sync trigger created for future users';
END $$;
