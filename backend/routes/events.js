const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireMember } = require('../middleware/auth');

// GET /api/events - Get all events (Public)
router.get('/', async (req, res) => {
    try {
        const [events] = await db.execute(`
            SELECT e.*, 
                   COUNT(er.id) as registration_count,
                   u.name as created_by_name
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
            LEFT JOIN users u ON e.created_by = u.id
            GROUP BY e.id
            ORDER BY e.event_date ASC
        `);

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events'
        });
    }
});

// GET /api/events/featured - Get featured event
router.get('/featured', async (req, res) => {
    try {
        const [events] = await db.execute(`
            SELECT e.*, COUNT(er.id) as registration_count
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
            WHERE e.is_featured = TRUE AND e.status IN ('active', 'upcoming')
            GROUP BY e.id
            LIMIT 1
        `);

        res.json({
            success: true,
            event: events[0] || null
        });
    } catch (error) {
        console.error('Get featured event error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch featured event'
        });
    }
});

// GET /api/events/:id - Get single event (Public with optional Auth check)
const optionalAuth = async (req, res, next) => {
    // Manually check for token but don't fail if missing
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        const jwt = require('jsonwebtoken');
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;
        } catch (err) {
            // Invalid token, ignore
        }
    }
    next();
};

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const [events] = await db.execute(`
            SELECT e.*, COUNT(er.id) as registration_count
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
            WHERE e.id = ?
            GROUP BY e.id
        `, [req.params.id]);

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const event = events[0];
        event.is_registered = false;

        // Check registration status ONLY if user is logged in
        if (req.user) {
            const [registration] = await db.execute(
                'SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ? AND status = "registered"',
                [req.params.id, req.user.id]
            );
            event.is_registered = registration.length > 0;
        }

        res.json({
            success: true,
            event
        });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event'
        });
    }
});

// POST /api/events - Create event (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, event_date, start_time, end_time, location, event_type, capacity, is_featured } = req.body;

        if (!title || !description || !event_date || !start_time || !end_time || !location) {
            return res.status(400).json({
                success: false,
                error: 'Title, description, date, time, and location are required'
            });
        }

        if (capacity && (isNaN(capacity) || capacity < 0)) {
            return res.status(400).json({
                success: false,
                error: 'Capacity must be a positive number'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, capacity, is_featured, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, event_date, start_time, end_time, location, event_type || 'observation', capacity || 100, is_featured || false, req.user.id]
        );

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [req.user.id, 'event', `Created Event: ${title}`]
        );

        res.status(201).json({
            success: true,
            event: {
                id: result.insertId,
                title,
                description,
                event_date,
                location
            }
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event'
        });
    }
});

// PUT /api/events/:id - Update event (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, event_date, start_time, end_time, location, event_type, capacity, is_featured, status } = req.body;

        if (!title || !description || !event_date || !start_time || !end_time || !location) {
            return res.status(400).json({
                success: false,
                error: 'Title, description, date, time, and location are required'
            });
        }

        await db.execute(
            `UPDATE events SET title = ?, description = ?, event_date = ?, start_time = ?, end_time = ?, 
             location = ?, event_type = ?, capacity = ?, is_featured = ?, status = ?
             WHERE id = ?`,
            [title, description, event_date, start_time, end_time, location, event_type, capacity, is_featured, status, req.params.id]
        );

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [req.user.id, 'event', `Updated Event: ${title}`]
        );

        res.json({
            success: true,
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update event'
        });
    }
});

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;

        // Get event title before deleting for logging
        const [events] = await db.execute('SELECT title FROM events WHERE id = ?', [eventId]);
        const eventTitle = events.length > 0 ? events[0].title : 'Unknown Event';

        await db.execute('DELETE FROM events WHERE id = ?', [eventId]);

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [req.user.id, 'event', `Deleted Event: ${eventTitle}`]
        );

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete event'
        });
    }
});

// POST /api/events/:id/register - Register for event
router.post('/:id/register', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        // Check if event exists and has capacity
        const [events] = await db.execute(`
            SELECT e.*, COUNT(er.id) as registration_count
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
            WHERE e.id = ?
            GROUP BY e.id
        `, [eventId]);

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const event = events[0];

        if (event.status === 'completed' || event.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: `Event is ${event.status} and cannot accept registrations`
            });
        }

        const eventDate = new Date(event.event_date);
        eventDate.setHours(23, 59, 59, 999);
        if (eventDate < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Event date has passed'
            });
        }

        if (event.registration_count >= event.capacity) {
            return res.status(400).json({
                success: false,
                error: 'Event is at full capacity'
            });
        }

        // Check if already registered
        const [existing] = await db.execute(
            'SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Already registered for this event'
            });
        }

        // Register user
        const { full_name, email, phone, guest_count } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Full name and email are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Guest count validation
        if (guest_count !== undefined && guest_count !== null && (isNaN(guest_count) || guest_count < 0)) {
            return res.status(400).json({
                success: false,
                error: 'Guest count must be a non-negative number'
            });
        }

        await db.execute(
            `INSERT INTO event_registrations (event_id, user_id, full_name, email, phone, guest_count) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [eventId, userId, full_name, email, phone || null, guest_count || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Successfully registered for event'
        });
    } catch (error) {
        console.error('Register for event error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to register for event'
        });
    }
});

// DELETE /api/events/:id/register - Cancel registration
router.delete('/:id/register', authenticateToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        res.json({
            success: true,
            message: 'Registration cancelled'
        });
    } catch (error) {
        console.error('Cancel registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel registration'
        });
    }
});

// GET /api/events/:id/registrations - Get event registrations (admin only)
router.get('/:id/registrations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [registrations] = await db.execute(`
            SELECT er.*, u.username, u.name as account_name
            FROM event_registrations er
            JOIN users u ON er.user_id = u.id
            WHERE er.event_id = ?
            ORDER BY er.registered_at DESC
        `, [req.params.id]);

        res.json({
            success: true,
            registrations
        });
    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch registrations'
        });
    }
});


// DELETE /api/events/registrations/:id - Delete a registration (Admin only)
router.delete('/registrations/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const registrationId = req.params.id;

        // Get details for logging
        const [reg] = await db.execute('SELECT event_id, user_id FROM event_registrations WHERE id = ?', [registrationId]);

        if (reg.length > 0) {
            await db.execute('DELETE FROM event_registrations WHERE id = ?', [registrationId]);

            // Log Activity
            await db.execute(
                'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
                [req.user.id, 'event', `Removed registration ID: ${registrationId}`]
            );
        }

        res.json({
            success: true,
            message: 'Registration removed'
        });
    } catch (error) {
        console.error('Delete registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete registration'
        });
    }
});

module.exports = router;
