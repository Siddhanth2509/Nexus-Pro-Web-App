import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MoreVertical, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for Kanban board to show UI even if backend empty
    setTasks([
      { id: 1, title: 'Design System', status: 'todo', priority: 'high', due_date: '2026-05-15' },
      { id: 2, title: 'API Integration', status: 'in_progress', priority: 'urgent', due_date: '2026-05-12' },
      { id: 3, title: 'User Testing', status: 'in_review', priority: 'medium', due_date: '2026-05-20' },
      { id: 4, title: 'Database Schema', status: 'done', priority: 'high', due_date: '2026-05-10' },
    ]);
    
    // Attempt real fetch
    axios.get('/api/tasks', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setTasks(res.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'in_review', title: 'In Review', color: 'bg-yellow-500' },
    { id: 'done', title: 'Done', color: 'bg-green-500' }
  ];

  const getPriorityColor = (p) => {
    switch(p) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Task Board</h1>
          <p className="text-muted-foreground">Manage your workflow</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-nexus-gold hover:bg-yellow-500 text-black font-medium rounded-xl transition-colors shadow-lg shadow-nexus-gold/20">
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map(col => (
          <div key={col.id} className="min-w-[300px] w-[300px] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${col.color}`} />
                <h3 className="font-semibold">{col.title}</h3>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              <button className="p-1 hover:bg-white/10 rounded"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
            </div>

            <div className="flex-1 glass-panel rounded-2xl p-3 flex flex-col gap-3 min-h-[500px]">
              <AnimatePresence>
                {tasks.filter(t => t.status === col.id).map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-background/80 border border-white/5 p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing x-ray-hover overflow-hidden relative group"
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded">
                        <MoreVertical className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <h4 className="font-medium text-sm mb-3 relative z-10">{task.title}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground relative z-10">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-background shadow-sm" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
