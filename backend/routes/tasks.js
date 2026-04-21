import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ Allowed statuses
const VALID_STATUS = ['todo', 'in-progress', 'done'];

// 🔐 All routes require authentication
router.use(verifyToken);

// =======================
// GET /api/tasks
// =======================
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const { status, search, assignedTo } = req.query;

    const query = {
      $or: [
        { createdBy: req.user.userId },
        { assignedTo: req.user.userId }
      ]
    };

    // ✅ Status filter
    if (status && status !== 'all') {
      const normalizedStatus = status.toLowerCase();
      if (VALID_STATUS.includes(normalizedStatus)) {
        query.status = normalizedStatus;
      }
    }

    // ✅ Search fix (no overwrite bug)
    if (search) {
      query.$and = query.$and || [];

      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // ✅ Assigned filter
    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }

    const tasks = await db
      .collection('tasks')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // 👇 Attach user info
    const userIds = [
      ...new Set([
        ...tasks.map((t) => t.createdBy),
        ...tasks.filter((t) => t.assignedTo).map((t) => t.assignedTo),
      ])
    ];

    const users = await db
      .collection('users')
      .find(
        { id: { $in: userIds } },
        { projection: { password: 0 } }
      )
      .toArray();

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const tasksWithUsers = tasks.map((task) => ({
      ...task,
      createdByUser: userMap[task.createdBy],
      assignedToUser: task.assignedTo
        ? userMap[task.assignedTo]
        : null,
    }));

    return res.json({ tasks: tasksWithUsers });

  } catch (error) {
    console.error('GET /tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// =======================
// POST /api/tasks
// =======================
router.post('/', async (req, res) => {
  try {
    const db = await connectDB();
    const { title, description, status, dueDate, assignedTo } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // ✅ Normalize + validate status
    const normalizedStatus = (status || 'todo').toLowerCase();

    if (!VALID_STATUS.includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const task = {
      id: uuidv4(),
      title,
      description: description || '',
      status: normalizedStatus,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      createdBy: req.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('tasks').insertOne(task);

    return res.status(201).json({
      message: 'Task created',
      task,
    });

  } catch (error) {
    console.error('POST /tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// =======================
// PUT /api/tasks/:id
// =======================
router.put('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    const task = await db.collection('tasks').findOne({ id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // 🔒 Permission check
    if (
      task.createdBy !== req.user.userId &&
      task.assignedTo !== req.user.userId
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // ✅ Validate status if updating
    if (req.body.status) {
      const normalizedStatus = req.body.status.toLowerCase();

      if (!VALID_STATUS.includes(normalizedStatus)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      req.body.status = normalizedStatus;
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // ❌ Prevent overriding important fields
    delete updateData.id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    await db.collection('tasks').updateOne(
      { id },
      { $set: updateData }
    );

    const updatedTask = await db.collection('tasks').findOne({ id });

    return res.json({
      message: 'Task updated',
      task: updatedTask
    });

  } catch (error) {
    console.error('PUT /tasks/:id error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// =======================
// DELETE /api/tasks/:id
// =======================
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    const task = await db.collection('tasks').findOne({ id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // 🔒 Only creator can delete
    if (task.createdBy !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.collection('tasks').deleteOne({ id });

    return res.json({ message: 'Task deleted' });

  } catch (error) {
    console.error('DELETE /tasks/:id error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;