-- SUPERVISOR ASSIGNMENT SCHEMA & SEED DATA
-- Run this in Supabase SQL Editor

-- 1. Enhance supervisors table
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS sla_delay_count INTEGER DEFAULT 0;

-- 2. Enhance audit_logs table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS override_reason TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS distance_at_assignment REAL;

-- 3. Seed Demo Supervisors (Power/Electricity - Chennai)
INSERT INTO supervisors (name, email, phone, department, district, current_lat, current_lon, is_available, active_tasks, sla_delay_count)
VALUES 
    ('Rajan Kumar', 'rajan@tneb.gov.in', '+919876543210', 'Power/Electricity', 'Chennai', 13.0827, 80.2707, true, 2, 0),
    ('Priya Devi', 'priya@tneb.gov.in', '+919876543211', 'Power/Electricity', 'Chennai', 13.0600, 80.2500, true, 5, 1),
    ('Suresh Babu', 'suresh@tneb.gov.in', '+919876543212', 'Power/Electricity', 'Chennai', 13.1000, 80.2900, true, 1, 0)
ON CONFLICT (email) DO UPDATE SET
    current_lat = EXCLUDED.current_lat,
    current_lon = EXCLUDED.current_lon,
    active_tasks = EXCLUDED.active_tasks,
    sla_delay_count = EXCLUDED.sla_delay_count;

-- 4. Seed Demo Supervisors (Water Supply - Chennai)
INSERT INTO supervisors (name, email, phone, department, district, current_lat, current_lon, is_available, active_tasks, sla_delay_count)
VALUES 
    ('Lakshmi Narayanan', 'lakshmi@metrowater.gov.in', '+919876543213', 'Water Supply', 'Chennai', 13.0500, 80.2400, true, 3, 0),
    ('Ganesan R', 'ganesan@metrowater.gov.in', '+919876543214', 'Water Supply', 'Chennai', 13.0900, 80.2800, true, 1, 2)
ON CONFLICT (email) DO UPDATE SET
    current_lat = EXCLUDED.current_lat,
    current_lon = EXCLUDED.current_lon;

-- 5. Seed Demo Supervisors (Infrastructure - Chennai)
INSERT INTO supervisors (name, email, phone, department, district, current_lat, current_lon, is_available, active_tasks, sla_delay_count)
VALUES 
    ('Murugan K', 'murugan@highways.gov.in', '+919876543215', 'Infrastructure', 'Chennai', 13.0700, 80.2600, true, 4, 1)
ON CONFLICT (email) DO UPDATE SET
    current_lat = EXCLUDED.current_lat,
    current_lon = EXCLUDED.current_lon;

-- 6. Ensure RLS allows reading supervisors
DROP POLICY IF EXISTS "Public read supervisors" ON supervisors;
CREATE POLICY "Public read supervisors" ON supervisors FOR SELECT USING (true);

-- Done
DO $$ BEGIN RAISE NOTICE '✅ Supervisor Assignment Schema & Demo Data Ready!'; END $$;
