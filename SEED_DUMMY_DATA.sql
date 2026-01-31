-- SEED DUMMY DATA FOR TESTING
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Create a Test Citizen User (if acceptable authentication workaround allows)
-- Note: Authentication usually requires real signup. We will assume existing users or just insert a placeholder
-- for user_id in reports if constraints allow.

-- 2. Insert Dummy Reports (Issues)
-- Using hardcoded UUIDs for users if you have them, otherwise using a placeholder UUID
-- assuming 'users' table has a dummy user or RLS allows inserting without foreign key if nullable (it's not).
-- So we first need to ensure a user exists.

DO $$
DECLARE
    dummy_user_id UUID;
BEGIN
    -- Try to get an existing user, or create one if possible (requires auth schema access usually)
    -- Ideally, pick the first user from auth.users -- but we can't easily access that from here without permissions.
    -- Alternative: Use the ID of the logged-in admin if available, or just a known UUID if you have one.
    
    -- For now, let's look for ANY user in the public.users table created by triggers
    SELECT id INTO dummy_user_id FROM users LIMIT 1;
    
    IF dummy_user_id IS NULL THEN
        RAISE NOTICE 'No users found in public.users table. Cannot seed reports without a user.';
        -- You might want to manually create a user in your Dashboard first.
    ELSE
        -- Insert Pending Reports (Water Supply)
        INSERT INTO reports (user_id, title, description, category, department, district, status, priority, latitude, longitude, image_url)
        VALUES 
            (dummy_user_id, 'Broken pipe in Anna Nagar', 'Severe water leakage on 2nd Avenue, wasting gallons of water.', 'Water Supply', 'Water Supply', 'Chennai', 'pending', 'high', 13.0850, 80.2100, 'https://images.unsplash.com/photo-1583307689369-0268ec320509?q=80&w=2070'),
            (dummy_user_id, 'No water supply in T. Nagar', 'Water has not come for 2 days in our street.', 'Water Supply', 'Water Supply', 'Chennai', 'pending', 'medium', 13.0400, 80.2300, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070');

        -- Insert Pending Reports (Power/Electricity)
        INSERT INTO reports (user_id, title, description, category, department, district, status, priority, latitude, longitude, image_url)
        VALUES 
            (dummy_user_id, 'Transformer sparking', 'Transformer at the corner of Gandhi Road is sparking dangerously.', 'Power/Electricity', 'Power/Electricity', 'Chennai', 'pending', 'critical', 13.0827, 80.2707, 'https://images.unsplash.com/photo-1497435334941-8c699ee9840e?q=80&w=2074');

        -- Insert Pending Reports (Infrastructure - Road)
        INSERT INTO reports (user_id, title, description, category, department, district, status, priority, latitude, longitude, image_url)
        VALUES 
            (dummy_user_id, 'Large Pothole on OMR', 'Deep pothole causing accidents near conviction center.', 'Infrastructure', 'Infrastructure', 'Chennai', 'pending', 'medium', 12.9700, 80.2500, 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070');
            
         RAISE NOTICE '✅ Seeded 4 Test Reports';
    END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
