import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PROJECT_COLORS = {
  blue:   { bar: 'bg-blue-500',   banner: 'bg-blue-500' },
  green:  { bar: 'bg-green-500',  banner: 'bg-green-500' },
  purple: { bar: 'bg-purple-500', banner: 'bg-purple-500' },
  amber:  { bar: 'bg-amber-500',  banner: 'bg-amber-500' },
  red:    { bar: 'bg-red-500',    banner: 'bg-red-500' },
  teal:   { bar: 'bg-teal-500',   banner: 'bg-teal-500' },
};
const COLOR_OPTIONS = ['blue', 'green', 'purple', 'amber', 'red', 'teal'];

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [formData, setFormData]     = useState({ name: '', description: '', color: 'blue' });
  const [formError, setFormError]   = useState('');

  const load = async () => {
    try {
      const res = await axios.get('/api/projects', { headers: authHeaders() });
      setProjects(res.data.projects || res.data || []);
    } catch { setProjects([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) { setFormError('Project name is required'); return; }
    setCreating(true);
    try {
      await axios.post('/api/projects', formData, { headers: authHeaders() });
      toast.success('Project created!');
      setShowCreate(false);
      setFormData({ name: '', description: '', color: 'blue' });
      setFormError('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setCreating(false); }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-muted rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first project to start organizing tasks and collaborating with your team
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      )}

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const colors   = PROJECT_COLORS[project.color] || PROJECT_COLORS.blue;
          const taskCount = project.taskCount  || 0;
          const doneCount = project.doneCount  || 0;
          const progress  = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;
          return (
            <div
              key={project.id}
              className="group bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className={`h-2 ${colors.banner}`} />
              <div className="p-5">
                <h3 className="text-base font-semibold text-foreground group-hover:text-[#2563eb] transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="mt-4">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${colors.bar} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{taskCount} tasks</span>
                    <span>·</span>
                    <span>{doneCount} done</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {project.memberCount || 0}
                    </span>
                  </div>
                  {project.members?.length > 0 && (
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map((m, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-[#2563eb] border-2 border-card flex items-center justify-center text-white text-[10px] font-bold">
                          {m.name?.charAt(0) || '?'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-card dark:bg-[#1a1a1a] border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Create New Project</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Start a new project to organize your team's work</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); setFormError(''); }}
                  placeholder="e.g., Website Redesign"
                  maxLength={100}
                  className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of the project..."
                  rows={3}
                  maxLength={500}
                  className="mt-1.5 w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 mt-1.5">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(p => ({ ...p, color }))}
                      className={`w-8 h-8 rounded-full ${PROJECT_COLORS[color].bar} transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="h-9 px-4 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating} className="h-9 px-4 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
