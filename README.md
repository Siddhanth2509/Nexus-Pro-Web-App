# Nexus Pro

A full-stack web application for project and task management, built as part of the Ethara.AI Round 1 assessment.

## What it does

Teams can sign up, create projects, assign tasks to members, and track progress through a Kanban board. Admins have elevated permissions to manage users and projects. Everyone gets a dashboard showing their tasks, deadlines, and recent activity at a glance.

## Tech stack

- **Frontend** — React 18, Vite, Tailwind CSS, Framer Motion
- **Backend** — Node.js, Express, SQLite (local) / PostgreSQL (production)
- **Auth** — JSON Web Tokens with refresh token rotation

## Running locally

You'll need Node.js installed. Then open two terminals:

```bash
# Terminal 1 — API server (runs on port 5000)
cd backend
npm install
npm run dev

# Terminal 2 — Frontend (runs on port 5173)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

Default accounts seeded on first run:
- `admin@ethara.ai` / `Admin@123`
- `member@ethara.ai` / `Member@123`

## Deploying to Railway

1. Push this repo to GitHub
2. Create a new project on [railway.app](https://railway.app) from your repo
3. Add two services — one with root directory `backend`, another with `frontend`
4. Add a PostgreSQL plugin to the backend service; Railway injects `DATABASE_URL` automatically
5. Set `JWT_SECRET` and `JWT_REFRESH_SECRET` in the backend environment variables

## API reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account (Gmail only) |
| POST | `/api/auth/login` | — | Get access + refresh tokens |
| POST | `/api/auth/forgot-password` | — | Request OTP reset code |
| POST | `/api/auth/reset-password` | — | Reset password with code |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/projects` | ✓ | List projects you belong to |
| POST | `/api/projects` | admin | Create a project |
| GET | `/api/tasks` | ✓ | List your tasks |
| POST | `/api/tasks` | ✓ | Create a task |
| GET | `/api/dashboard/stats` | ✓ | Dashboard summary |

## Roles

- **Admin** — full access, can manage users and all projects
- **Member** — can create, view, and update tasks assigned to them within their projects

## Notes

Password requirements: minimum 8 characters, at least one uppercase letter, one number, and one special character. Only Gmail addresses are accepted for registration.
