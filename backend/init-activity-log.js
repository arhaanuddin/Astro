const db = require('./config/database');

async function initActivityLog() {
    try {
        console.log('🔄 Checking for activity_log table...');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                action_type ENUM('user', 'event', 'gallery', 'system') DEFAULT 'system',
                action_detail TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        await db.execute(`CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(created_at)`);

        console.log('✅ activity_log table is ready');

        // Populate with existing data to prevent empty state
        const [existing] = await db.execute('SELECT COUNT(*) as count FROM activity_log');
        if (existing[0].count === 0) {
            console.log('📦 Backfilling activity log with existing registrations and uploads...');

            // Backfill User Registrations
            await db.execute(`
                INSERT INTO activity_log (user_id, action_type, action_detail, created_at)
                SELECT id, 'user', CONCAT('Registered: ', name), created_at 
                FROM users 
                WHERE role = 'member'
            `);

            // Backfill Gallery Uploads
            await db.execute(`
                INSERT INTO activity_log (user_id, action_type, action_detail, created_at)
                SELECT submitted_by, 'gallery', CONCAT('Uploaded Photo: ', title), created_at 
                FROM gallery
            `);

            // Backfill Events
            await db.execute(`
                INSERT INTO activity_log (user_id, action_type, action_detail, created_at)
                SELECT created_by, 'event', CONCAT('Created Event: ', title), created_at 
                FROM events
            `);

            console.log('✅ Backfill complete');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing activity log:', error);
        process.exit(1);
    }
}

initActivityLog();
