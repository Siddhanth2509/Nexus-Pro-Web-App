import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ParallaxGrid from '../components/ParallaxGrid';
import { Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fallback mock data if backend isn't fully ready
        let data = {
          stats: { projectCount: 5, myTasks: 12, overdueTasks: 2, urgentTasks: 3 },
          recentActivity: [
            { id: 1, action: 'completed', entity: 'task', meta: 'Design System', created_at: new Date().toISOString() },
            { id: 2, action: 'created', entity: 'project', meta: 'Nexus Pro', created_at: new Date(Date.now() - 86400000).toISOString() }
          ]
        };
        try {
          const res = await axios.get('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } });
          data = res.data;
        } catch(e) {
          console.warn('Using fallback data for dashboard', e);
        }
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4">Loading stats...</div>;

  const statCards = [
    { title: 'Total Projects', value: stats.stats.projectCount, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'My Tasks', value: stats.stats.myTasks, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Urgent Tasks', value: stats.stats.urgentTasks, icon: AlertCircle, color: 'text-nexus-gold', bg: 'bg-nexus-gold/10' },
    { title: 'Overdue', value: stats.stats.overdueTasks, icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif mb-2">Command Center</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}. Here's your overview.</p>
      </div>

      {/* 3D Parallax Grid for Stats */}
      <ParallaxGrid>
        {statCards.map((stat, i) => (
          <div 
            key={i}
            className="parallax-card glass-panel p-6 rounded-2xl flex items-center justify-between transition-transform duration-200 ease-out x-ray-hover"
          >
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
              <h3 className="text-4xl font-bold">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </ParallaxGrid>

      {/* Two column layout for charts/activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl x-ray-hover">
          <h3 className="text-xl font-bold font-serif mb-6">Task Progress</h3>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {/* Simple CSS Bar Chart Mockup */}
            {[40, 70, 45, 90, 60, 80, 50].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group">
                <div className="w-full bg-white/5 rounded-t-md relative h-full flex items-end">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="w-full bg-gradient-to-t from-nexus-gold/50 to-nexus-gold rounded-t-md group-hover:brightness-125 transition-all"
                  ></motion.div>
                </div>
                <span className="text-xs text-muted-foreground">Day {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col x-ray-hover">
          <h3 className="text-xl font-bold font-serif mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-auto space-y-4 pr-2">
            {stats.recentActivity?.map((activity, i) => (
              <div key={activity.id} className="flex gap-4 items-start relative">
                {i !== stats.recentActivity.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-border" />
                )}
                <div className="w-6 h-6 rounded-full bg-nexus-gold/20 flex items-center justify-center shrink-0 mt-1 border border-nexus-gold/50">
                  <div className="w-2 h-2 rounded-full bg-nexus-gold" />
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{activity.user_name || 'System'}</span> 
                    {' '}{activity.action.replace('_', ' ')}{' '}
                    <span className="font-medium">{activity.entity}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
