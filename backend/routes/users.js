import express from 'express';
import { connectDB } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - get all users (for task assignment)
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const users = await db
      .collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    return res.json({ users });
  } catch (error) {
    console.error('GET /users error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
