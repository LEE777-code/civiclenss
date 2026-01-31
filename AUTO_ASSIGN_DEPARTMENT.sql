-- AI SEGREGATION TRIGGER
-- Maps 'Category' -> 'Department' automatically for Admin Visibility

-- 1. Create Mapping Function
CREATE OR REPLACE FUNCTION assign_department_from_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic: If department is missing, try to infer it from category
    IF NEW.department IS NULL OR NEW.department = '' THEN
        -- Map categories to departments
        IF NEW.category ILIKE '%Electricity%' OR NEW.category ILIKE '%Streetlight%' OR NEW.category ILIKE '%Power%' THEN
            NEW.department := 'Power/Electricity';
        ELSIF NEW.category ILIKE '%Water%' OR NEW.category ILIKE '%Drainage%' OR NEW.category ILIKE '%Pipeline%' THEN
            NEW.department := 'Water Supply';
        ELSIF NEW.category ILIKE '%Road%' OR NEW.category ILIKE '%Pothole%' OR NEW.category ILIKE '%Infrastructure%' THEN
            NEW.department := 'Infrastructure';
        ELSIF NEW.category ILIKE '%Garbage%' OR NEW.category ILIKE '%Sanitation%' OR NEW.category ILIKE '%Waste%' THEN
            NEW.department := 'Sanitation';
        ELSIF NEW.category ILIKE '%Health%' OR NEW.category ILIKE '%Hospital%' THEN
            NEW.department := 'Health';
        ELSE
            -- Default Fallback
            NEW.department := 'General Administration';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Trigger (Runs BEFORE INSERT/UPDATE)
DROP TRIGGER IF EXISTS trigger_assign_department ON reports;

CREATE TRIGGER trigger_assign_department
BEFORE INSERT OR UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION assign_department_from_category();

-- 3. Backfill Existing Data
UPDATE reports SET department = 'Power/Electricity' WHERE category ILIKE '%Electricity%' OR category ILIKE '%Streetlight%';
UPDATE reports SET department = 'Water Supply' WHERE category ILIKE '%Water%' OR category ILIKE '%Drainage%';
UPDATE reports SET department = 'Infrastructure' WHERE category ILIKE '%Road%' OR category ILIKE '%Pothole%';
UPDATE reports SET department = 'Sanitation' WHERE category ILIKE '%Garbage%' OR category ILIKE '%Sanitation%';

RAISE NOTICE '✅ AI Segregation Logic Applied!';
