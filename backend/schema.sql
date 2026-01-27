-- Astronet Database Schema
-- Run this script to create the required tables

CREATE DATABASE IF NOT EXISTS astronet;
USE astronet;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    event_type ENUM('observation', 'workshop', 'special', 'celestial') DEFAULT 'observation',
    capacity INT DEFAULT 100,
    is_featured BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    guest_count INT DEFAULT 0,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'attended', 'cancelled', 'waitlisted') DEFAULT 'registered',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, user_id)
);

-- Gallery table
CREATE TABLE IF NOT EXISTS gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('astro', 'events', 'workshops', 'videos') DEFAULT 'astro',
    image_path VARCHAR(500),
    image_data LONGBLOB,
    submitted_by INT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt (10 rounds)
INSERT INTO users (username, email, password_hash, name, role) VALUES
('admin', 'admin@astronet.org', '$2b$10$rQZ6o2QqMWQh4Gg4YqHG8.h4S5X8vZ8LmGR5Kg8xP1hJ5N7GvJpKq', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- Insert default member user (password: member123)
INSERT INTO users (username, email, password_hash, name, role) VALUES
('member', 'member@astronet.org', '$2b$10$rQZ6o2QqMWQh4Gg4YqHG8.YkVxP9uC3NfB5JdE1sK7M2TgA9R6XwY', 'Member User', 'member')
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample events
INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, capacity, is_featured, status) VALUES
('Total Lunar Eclipse Observation Night', 'Experience the breathtaking beauty of a total lunar eclipse as the Moon passes through Earth''s shadow. Our experts will guide you through the entire event with professional telescopes and detailed commentary.', '2026-11-15', '20:00:00', '23:30:00', 'Main Observatory Deck', 'celestial', 100, TRUE, 'active'),
('Beginner''s Astronomy Workshop', 'Perfect for newcomers! Learn the basics of stargazing, how to use a telescope, and navigate the night sky.', '2026-03-28', '18:00:00', '20:00:00', 'Lecture Hall A', 'workshop', 30, FALSE, 'upcoming'),
('Deep Sky Object Observation', 'Hunt for galaxies, nebulae, and star clusters with our advanced telescopes. Perfect conditions expected!', '2026-02-22', '21:00:00', '01:00:00', 'Dark Sky Site', 'observation', 50, FALSE, 'upcoming'),
('Astrophotography Masterclass', 'Learn advanced techniques for capturing stunning images of the night sky. Bring your camera!', '2026-03-08', '17:00:00', '21:00:00', 'Photography Lab', 'workshop', 15, FALSE, 'upcoming'),
('Spring Equinox Celebration', 'Celebrate the astronomical beginning of spring with special presentations about seasonal sky changes.', '2026-03-20', '18:00:00', '22:00:00', 'Main Observatory', 'special', 100, FALSE, 'upcoming')
ON DUPLICATE KEY UPDATE title = title;

-- Create indexes for better performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_gallery_status ON gallery(status);
CREATE INDEX idx_gallery_category ON gallery(category);

-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type ENUM('user', 'event', 'gallery', 'system') DEFAULT 'system',
    action_detail TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_activity_time ON activity_log(created_at);
