const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (admin) =>
  jwt.sign(
    { id: admin._id, email: admin.email, name: admin.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Only succeeds if zero admins exist → prevents unauthorized sign-ups after setup
const register = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin account already exists. Registration is disabled.',
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    const admin = await Admin.create({ name, email, passwordHash: password });
    const token = signToken(admin);

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Explicitly select passwordHash (excluded by default)
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!admin) {
      // Use vague message to prevent email enumeration
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(admin);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    return res.status(200).json({
      success: true,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, me };
