import React from 'react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Team from './pages/Team';
import ForgotPassword from './pages/ForgotPassword';

// Set base URL for production API
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_ID = rawGoogleClientId.includes('YOUR_GOOGLE_CLIENT_ID') ? '' : rawGoogleClientId;

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PrivateLayout({ children }) {
  return (
    <PrivateRoute>
      <Layout>{children}</Layout>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            <Routes>
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/"          element={<PrivateLayout><Dashboard /></PrivateLayout>} />
              <Route path="/tasks"     element={<PrivateLayout><Tasks /></PrivateLayout>} />
              <Route path="/projects"  element={<PrivateLayout><Projects /></PrivateLayout>} />
              <Route path="/settings"  element={<PrivateLayout><Settings /></PrivateLayout>} />
              <Route path="/team"      element={<PrivateLayout><Team /></PrivateLayout>} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
