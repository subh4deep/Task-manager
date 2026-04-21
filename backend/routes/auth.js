import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '../config/db.js';
import { createToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 🔥 FORCE PRODUCTION COOKIE SETTINGS (important for Render + Vercel)
const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: 'None', // 🔥 REQUIRED for cross-site
  secure: true      // 🔥 REQUIRED for HTTPS
};

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, and name are required'
      });
    }

    const db = await connectDB();

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const user = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').insertOne(user);

    const token = createToken(userId, email);

    // 🔥 SET COOKIE
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, email, name },
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const db = await connectDB();

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user.id, user.email);

    // 🔥 SET COOKIE
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ================= LOGOUT =================
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    path: '/',
    sameSite: 'None',
    secure: true
  });

  return res.json({ message: 'Logout successful' });
});

// ================= GET CURRENT USER =================
router.get('/me', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();

    const userData = await db.collection('users').findOne(
      { id: req.user.userId },
      { projection: { password: 0 } }
    );

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: userData });

  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;