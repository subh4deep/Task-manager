import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'taskmanagement';

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB:', DB_NAME);

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('tasks').createIndex({ createdBy: 1 });
    await db.collection('tasks').createIndex({ assignedTo: 1 });

    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
