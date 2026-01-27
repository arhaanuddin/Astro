const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/stats - Get dashboard statistics (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Query Total Members
        const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
        const memberCount = users[0].count;

        // Query Upcoming Events (Today onwards)
        const [upcomingEventsResult] = await db.execute('SELECT COUNT(*) as count FROM events WHERE event_date >= CURDATE()');
        const upcomingEvents = upcomingEventsResult[0].count;

        // Query Completed Events (Before today)
        const [completedEventsResult] = await db.execute('SELECT COUNT(*) as count FROM events WHERE event_date < CURDATE()');
        const completedEvents = completedEventsResult[0].count;

        // Query Member Gallery Uploads (Approved)
        const [memberGallery] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM gallery g 
            JOIN users u ON g.submitted_by = u.id 
            WHERE g.status = "approved" AND u.role = "member"
        `);
        const memberUploads = memberGallery[0].count;

        // Query Admin Gallery Uploads (Approved)
        const [adminGallery] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM gallery g 
            JOIN users u ON g.submitted_by = u.id 
            WHERE g.status = "approved" AND u.role = "admin"
        `);
        const adminUploads = adminGallery[0].count;

        // Query Pending Submissions
        const [pending] = await db.execute('SELECT COUNT(*) as count FROM gallery WHERE status = "pending"');
        const pendingSubmissions = pending[0].count;

        // Fetch Unified Recent Activity
        const [activities] = await db.execute(`
            SELECT action_detail as detail, created_at as timestamp, action_type as type 
            FROM activity_log 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        res.json({
            success: true,
            stats: {
                totalMembers: memberCount,
                upcomingEvents,
                completedEvents,
                memberUploads,
                adminUploads,
                pendingSubmissions
            },
            activities
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
