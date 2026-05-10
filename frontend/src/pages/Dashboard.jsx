import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CheckSquare, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const STATUS_COLORS = {
  todo: '#2563eb', in_progress: '#f59e0b', done: '#22c55e',
};
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_BADGES = {
  todo: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
  done: 'bg-green-50 text-green-700 border border-green-200',
};
const PRIORITY_DOTS = { low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-red-400' };

function StatCard({ icon, iconBg, label, value }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch {
        setStats({
          totalTasks: 0, activeTasks: 0, completedTasks: 0, overdueTasks: 0,
          totalProjects: 0,
          statusBreakdown: { todo: 0, in_progress: 0, done: 0 },
          priorityBreakdown: { high: 0, medium: 0, low: 0 },
          recentTasks: [],
          recentActivity: [],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="space-y-2 mb-8">
          <div className="h-7 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  const donutData = stats ? [
    { name: 'To Do',       value: stats.statusBreakdown?.todo        || 0, color: STATUS_COLORS.todo },
    { name: 'In Progress', value: stats.statusBreakdown?.in_progress || 0, color: STATUS_COLORS.in_progress },
    { name: 'Done',        value: stats.statusBreakdown?.done        || 0, color: STATUS_COLORS.done },
  ].filter(d => d.value > 0) : [];

  const total = stats?.totalTasks || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your projects</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<CheckSquare className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600"   label="Total Tasks"  value={stats?.totalTasks     || 0} />
        <StatCard icon={<Clock        className="w-5 h-5" />} iconBg="bg-amber-100 text-amber-600" label="Active Tasks" value={stats?.activeTasks    || 0} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-green-100 text-green-600" label="Completed"   value={stats?.completedTasks || 0} />
        {(stats?.overdueTasks || 0) > 0 && (
          <StatCard icon={<AlertTriangle className="w-5 h-5" />} iconBg="bg-red-100 text-red-600" label="Overdue" value={stats?.overdueTasks || 0} />
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Distribution */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Task Distribution</h3>
          <div className="flex items-center justify-center gap-6">
            {/* Simple donut using SVG */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                {donutData.length === 0 ? (
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="87.96 0" />
                ) : (() => {
                  let offset = 0;
                  const circ = 2 * Math.PI * 14;
                  return donutData.map((d, i) => {
                    const pct = total > 0 ? d.value / total : 0;
                    const dash = pct * circ;
                    const el = (
                      <circle key={i} cx="18" cy="18" r="14" fill="none"
                        stroke={d.color} strokeWidth="4"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'To Do',       value: stats?.statusBreakdown?.todo        || 0, color: 'bg-blue-500' },
                { label: 'In Progress', value: stats?.statusBreakdown?.in_progress || 0, color: 'bg-amber-500' },
                { label: 'Done',        value: stats?.statusBreakdown?.done        || 0, color: 'bg-green-500' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                  <span className="text-xs text-muted-foreground">{d.label} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Priority Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'High',   value: stats?.priorityBreakdown?.high   || 0, color: '#ef4444' },
              { label: 'Medium', value: stats?.priorityBreakdown?.medium || 0, color: '#f59e0b' },
              { label: 'Low',    value: stats?.priorityBreakdown?.low    || 0, color: '#22c55e' },
            ].map(item => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects summary */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Projects</h3>
            <button onClick={() => navigate('/projects')} className="text-xs text-[#2563eb] hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{stats?.totalProjects || 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Projects</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">
                {total > 0 ? Math.round(((stats?.completedTasks || 0) / total) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="mt-6 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold">Recent Tasks</h3>
          <button onClick={() => navigate('/tasks')} className="text-xs text-[#2563eb] hover:underline flex items-center gap-0.5">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Task</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Project</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Assignee</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {(!stats?.recentTasks || stats.recentTasks.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No tasks yet. Create a project and add your first task.
                  </td>
                </tr>
              )}
              {stats?.recentTasks?.map(task => (
                <tr key={task.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tasks`)}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOTS[task.priority] || 'bg-gray-400'}`} />
                      <span className="text-sm font-medium truncate max-w-[200px]">{task.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{task.projectName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-[10px] font-bold">
                        {task.assigneeName?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm text-muted-foreground">{task.assigneeName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[task.status] || ''}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono ${task.isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
