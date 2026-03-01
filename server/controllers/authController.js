const User = require('../models/User');

/**
 * POST /api/auth/register - Register a new user
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        const user = await User.create({ name, email: normalizedEmail, password, role: role || 'viewer' });
        const token = user.generateToken();
        res.status(201).json({
            success: true,
            data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/auth/login - Login user
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = user.generateToken();
        res.json({
            success: true,
            data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/auth/me - Get current user profile
 */
exports.getMe = async (req, res) => {
    res.json({ success: true, data: { user: req.user } });
};

/**
 * GET /api/auth/users - Get all users (admin only)
 */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
