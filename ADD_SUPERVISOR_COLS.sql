-- Add Location Columns to Admins to enable Supervisor features
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS current_lat REAL;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS current_lon REAL;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
    
    -- Mock location data for demo (Lat/Lon for Tamil Nadu cities)
    -- Chennai
    UPDATE admins SET current_lat = 13.0827, current_lon = 80.2707 WHERE district = 'Chennai';
    -- Madurai
    UPDATE admins SET current_lat = 9.9252, current_lon = 78.1198 WHERE district = 'Madurai';
    -- Coimbatore
    UPDATE admins SET current_lat = 11.0168, current_lon = 76.9558 WHERE district = 'Coimbatore';
    -- Salem
    UPDATE admins SET current_lat = 11.6643, current_lon = 78.1460 WHERE district = 'Salem';
    
    RAISE NOTICE '✅ Added location columns to Admins table!';
END $$;
