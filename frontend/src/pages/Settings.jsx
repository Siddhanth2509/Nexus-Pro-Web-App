import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, User, Lock, Bell, Shield, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState('profile');

  const [name, setName]         = useState(user?.name || '');
  const [bio, setBio]           = useState(user?.bio || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [saving, setSaving]     = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await axios.put('/api/auth/profile', { name, bio, job_title: jobTitle }, { headers: authHeaders() });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) { toast.error('Please fill in all fields'); return; }
    if (newPw !== confirmPw)   { toast.error('New passwords do not match'); return; }
    if (newPw.length < 8)      { toast.error('Password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      await axios.put('/api/auth/change-password', { currentPassword: currentPw, newPassword: newPw }, { headers: authHeaders() });
      toast.success('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setPwSaving(false); }
  };

  const tabs = [
    { id: 'profile',  label: 'Profile',  icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifs',   label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <nav className="w-44 flex-shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 w-full h-9 px-3 text-sm rounded-lg transition-colors ${
                tab === t.id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'profile' && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-5">
              <h2 className="text-base font-semibold">Profile Information</h2>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                  </div>
                  {user?.job_title && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{user.job_title}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium">Job Title</label>
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Developer"
                    className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="mt-1.5 w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" value={user?.email || ''} disabled
                    className="mt-1.5 w-full h-9 px-3 text-sm bg-muted border border-input rounded-lg cursor-not-allowed opacity-60" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleSaveProfile} disabled={saving || !name.trim()}
                  className="h-9 px-4 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-5">
              <h2 className="text-base font-semibold">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative mt-1.5">
                    <input type={showCur ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                      className="w-full h-9 pl-3 pr-10 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                    <button type="button" onClick={() => setShowCur(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative mt-1.5">
                    <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                      className="w-full h-9 pl-3 pr-10 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                    <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className="mt-1.5 w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
              </div>
              <button onClick={handleChangePassword} disabled={pwSaving}
                className="h-9 px-4 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}

          {tab === 'notifs' && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-5">
              <h2 className="text-base font-semibold">Notifications</h2>
              {[
                { label: 'Task assigned to me',    desc: 'Get notified when a task is assigned to you' },
                { label: 'Task status updates',    desc: 'Get notified when task status changes' },
                { label: 'Project invitations',    desc: 'Get notified when added to a project' },
                { label: 'Due date reminders',     desc: 'Remind me 24h before a task is due' },
              ].map((n, i) => (
                <div key={i} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                    <div className="w-9 h-5 bg-muted peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:bg-[#2563eb] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
              ))}

              <div className="pt-2 border-t border-border">
                <h3 className="text-sm font-semibold mb-3">Appearance</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                  </div>
                  <button onClick={toggleTheme}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-[#2563eb]' : 'bg-muted'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
