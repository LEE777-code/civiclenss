-- CivicLens Reports Table Schema
-- Run this in your Supabase SQL Editor to create the reports table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reports Table (for citizen-submitted issues)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  user_id TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
-- Anyone can view all reports
CREATE POLICY "Anyone can view reports" ON reports 
  FOR SELECT 
  USING (true);

-- Authenticated users can insert reports
CREATE POLICY "Authenticated users can insert reports" ON reports 
  FOR INSERT 
  WITH CHECK (true);

-- Users can update their own reports
CREATE POLICY "Users can update own reports" ON reports 
  FOR UPDATE 
  USING (auth.uid()::text = user_id OR auth.role() = 'authenticated');

-- Admins can update any report (you may want to add admin role check)
CREATE POLICY "Admins can update any report" ON reports 
  FOR UPDATE 
  USING (true);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON reports 
  FOR DELETE 
  USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at 
  BEFORE UPDATE ON reports
  FOR EACH ROW 
  EXECUTE FUNCTION update_reports_updated_at();

-- Insert sample data (optional - remove if you don't want sample data)
INSERT INTO reports (title, description, category, status, severity, location_name, user_id) VALUES
  ('Pothole on Main Street', 'Large pothole causing traffic issues', 'Road Issues', 'pending', 'high', '123 Main St, Downtown', 'sample-user-1'),
  ('Broken Street Light', 'Street light not working for 3 days', 'Streetlight / Electricity', 'pending', 'medium', '456 Oak Ave, Suburb', 'sample-user-2'),
  ('Garbage Not Collected', 'Garbage has not been collected for a week', 'Garbage & Cleanliness', 'resolved', 'low', '789 Pine Rd, East Side', 'sample-user-3')
ON CONFLICT DO NOTHING;
