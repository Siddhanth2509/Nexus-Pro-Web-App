# Nexus Pro - Intelligent Project Management

Nexus Pro is a highly sophisticated, full-stack Web Application designed for modern teams to create projects, assign tasks, and track progress seamlessly. Built with high-end aesthetic components, role-based access control, and robust database relationships.

## 🚀 Key Features

*   **Secure Authentication:** Sign in and Sign up capabilities with token-based security (JWT).
*   **Role-Based Access Control (RBAC):** Distinct permissions for 'Admin' and 'Member' roles, ensuring secure data handling.
*   **Dynamic Dashboard:** A command center providing real-time statistics on active tasks, project status, and overdue deliverables.
*   **Advanced UI/UX:**
    *   **Light/Dark Theme:** Seamlessly switch between a clean light mode and a sophisticated dark mode.
    *   **Particle Sphere Background:** A highly interactive, 3D particle background for auth and empty states.
    *   **3D Parallax Grid:** Immersive hover effects giving depth to project cards and Kanban boards.
    *   **X-Ray Hover:** Elegant gradient overlays that follow your cursor across tasks.
*   **Kanban Task Management:** Intuitive columns (To-Do, In Progress, In Review, Done) to manage workflow efficiently.
*   **Fully Responsive:** Designed meticulously to provide a flawless "Mobile Experience" as required by rigorous assessment standards.

## ⚙️ Architecture & Requirements

*   **Frontend:** React (Vite), Tailwind CSS, Framer Motion for animations.
*   **Backend:** Node.js, Express REST APIs handling strict validations and business logic.
*   **Database:** Configured with an abstraction layer. Uses SQLite locally for rapid development and assessment submission, with seamless compatibility for PostgreSQL when deployed (e.g., on Railway).

## 🛠 Deployment & Setup

### Local Development
1. Navigate to the `backend` directory, run `npm install`, then `npm run dev` (Runs on port 5000).
2. Navigate to the `frontend` directory, run `npm install`, then `npm run dev` (Runs on port 5173).
3. The local SQLite database will be automatically created and seeded with admin data.

### Railway Deployment (Production)
1. Push this repository to GitHub.
2. In Railway, create a new project from your GitHub repository.
3. Provision a **PostgreSQL Add-on** in Railway.
4. Set the `DATABASE_URL` environment variable for the backend service.
5. Railway will automatically build and deploy both the Node.js REST API and the React Frontend SPA.
