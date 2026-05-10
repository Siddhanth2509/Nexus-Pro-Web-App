import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Pencil, Trash2, X, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';

const STATUS_BADGES = {
  todo:        'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
  done:        'bg-green-50 text-green-700 border border-green-200',
};
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_DOTS = { low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-red-400' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const DEFAULT_FORM = {
  title: '', description: '', status: 'todo', priority: 'medium',
  projectId: '', assigneeId: '', dueDate: '',
};

function Select({ value, onChange, options, placeholder, className = '' }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`h-8 px-3 pr-8 text-sm bg-card border border-border rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function TaskModal({ open, onClose, title, form, setForm, projects, members, onSubmit, loading, submitLabel, lockProject }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card dark:bg-[#1a1a1a] border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Task Title <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Design landing page" maxLength={200}
              className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional details..." rows={2}
              className="mt-1.5 w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Project <span className="text-red-500">*</span></label>
              <div className="relative mt-1.5">
                <select value={form.projectId} disabled={lockProject} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}
                  className="w-full h-9 px-3 pr-8 text-sm bg-background border border-input rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60">
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Assignee</label>
              <div className="relative mt-1.5">
                <select value={form.assigneeId} onChange={e => setForm(p => ({ ...p, assigneeId: e.target.value }))}
                  className="w-full h-9 px-3 pr-8 text-sm bg-background border border-input rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="relative mt-1.5">
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full h-9 px-3 pr-8 text-sm bg-background border border-input rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <div className="relative mt-1.5">
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full h-9 px-3 pr-8 text-sm bg-background border border-input rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="h-9 px-4 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button onClick={onSubmit} disabled={loading || !form.title.trim() || !form.projectId}
            className="h-9 px-4 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [members, setMembers]   = useState([]);

  const [filters, setFilters] = useState({ search: '', status: '', priority: '', projectId: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit]     = useState(null); // task object
  const [showDelete, setShowDelete] = useState(null); // task id
  const [form, setForm]             = useState({ ...DEFAULT_FORM });
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search)    params.search     = filters.search;
      if (filters.status)    params.status     = filters.status;
      if (filters.priority)  params.priority   = filters.priority;
      if (filters.projectId) params.project_id = filters.projectId;
      const res = await axios.get('/api/tasks', { headers: authHeaders(), params });
      // Normalize enriched task fields for display
      const raw = res.data.tasks || res.data || [];
      const normalized = raw.map(t => ({
        ...t,
        projectName:   t.project?.name   || '',
        assigneeName:  t.assignee?.name  || '',
        assigneeAvatar: t.assignee?.avatar || '',
        projectId:  t.project_id,
        assigneeId: t.assignee_id,
        dueDate:    t.due_date,
      }));
      setTasks(normalized);
      setTotal(res.data.total || normalized.length);
    } catch { setTasks([]); }
    finally  { setLoading(false); }
  };

  const loadMeta = async () => {
    try {
      const [pr, mr] = await Promise.all([
        axios.get('/api/projects', { headers: authHeaders() }),
        axios.get('/api/users', { headers: authHeaders() }),
      ]);
      setProjects(pr.data.projects || pr.data || []);
      setMembers(mr.data.users || mr.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [filters]);
  useEffect(() => { loadMeta(); }, []);

  const openCreate = () => { setForm({ ...DEFAULT_FORM }); setShowCreate(true); };
  const openEdit   = (task) => {
    setForm({
      title: task.title, description: task.description || '',
      status: task.status, priority: task.priority,
      projectId: String(task.project_id || task.projectId || ''),
      assigneeId: String(task.assignee_id || task.assigneeId || ''),
      dueDate: task.due_date || task.dueDate
        ? new Date(task.due_date || task.dueDate).toISOString().slice(0, 10)
        : '',
    });
    setShowEdit(task);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await axios.post('/api/tasks', {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        project_id: Number(form.projectId),
        assignee_id: form.assigneeId ? Number(form.assigneeId) : undefined,
        due_date: form.dueDate || undefined,
      }, { headers: authHeaders() });
      toast.success('Task created!');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create task'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!showEdit) return;
    setSaving(true);
    try {
      await axios.put(`/api/tasks/${showEdit.id}`, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        assignee_id: form.assigneeId ? Number(form.assigneeId) : null,
        due_date: form.dueDate || null,
      }, { headers: authHeaders() });
      toast.success('Task updated!');
      setShowEdit(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update task'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/tasks/${showDelete}`, { headers: authHeaders() });
      toast.success('Task deleted');
      setShowDelete(null);
      load();
    } catch { toast.error('Failed to delete task'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} task{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg border border-border/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            placeholder="Search tasks..." className="w-full h-8 pl-9 pr-3 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <Select value={filters.status} onChange={v => setFilters(p => ({ ...p, status: v }))} placeholder="All Status"
          options={[{ value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }]} />
        <Select value={filters.priority} onChange={v => setFilters(p => ({ ...p, priority: v }))} placeholder="All Priority"
          options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        <Select value={filters.projectId} onChange={v => setFilters(p => ({ ...p, projectId: v }))} placeholder="All Projects"
          options={projects.map(p => ({ value: String(p.id), label: p.name }))} />
        <button onClick={() => setFilters({ search: '', status: '', priority: '', projectId: '' })}
          className="inline-flex items-center gap-1 h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-card transition-colors">
          <Filter className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 w-8">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Task</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Project</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Assignee</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Due Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">Loading...</td></tr>
              )}
              {!loading && tasks.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">
                  No tasks found. {!filters.status && !filters.priority && !filters.search && 'Create your first task.'}
                </td></tr>
              )}
              {tasks.map(task => {
                const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
                return (
                  <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-3"><input type="checkbox" className="rounded" /></td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{task.title}</span>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{task.projectName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
                          {task.assigneeName?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-muted-foreground">{task.assigneeName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[task.status] || ''}`}>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[task.priority] || 'bg-gray-400'}`} />
                        <span className="text-sm text-muted-foreground">{PRIORITY_LABELS[task.priority] || task.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setShowDelete(task.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TaskModal open={showCreate} onClose={() => setShowCreate(false)} title="New Task"
        form={form} setForm={setForm} projects={projects} members={members}
        onSubmit={handleCreate} loading={saving} submitLabel="Create Task" />

      <TaskModal open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Task"
        form={form} setForm={setForm} projects={projects} members={members}
        onSubmit={handleUpdate} loading={saving} submitLabel="Save Changes" lockProject />

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => e.target === e.currentTarget && setShowDelete(null)}>
          <div className="bg-card dark:bg-[#1a1a1a] border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 relative">
            <h2 className="text-lg font-semibold mb-1">Delete Task</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(null)} className="h-9 px-4 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="h-9 px-4 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
