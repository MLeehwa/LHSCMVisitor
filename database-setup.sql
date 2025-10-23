-- Visitor Management System Database Setup
-- This script creates all necessary tables for the visitor management system

-- Drop all existing tables (in correct order to handle foreign key constraints)
DROP TABLE IF EXISTS visit_logs CASCADE;
DROP TABLE IF EXISTS visitors CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS frequent_visitors CASCADE;

-- Create visitors table
CREATE TABLE visitors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(20),
    purpose VARCHAR(50),
    category VARCHAR(20) NOT NULL CHECK (category IN ('dormitory', 'factory')),
    location_name VARCHAR(200),
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checkout_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visit_logs table
CREATE TABLE visit_logs (
    id SERIAL PRIMARY KEY,
    visitor_id INTEGER REFERENCES visitors(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(20),
    purpose VARCHAR(50),
    category VARCHAR(20) NOT NULL CHECK (category IN ('dormitory', 'factory')),
    location_name VARCHAR(200),
    checkin_time TIMESTAMP WITH TIME ZONE NOT NULL,
    checkout_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('dormitory', 'factory')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius DECIMAL(5, 2) DEFAULT 0.1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create frequent_visitors table
CREATE TABLE frequent_visitors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample location data
INSERT INTO locations (name, category, latitude, longitude, radius) VALUES
('Main Dormitory', 'dormitory', 37.5665, 126.9780, 0.1),
('Factory Building A', 'factory', 37.5675, 126.9790, 0.1),
('Factory Building B', 'factory', 37.5685, 126.9800, 0.1);

-- Insert sample frequent visitors
INSERT INTO frequent_visitors (first_name, last_name, company, phone) VALUES
('John', 'Doe', 'ABC Company', '010-1234-5678'),
('Jane', 'Smith', 'XYZ Corp', '010-9876-5432'),
('김', '철수', '한국기업', '010-1111-2222');

-- Create indexes for better performance
CREATE INDEX idx_visitors_checkin_time ON visitors(checkin_time);
CREATE INDEX idx_visitors_category ON visitors(category);
CREATE INDEX idx_visitors_checkout_time ON visitors(checkout_time);
CREATE INDEX idx_visit_logs_visitor_id ON visit_logs(visitor_id);
CREATE INDEX idx_visit_logs_checkin_time ON visit_logs(checkin_time);
CREATE INDEX idx_visit_logs_category ON visit_logs(category);
CREATE INDEX idx_locations_category ON locations(category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON visitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frequent_visitors_updated_at BEFORE UPDATE ON frequent_visitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed for your Supabase setup)
-- These might not be needed in Supabase, but included for completeness
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Visitor Management System database setup completed successfully!';
    RAISE NOTICE 'Tables created: visitors, visit_logs, locations, frequent_visitors';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;
