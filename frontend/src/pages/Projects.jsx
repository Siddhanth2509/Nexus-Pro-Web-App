import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Users, LayoutList } from 'lucide-react';
import ParallaxGrid from '../components/ParallaxGrid';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Mock data for UI presentation
    setProjects([
      { id: 1, name: 'Nexus Pro Rewrite', description: 'Rebuilding the core platform from scratch using modern tech.', status: 'active', member_count: 5 },
      { id: 2, API: 'Integration', description: 'Connecting third party services via REST and GraphQL', status: 'on_hold', member_count: 2 },
    ]);

    axios.get('/api/projects', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setProjects(res.data.projects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'on_hold': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Projects</h1>
          <p className="text-muted-foreground">Manage your team's initiatives</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button className="flex items-center gap-2 px-4 py-2 bg-nexus-gold hover:bg-yellow-500 text-black font-medium rounded-xl transition-colors shadow-lg shadow-nexus-gold/20">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pb-8">
        <ParallaxGrid>
          {projects.map(project => (
            <div key={project.id} className="parallax-card glass-panel rounded-2xl p-6 flex flex-col x-ray-hover">
              <div className="flex justify-between items-start mb-4">
                <div className={`text-xs px-2 py-1 rounded border capitalize ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </div>
                <button className="p-1 hover:bg-white/10 rounded"><LayoutList className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{project.name || project.API}</h3>
              <p className="text-sm text-muted-foreground flex-1 line-clamp-2 mb-6">
                {project.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{project.member_count} members</span>
                </div>
                <button className="text-nexus-gold text-sm font-medium hover:underline">
                  View Board →
                </button>
              </div>
            </div>
          ))}
        </ParallaxGrid>
      </div>
    </div>
  );
}
