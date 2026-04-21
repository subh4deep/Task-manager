# Task Management System

A full-stack task management application with a **Next.js** frontend and an **Express + MongoDB** backend — cleanly separated into two independent projects.

```
task-management/
├── backend/      ← Express REST API (Node.js)
└── frontend/     ← Next.js React app
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

---

## Backend Setup

```bash
cd backend
npm install
```

Create your `.env` (copy from `.env.example`):

```env
PORT=5000
MONGO_URL=mongodb://localhost:27017
DB_NAME=taskmanagement
JWT_SECRET=replace_this_with_a_long_random_secret
CORS_ORIGINS=http://localhost:3000
```

Start the server:

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

## Frontend Setup

```bash
cd frontend
npm install
```

Create your `.env` (copy from `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login |
| POST | /api/auth/logout | No | Logout |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/users | Yes | List all users |
| GET | /api/tasks | Yes | Get tasks (filterable) |
| POST | /api/tasks | Yes | Create task |
| PUT | /api/tasks/:id | Yes | Update task |
| DELETE | /api/tasks/:id | Yes | Delete task |

---

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URL` | MongoDB connection string | — |
| `DB_NAME` | MongoDB database name | `taskmanagement` |
| `JWT_SECRET` | Secret for signing JWTs | — (required) |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL | `http://localhost:5000` |
