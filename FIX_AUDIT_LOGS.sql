-- FIX AUDIT LOGS SCHEMA
-- Ensures columns required for Supervisor Assignment exist

BEGIN;

-- 1. Add 'override_reason' if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'override_reason'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN override_reason TEXT;
    END IF;
END $$;

-- 2. Add 'distance_at_assignment' if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'distance_at_assignment'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN distance_at_assignment NUMERIC;
    END IF;
END $$;

COMMIT;

-- 3. Reload API Schema Cache
NOTIFY pgrst, 'reload schema';
