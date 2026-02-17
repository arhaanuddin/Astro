const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/emailService');

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }

        // Find user by username
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? AND status = "active"',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    console.log('📝 Registration request received:', req.body);
    try {
        const { username, email, password, name } = req.body;

        if (!username || !email || !password || !name) {
            console.log('⚠️ Registration failed: Missing fields');
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Password length validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if username or email exists
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            console.log('⚠️ Registration failed: User/Email already exists');
            return res.status(400).json({
                success: false,
                error: 'Username or email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, name, 'member']
        );

        // Log Activity
        await db.execute(
            'INSERT INTO activity_log (user_id, action_type, action_detail) VALUES (?, ?, ?)',
            [result.insertId, 'user', `Registered: ${name}`]
        );

        console.log('✅ User created with ID:', result.insertId);

        // Send Welcome Email (async, don't block response)
        sendWelcomeEmail(email, name).catch(err => console.error('📧 Email sending failed:', err));

        const token = generateToken({
            id: result.insertId,
            username,
            email,
            name,
            role: 'member'
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: result.insertId,
                username,
                email,
                name,
                role: 'member'
            }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, username, email, name, role, created_at FROM users WHERE id = ?',
            [req.user.id]
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
            error: 'Failed to get user info'
        });
    }
});

// POST /api/auth/forgot-password - Forgot password request
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Check if user exists
        const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            // Decoy success to prevent email enumeration in real apps, 
            // but for this dev demo we'll just say success.
            return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
        }

        // In a real app: Generate token, save to DB, send email
        // For now, we just simulate success
        res.json({
            success: true,
            message: 'Reset instructions sent to email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, error: 'Failed to process request' });
    }
});

module.exports = router;
