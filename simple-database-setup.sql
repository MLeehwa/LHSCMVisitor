-- Simple Database Setup for Visitor Management System
-- Copy and paste this entire script into Supabase SQL Editor

-- Drop all existing tables
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
    category VARCHAR(20) NOT NULL,
    location_name VARCHAR(200),
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checkout_time TIMESTAMP WITH TIME ZONE
);

-- Create visit_logs table
CREATE TABLE visit_logs (
    id SERIAL PRIMARY KEY,
    visitor_id INTEGER REFERENCES visitors(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(20),
    purpose VARCHAR(50),
    category VARCHAR(20) NOT NULL,
    location_name VARCHAR(200),
    checkin_time TIMESTAMP WITH TIME ZONE NOT NULL,
    checkout_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius DECIMAL(5, 2) DEFAULT 0.1
);

-- Create frequent_visitors table
CREATE TABLE frequent_visitors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(20)
);

-- Insert sample data
INSERT INTO locations (name, category, latitude, longitude, radius) VALUES
('Main Dormitory', 'dormitory', 37.5665, 126.9780, 0.1),
('Factory Building A', 'factory', 37.5675, 126.9790, 0.1);

INSERT INTO frequent_visitors (first_name, last_name, company, phone) VALUES
('John', 'Doe', 'ABC Company', '010-1234-5678'),
('Jane', 'Smith', 'XYZ Corp', '010-9876-5432');
