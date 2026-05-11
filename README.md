# 🚀 Ethara AI - Nexus Pro

A full-stack web application for **project and task management**, built with modern technologies and optimized for production deployment.

> **Status**: ✅ Production-Ready | 🚀 Deployed on Vercel (Frontend) & Hugging Face (Backend)

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Roles & Permissions](#-roles--permissions)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- **Team Collaboration**: Create teams, invite members, manage projects
- **Task Management**: Create, assign, and track tasks with status updates
- **Kanban Board**: Visual project management with drag-and-drop tasks
- **Dashboard Analytics**: Real-time charts and statistics
- **Role-Based Access Control (RBAC)**: Admin and Member roles with permission enforcement
- **Google OAuth**: Quick sign-in with Google accounts
- **JWT Authentication**: Secure token-based authentication with refresh rotation
- **Real-time Updates**: Live task and project status updates

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Google OAuth** - Third-party authentication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite** - Local development database
- **PostgreSQL** - Production database (cloud-ready)
- **JWT** - Authentication & authorization
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Deployment
- **Vercel** - Frontend hosting (React/Vite)
- **Hugging Face Spaces** - Backend serverless platform
- **PostgreSQL** - Cloud database

---

## 🎯 Quick Start

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v8+ (comes with Node.js)

### Local Development

**1. Clone & Install Dependencies**
```bash
git clone https://github.com/Siddhanth2509/Nexus-Pro-Web-App.git
cd "Ethara AI App"

# Backend
cd backend
npm install
cp .env.example .env  # Add your environment variables

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env  # Add your API URL
```

**2. Start Development Servers**
```bash
# Terminal 1 - Backend (runs on http://localhost:5000)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on http://localhost:5173)
cd frontend
npm run dev
```

**3. Open in Browser**
Navigate to `http://localhost:5173`

### Test Accounts (Development)
| Email | Password | Role |
|-------|----------|------|
| admin@ethara.ai | Admin@123 | Admin |
| member@ethara.ai | Member@123 | Member |

---

## 📁 Project Structure

```
Ethara AI App/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express app & server
│   │   ├── db.js              # SQLite/PostgreSQL setup
│   │   ├── middleware/        # Auth & RBAC middleware
│   │   └── routes/            # API endpoints
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main component
│   │   ├── main.jsx           # Vite entry point
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   └── context/           # Auth & Theme context
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── README.md
├── VERCEL_DEPLOYMENT.md       # Frontend deployment guide
├── HUGGING_FACE_DEPLOYMENT.md # Backend deployment guide
└── .gitignore
```

---

## 🔌 API Reference

### Authentication
```
POST   /api/auth/register          # Create account
POST   /api/auth/login             # Get JWT tokens
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset with code
GET    /api/auth/me                # Current user profile
```

### Projects
```
GET    /api/projects               # List user's projects
POST   /api/projects               # Create project (admin only)
```

### Tasks
```
GET    /api/tasks                  # List user's tasks
POST   /api/tasks                  # Create task
```

### Dashboard
```
GET    /api/dashboard/stats        # Dashboard statistics
```

### Health Check
```
GET    /api/health                 # Server health status
```

---

## 🚀 Deployment

### Frontend → Vercel
Deploy React/Vite frontend to Vercel with one click:

1. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions
2. Quick deployment: Connect GitHub repo to Vercel dashboard
3. Automatic deployments on every push to `main` branch

### Backend → Hugging Face Spaces
Deploy Node.js backend to Hugging Face Spaces:

1. See [HUGGING_FACE_DEPLOYMENT.md](./HUGGING_FACE_DEPLOYMENT.md) for detailed instructions
2. Create Hugging Face Space from this repository
3. Configure environment variables in Space settings

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Frontend (`frontend/.env`)
```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

See `.env.example` files in each directory for templates.

---

## 👥 Roles & Permissions

### Admin
- ✅ Create, edit, delete projects
- ✅ Assign members to projects
- ✅ Create, assign tasks to any team member
- ✅ View all projects and tasks
- ✅ Manage user roles

### Member
- ✅ View assigned projects
- ✅ Create tasks in assigned projects
- ✅ View and update their own tasks
- ✅ View team members and project details
- ❌ Cannot create projects (admin only)
- ❌ Cannot manage other users

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Node.js version
node --version  # Should be v18+

# Clear node_modules and reinstall
rm -rf backend/node_modules
cd backend && npm install

# Check port 5000 is not in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux
```

### Frontend API errors
```
Error: Cannot connect to backend API
```
**Solution**: Check `VITE_API_URL` matches your backend URL in `frontend/.env`

### Database connection issues
```
Error: Cannot connect to PostgreSQL
```
**Solution**: Verify `DATABASE_URL` is correct and database is running

### Google OAuth not working
```
Error: Invalid Client ID
```
**Solution**: 
1. Get Client ID from [Google Cloud Console](https://console.cloud.google.com)
2. Add `localhost:5173` and your Vercel domain to authorized origins
3. Update `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`

---

## 📝 Scripts

### Backend
```bash
npm run dev      # Start with nodemon (auto-restart on changes)
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## 📄 License

This project was built as part of the Ethara.AI assessment round.

---

## 🤝 Support

For issues or questions, please check the deployment guides:
- [Vercel Frontend Deployment](./VERCEL_DEPLOYMENT.md)
- [Hugging Face Backend Deployment](./HUGGING_FACE_DEPLOYMENT.md)
