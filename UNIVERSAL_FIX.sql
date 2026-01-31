-- UNIVERSAL ADMIN FIX (v2)
-- Fixed UPDATE syntax (Removed LIMIT which is not supported in UPDATE statements)

-- 1. FORCE CLEANUP
DROP TABLE IF EXISTS admins CASCADE;

-- 2. RECREATE TABLE (Using built-in UUID function)
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'state', 'district', 'department')),
    department TEXT,
    district TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. ENABLE SECURITY
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read admins" ON admins FOR SELECT USING (true);

-- 4. SEED DATA
INSERT INTO admins (email, full_name, role, department, district) VALUES
('admin123@gmail.com', 'Super Administrator', 'super_admin', NULL, NULL),
('tneb_chennai@civiclens.com', 'TNEB Engineer Chennai', 'department', 'Power/Electricity', 'Chennai'),
('water_madurai@civiclens.com', 'Water Supply Engineer', 'department', 'Water Supply', 'Madurai'),
('roads_coimbatore@civiclens.com', 'Highways Dept Officer', 'department', 'Infrastructure', 'Coimbatore'),
('health_salem@civiclens.com', 'Sanitation Officer', 'department', 'Sanitation', 'Salem');

-- 5. UPDATE REPORTS (Fixed: Removed LIMIT)
-- We strictly check if the table exists to prevent crashes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports') THEN
        -- Updates ALL matching infrastructure reports to demo Power Dept logic
        UPDATE reports 
        SET district = 'Chennai', department = 'Power/Electricity' 
        WHERE category = 'Infrastructure' AND (district IS NULL OR district = '');
        
        -- Updates ALL matching environment reports to demo Water Dept logic
        UPDATE reports 
        SET district = 'Madurai', department = 'Water Supply' 
        WHERE category = 'Environment' AND (district IS NULL OR district = '');
    END IF;
END $$;

-- 6. DONE
DO $$
BEGIN
    RAISE NOTICE '✅ Universal Fix Applied Successfully (v2)';
END $$;
