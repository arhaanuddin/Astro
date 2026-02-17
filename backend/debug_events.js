require('dotenv').config({ path: './.env' });
const db = require('./config/database');

async function debugEvents() {
    try {
        console.log('--- EVENT STATUS DEBUG ---');
        const [rows] = await db.execute('SELECT id, title, event_date, status FROM events');

        if (rows.length === 0) {
            console.log('No events found in database.');
        } else {
            console.table(rows);

            const [upcoming] = await db.execute('SELECT COUNT(*) as count FROM events WHERE event_date >= CURDATE()');
            const [completed] = await db.execute('SELECT COUNT(*) as count FROM events WHERE status = "completed"');

            console.log('--- STATS QUERY RESULTS ---');
            console.log('Upcoming (Date >= CURDATE):', upcoming[0].count);
            console.log('Completed (Status = "completed"):', completed[0].count);
        }

    } catch (error) {
        console.error('Debug script error:', error);
    } finally {
        process.exit();
    }
}

debugEvents();
