import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Nexus Pro Dashboard</h1>
      <p className="mb-4 text-muted-foreground">Logged in as: {user?.name} ({user?.role})</p>
      
      <button 
        onClick={handleLogout}
        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg"
      >
        Logout
      </button>

      {/* 3D Parallax Grid and Kanban will be built here */}
    </div>
  );
}
