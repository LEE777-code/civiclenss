-- Governance Features Migration
-- Run this in Supabase SQL Editor

-- 1. Add SLA & Escalation columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_reports_deadline ON reports(deadline);
CREATE INDEX IF NOT EXISTS idx_reports_escalated ON reports(escalated);
CREATE INDEX IF NOT EXISTS idx_reports_state_district ON reports(state, district);

-- 2. Create Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL, -- Storing Clerk/Supabase User ID
    admin_name TEXT,        -- Optional: snapshot of admin name
    action TEXT NOT NULL,   -- e.g., 'STATUS_UPDATE', 'ESCALATION', 'ASSIGNMENT'
    details JSONB,          -- Store diffs or metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_report_id ON audit_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
-- Admins can view all logs
CREATE POLICY "Admins can view audit logs" ON audit_logs 
    FOR SELECT 
    USING (true);

-- Admins/System can insert logs
CREATE POLICY "Admins can insert audit logs" ON audit_logs 
    FOR INSERT 
    WITH CHECK (true);

-- 3. Update RLS for Reports (Department-wise Access Control)
-- Note: prioritizing state/district matching for admins
-- This requires checking the admin's profile against the report's location
-- Since auth.jwt() usually contains metadata, we can try to leverage that if setup, 
-- or we use a join/lookup. For simplicity in RLS, we'll allow all admins to view for now
-- and handle strict filtering in the application layer OR 
-- ideally, if 'admins' table helps map user_id to state/district:

-- (Optional) Strict RLS Example (commented out to avoid breaking existing access without proper auth setup)
/*
CREATE POLICY "Admins see only their jurisdiction" ON reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()::text -- Assuming admins.id matches auth.uid() or linked via email
            AND (
                admins.role = 'super_admin'
                OR (admins.role = 'state' AND admins.state = reports.state)
                OR (admins.role = 'district' AND admins.district = reports.district)
            )
        )
    );
*/
