import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', bio: '', job_title: '', password: '' });

  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/users', { headers: authHeaders() });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (id) => {
    if (id === user.id) { toast.error("You cannot delete yourself."); return; }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/users/${id}`, { headers: authHeaders() });
      toast.success('User deleted');
      setUsers(p => p.filter(u => u.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEditClick = (u) => {
    setEditUser(u);
    setFormData({ name: u.name, role: u.role, bio: u.bio || '', job_title: u.job_title || '', password: '' });
  };

  const handleSave = async () => {
    try {
      // Save details & password
      await axios.put(`/api/users/${editUser.id}/details`, {
        name: formData.name,
        bio: formData.bio,
        job_title: formData.job_title,
        password: formData.password || undefined
      }, { headers: authHeaders() });

      // Save role separately
      if (formData.role !== editUser.role) {
        if (editUser.id === user.id) {
          toast.error("You cannot change your own role.");
        } else {
          await axios.patch(`/api/users/${editUser.id}/role`, { role: formData.role }, { headers: authHeaders() });
        }
      }

      toast.success('User updated successfully');
      setEditUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access denied. Admin only.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user roles, details, and access.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Job Title</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.name} {u.id === user.id && '(You)'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' : 'bg-muted text-muted-foreground'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.job_title || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(u)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} disabled={u.id === user.id} className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => e.target === e.currentTarget && setEditUser(null)}>
          <div className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
            <button onClick={() => setEditUser(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit User</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Role</label>
                <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} disabled={editUser.id === user.id}
                  className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                {editUser.id === user.id && <p className="text-xs text-muted-foreground mt-1">You cannot change your own role.</p>}
              </div>

              <div>
                <label className="text-sm font-medium">Job Title</label>
                <input type="text" value={formData.job_title} onChange={e => setFormData(p => ({ ...p, job_title: e.target.value }))}
                  className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div>
                <label className="text-sm font-medium">Reset Password (Optional)</label>
                <input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter new password"
                  className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditUser(null)} className="h-9 px-4 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="h-9 px-4 text-sm font-medium bg-[#2563eb] text-white rounded-lg hover:opacity-90 transition-opacity">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
