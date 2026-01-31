DROP TABLE IF EXISTS admins CASCADE;

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'state', 'district', 'department')),
    department TEXT,
    district TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read admins" ON admins FOR SELECT USING (true);

INSERT INTO admins (email, full_name, role, department, district) VALUES
('admin123@gmail.com', 'Super Administrator', 'super_admin', NULL, NULL),
('tneb_chennai@civiclens.com', 'TNEB Engineer Chennai', 'department', 'Power/Electricity', 'Chennai'),
('water_madurai@civiclens.com', 'Water Supply Engineer', 'department', 'Water Supply', 'Madurai'),
('roads_coimbatore@civiclens.com', 'Highways Dept Officer', 'department', 'Infrastructure', 'Coimbatore'),
('health_salem@civiclens.com', 'Sanitation Officer', 'department', 'Sanitation', 'Salem');

UPDATE reports 
SET district = 'Chennai', department = 'Power/Electricity' 
WHERE category = 'Infrastructure' 
  AND (district IS NULL OR district = '') 
LIMIT 5;

UPDATE reports 
SET district = 'Madurai', department = 'Water Supply' 
WHERE category = 'Environment' 
  AND (district IS NULL OR district = '') 
LIMIT 5;

DO $$
BEGIN
    RAISE NOTICE '✅ Fresh Admin Schema Created & Seeded Successfully!';
END $$;
