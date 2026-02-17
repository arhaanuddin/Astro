const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET /api/gallery - Get approved gallery items (public)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = `
            SELECT g.id, g.title, g.description, g.category, g.image_path, g.image_data, g.created_at,
                   u.username as submitted_by_username, u.name as submitted_by_name
            FROM gallery g
            LEFT JOIN users u ON g.submitted_by = u.id
            WHERE g.status = 'approved'
        `;

        const params = [];
        if (category && category !== 'all') {
            query += ' AND g.category = ?';
            params.push(category);
        }

        query += ' ORDER BY g.created_at DESC';

        const [items] = await db.execute(query, params);

        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch gallery items'
        });
    }
});

// GET /api/gallery/all - Get all gallery items (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [items] = await db.execute(`
            SELECT g.*, u.username as submitted_by_username, u.name as submitted_by_name
            FROM gallery g
            LEFT JOIN users u ON g.submitted_by = u.id
            ORDER BY g.created_at DESC
        `);

        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Get all gallery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch gallery items'
        });
    }
});

// GET /api/gallery/pending - Get pending submissions (admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [items] = await db.execute(`
            SELECT g.*, u.username as submitted_by_username, u.name as submitted_by_name
            FROM gallery g
            LEFT JOIN users u ON g.submitted_by = u.id
            WHERE g.status = 'pending'
            ORDER BY g.created_at DESC
        `);

        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Get pending gallery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending items'
        });
    }
});

// GET /api/gallery/my-submissions - Get user's own submissions
router.get('/my-submissions', authenticateToken, async (req, res) => {
    try {
        const [items] = await db.execute(`
            SELECT id, title, description, category, image_path, image_data, status, created_at
            FROM gallery
            WHERE submitted_by = ?
            ORDER BY created_at DESC
        `, [req.user.id]);

        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Get my submissions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your submissions'
        });
    }
});

// POST /api/gallery/submit - Submit image for approval
router.post('/submit', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, description, category, imageData } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Title is required'
            });
        }

        if (title.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Title must be less than 100 characters'
            });
        }

        const validCategories = ['astro', 'events', 'workshops'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
        }

        let imagePath = null;
        let imageDataStr = null;

        // Handle file upload
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        } else if (imageData) {
            // Handle base64 image data
            imageDataStr = imageData;
        } else {
            return res.status(400).json({
                success: false,
                error: 'Image is required'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO gallery (title, description, category, image_path, image_data, submitted_by, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [title, description || '', category || 'astro', imagePath, imageDataStr, req.user.id]
        );

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [req.user.id, 'gallery', `Uploaded Photo: ${title}`]
        );

        res.status(201).json({
            success: true,
            message: 'Image submitted for approval',
            submission: {
                id: result.insertId,
                title,
                category,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Submit gallery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit image'
        });
    }
});

// PATCH /api/gallery/:id/approve - Approve submission (admin only)
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const submissionId = req.params.id;

        // Get title for logging
        const [items] = await db.execute('SELECT title FROM gallery WHERE id = ?', [submissionId]);
        const title = items.length > 0 ? items[0].title : 'Unknown Photo';

        await db.execute(
            `UPDATE gallery SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?`,
            [req.user.id, submissionId]
        );

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [req.user.id, 'gallery', `Approved Photo: ${title}`]
        );

        res.json({
            success: true,
            message: 'Submission approved'
        });
    } catch (error) {
        console.error('Approve gallery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve submission'
        });
    }
});

// PATCH /api/gallery/:id/reject - Reject submission (admin only)
router.patch('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const submissionId = req.params.id;

        // Get title for logging
        const [items] = await db.execute('SELECT title FROM gallery WHERE id = ?', [submissionId]);
        const title = items.length > 0 ? items[0].title : 'Unknown Photo';

        await db.execute(
            `UPDATE gallery SET status = 'rejected' WHERE id = ?`,
            [submissionId]
        );

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [req.user.id, 'gallery', `Rejected Photo: ${title}`]
        );

        res.json({
            success: true,
            message: 'Submission rejected'
        });
    } catch (error) {
        console.error('Reject gallery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject submission'
        });
    }
});

// DELETE /api/gallery/:id - Delete gallery item (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const itemId = req.params.id;

        // Get title for logging
        const [items] = await db.execute('SELECT title, image_path FROM gallery WHERE id = ?', [itemId]);
        const title = items.length > 0 ? items[0].title : 'Unknown Photo';

        if (items.length > 0 && items[0].image_path) {
            const filePath = path.join(__dirname, '..', items[0].image_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.execute('DELETE FROM gallery WHERE id = ?', [itemId]);

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [req.user.id, 'gallery', `Deleted Photo: ${title}`]
        );

        res.json({
            success: true,
            message: 'Gallery item deleted'
        });
    } catch (error) {
        console.error('Delete gallery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete gallery item'
        });
    }
});

module.exports = router;
