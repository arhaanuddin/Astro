// Run this once to create users and sample gallery data
// Usage: node seed-users.js

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../config/database');

async function seedDatabase() {
    try {
        console.log('🌱 Seeding database...');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const memberPassword = await bcrypt.hash('member123', 10);

        // Clear existing data
        await db.execute('DELETE FROM gallery');
        await db.execute('DELETE FROM event_registrations');
        await db.execute('DELETE FROM events');
        await db.execute('DELETE FROM users');

        // Reset auto increment
        await db.execute('ALTER TABLE users AUTO_INCREMENT = 1');
        await db.execute('ALTER TABLE gallery AUTO_INCREMENT = 1');
        await db.execute('ALTER TABLE events AUTO_INCREMENT = 1');

        // Insert admin user
        const [adminResult] = await db.execute(
            `INSERT INTO users (username, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
            ['admin', 'admin@astronet.org', adminPassword, 'Administrator', 'admin']
        );
        const adminId = adminResult.insertId;
        console.log('✅ Admin user created: admin / admin123');

        // Insert member user
        const [memberResult] = await db.execute(
            `INSERT INTO users (username, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
            ['member', 'member@astronet.org', memberPassword, 'Member User', 'member']
        );
        const memberId = memberResult.insertId;
        console.log('✅ Member user created: member / member123');

        // Insert gallery items using file paths (not base64)
        await db.execute(
            `INSERT INTO gallery (title, description, category, image_path, submitted_by, status, approved_by, approved_at) 
             VALUES (?, ?, ?, ?, ?, 'approved', ?, NOW())`,
            ['Spiral Galaxy NGC 1234', 'A stunning spiral galaxy captured with long exposure', 'astro', '/uploads/galaxy.png', memberId, adminId]
        );
        console.log('✅ Galaxy image added to gallery');

        await db.execute(
            `INSERT INTO gallery (title, description, category, image_path, submitted_by, status, approved_by, approved_at) 
             VALUES (?, ?, ?, ?, ?, 'approved', ?, NOW())`,
            ['Full Moon Detail', 'High resolution lunar photography showing craters', 'astro', '/uploads/moon.png', memberId, adminId]
        );
        console.log('✅ Moon image added to gallery');

        await db.execute(
            `INSERT INTO gallery (title, description, category, image_path, submitted_by, status, approved_by, approved_at) 
             VALUES (?, ?, ?, ?, ?, 'approved', ?, NOW())`,
            ['Saturn & Its Rings', 'Beautiful view of Saturn with its iconic ring system', 'astro', '/uploads/saturn.png', memberId, adminId]
        );
        console.log('✅ Saturn image added to gallery');

        // Insert sample events
        await db.execute(
            `INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, capacity, is_featured, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Total Lunar Eclipse Observation',
                'Experience the breathtaking beauty of a total lunar eclipse. Our experts will guide you through the event.',
                '2026-06-15',
                '20:00',
                '23:30',
                'Main Observatory Deck',
                'observation',
                50,
                true,
                adminId
            ]
        );
        console.log('✅ Featured event created');

        await db.execute(
            `INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, capacity, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Beginner Astronomy Workshop',
                'Perfect for newcomers! Learn the basics of stargazing and telescope use.',
                '2026-08-28',
                '18:00',
                '20:00',
                'Lecture Hall A',
                'workshop',
                30,
                adminId
            ]
        );
        console.log('✅ Workshop event created');

        console.log('\n🎉 Database seeded successfully!');
        console.log('You can now login with:');
        console.log('  Admin: admin / admin123');
        console.log('  Member: member / member123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
}

seedDatabase();
