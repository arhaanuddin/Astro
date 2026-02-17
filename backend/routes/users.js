const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, username, email, name, role, status, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// GET /api/users/:id - Get single user (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, username, email, name, role, status, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
});

// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, email, password, name, role } = req.body;

        if (!username || !email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
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

        // Password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Role validation
        const validRoles = ['admin', 'member'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role'
            });
        }

        // Check if username or email exists
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Username or email already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, name, role || 'member']
        );

        res.status(201).json({
            success: true,
            user: {
                id: result.insertId,
                username,
                email,
                name,
                role: role || 'member'
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, email, name, role, status, password } = req.body;
        const targetUserId = parseInt(req.params.id);
        const requestingUserId = req.user.id;

        let query, params;

        if (targetUserId !== requestingUserId) {
            // Get original data for logging
            const [original] = await db.execute('SELECT name, role, status FROM users WHERE id = ?', [targetUserId]);

            query = 'UPDATE users SET role = ?, status = ? WHERE id = ?';
            params = [role, status, targetUserId];

            await db.execute(query, params);

            // Log activity if role or status changed
            if (original.length > 0) {
                const user = original[0];
                if (user.role !== role) {
                    await db.execute(
                        'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
                        [requestingUserId, 'user', `Updated Role: ${user.name} (${user.role} → ${role})`]
                    );
                }
                if (user.status !== status) {
                    await db.execute(
                        'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
                        [requestingUserId, 'user', `Updated Status: ${user.name} (${user.status} → ${status})`]
                    );
                }
            }
        } else {
            // Admin editing themselves - partial update support
            const fields = [];
            params = [];

            if (username) { fields.push('username = ?'); params.push(username); }
            if (email) { fields.push('email = ?'); params.push(email); }
            if (name) { fields.push('name = ?'); params.push(name); }
            if (role) { fields.push('role = ?'); params.push(role); }
            if (status) { fields.push('status = ?'); params.push(status); }

            if (password) {
                const passwordHash = await bcrypt.hash(password, 10);
                fields.push('password_hash = ?');
                params.push(passwordHash);
            }

            if (fields.length === 0) {
                return res.json({ success: true, message: 'No changes detected' });
            }

            query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            params.push(targetUserId);

            await db.execute(query, params);
        }

        res.json({
            success: true,
            message: targetUserId === requestingUserId ? 'Your profile updated' : 'User role/status updated'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent deleting self
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});

module.exports = router;
