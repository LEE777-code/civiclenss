-- Migration: EXTEND_GOVERNANCE_FEATURES
-- Description: Adds departments, SLA/Deadline tracking, and Report Updates (timelines)

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    district TEXT,
    type TEXT, -- 'Electricity', 'Water', 'Road', 'Garbage', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add governance columns to reports table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'department_id') THEN
        ALTER TABLE reports ADD COLUMN department_id UUID REFERENCES departments(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'priority') THEN
        ALTER TABLE reports ADD COLUMN priority TEXT DEFAULT 'Medium'; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'sla_hours') THEN
        ALTER TABLE reports ADD COLUMN sla_hours INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'deadline') THEN
        ALTER TABLE reports ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Create report_updates table
CREATE TABLE IF NOT EXISTS report_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id TEXT, -- Clerk ID (can be uuid if your users table uses uuid, but Clerk uses string)
    message TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default departments (Seed Data)
INSERT INTO departments (name, type, district)
VALUES 
    ('TNEB (Electricity Board)', 'Streetlight / Electricity', 'All'),
    ('Water Supply & Drainage Board', 'Water / Drainage', 'All'),
    ('Municipal Corporation (Roads)', 'Road Issues', 'All'),
    ('Sanitation Department', 'Garbage & Cleanliness', 'All'),
    ('City Police', 'Public Safety', 'All'),
    ('Parks & Recreation', 'Parks & Environment', 'All')
ON CONFLICT DO NOTHING; -- (Note: Conflict handling requires unique constraint on name/type if run multiple times, simplistic for now)

-- 5. Enable RLS for new tables (Important for security)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_updates ENABLE ROW LEVEL SECURITY;

-- Allow public read access to departments
CREATE POLICY "Public departments are viewable by everyone" 
ON departments FOR SELECT 
USING (true);

-- Allow authenticated users to insert updates
CREATE POLICY "Users can insert updates for their own reports" 
ON report_updates FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR EXISTS (
    SELECT 1 FROM reports WHERE id = report_updates.report_id AND user_id = auth.uid()::text
));

-- Allow everyone to read updates for reports (transparency) - or restrict to owner/admin
CREATE POLICY "Updates are viewable by everyone" 
ON report_updates FOR SELECT 
USING (true);
