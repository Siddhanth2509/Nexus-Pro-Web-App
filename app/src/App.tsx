import { Routes, Route, Navigate } from "react-router";
import AppLayout from "@/components/layout/AppLayout";
import DashboardPage from "@/components/dashboard/DashboardPage";
import ProjectsPage from "@/components/projects/ProjectsPage";
import ProjectDetailPage from "@/components/projects/ProjectDetailPage";
import TasksPage from "@/components/tasks/TasksPage";
import TeamPage from "@/components/team/TeamPage";
import SettingsPage from "@/components/settings/SettingsPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedLayout>
            <ProjectsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedLayout>
            <ProjectDetailPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedLayout>
            <TasksPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedLayout>
            <TeamPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <SettingsPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
