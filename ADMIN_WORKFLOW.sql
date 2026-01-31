-- Admin Workflow Migration Script
-- Run this in Supabase SQL Editor

-- 1. Create Supervisors Table
CREATE TABLE IF NOT EXISTS supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    district TEXT NOT NULL,
    current_lat REAL,
    current_lon REAL,
    is_available BOOLEAN DEFAULT TRUE,
    active_tasks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for spatial queries (finding nearby supervisors)
CREATE INDEX IF NOT EXISTS idx_supervisors_location ON supervisors(current_lat, current_lon);
CREATE INDEX IF NOT EXISTS idx_supervisors_dept_district ON supervisors(department, district);

-- 2. Create Feedback Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Reports Table for Workflow
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES supervisors(id),
ADD COLUMN IF NOT EXISTS supervisor_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_image TEXT,
ADD COLUMN IF NOT EXISTS resolution_time_hours REAL,
ADD COLUMN IF NOT EXISTS reopen_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reopen_reason TEXT;

-- 4. RLS for Supervisors
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supervisors" ON supervisors
    FOR ALL
    USING (true); -- Ideally restrict to actual admins

-- 5. RLS for Feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert feedback" ON feedbacks
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins view feedback" ON feedbacks
    FOR SELECT
    USING (true);
