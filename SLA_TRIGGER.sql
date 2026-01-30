-- SLA Calculation Trigger
-- Run this in Supabase SQL Editor to enable auto-deadlines

-- 1. Create Function to calculate deadline
CREATE OR REPLACE FUNCTION set_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set deadline based on severity
  IF NEW.severity = 'high' THEN
    NEW.deadline := NEW.created_at + INTERVAL '24 hours';
  ELSIF NEW.severity = 'medium' THEN
    NEW.deadline := NEW.created_at + INTERVAL '3 days';
  ELSE
    -- Low or default
    NEW.deadline := NEW.created_at + INTERVAL '7 days';
  END IF;
  return NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Trigger (Runs before every insert)
DROP TRIGGER IF EXISTS trigger_set_sla_deadline ON reports;

CREATE TRIGGER trigger_set_sla_deadline
BEFORE INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION set_sla_deadline();

-- 3. Backfill existing reports (So you can see data immediately)
UPDATE reports SET deadline = created_at + INTERVAL '24 hours' WHERE severity = 'high' AND deadline IS NULL;
UPDATE reports SET deadline = created_at + INTERVAL '3 days' WHERE severity = 'medium' AND deadline IS NULL;
UPDATE reports SET deadline = created_at + INTERVAL '7 days' WHERE (severity = 'low' OR severity IS NULL) AND deadline IS NULL;

-- 4. Enable Realtime for Audit Logs (since we want to see them live)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table reports, audit_logs;
commit;
