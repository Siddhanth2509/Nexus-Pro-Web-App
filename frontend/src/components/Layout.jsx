import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Settings,
  ChevronLeft, ChevronRight, LogOut, Search, Bell, ChevronDown,
  Shield, User, Sun, Moon, Check, AlertCircle, Info, X
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/' },
  { label: 'Projects',     icon: FolderKanban,    path: '/projects' },
  { label: 'Tasks',        icon: CheckSquare,     path: '/tasks' },
  { label: 'Team Members', icon: Users,           path: '/team', adminOnly: true },
  { label: 'Settings',     icon: Settings,        path: '/settings' },
];

const SAMPLE_NOTIFS = [
  { id: 1, type: 'task',    message: 'New task assigned: "API Integration"',         time: '2 min ago',  read: false },
  { id: 2, type: 'project', message: 'Added to project "Ethara Platform v2"',        time: '1 hour ago', read: false },
  { id: 3, type: 'alert',   message: 'Task "Database Schema" is overdue',            time: '3 hours ago', read: true },
  { id: 4, type: 'info',    message: 'Manager approved your task status update',     time: 'Yesterday',   read: true },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [topUserMenuOpen, setTopUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifs]      = useState(SAMPLE_NOTIFS);
  const [searchQuery, setSearchQuery]   = useState('');

  const { user, logout }     = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate   = useNavigate();
  const location   = useLocation();
  const notifRef   = useRef(null);
  const userRef    = useRef(null);

  const isAdmin     = user?.role === 'admin';
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const close = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Handle top user menu click outside
  const topUserRef = useRef(null);
  useEffect(() => {
    const closeTop = (e) => {
      if (topUserRef.current && !topUserRef.current.contains(e.target)) setTopUserMenuOpen(false);
    };
    document.addEventListener('mousedown', closeTop);
    return () => document.removeEventListener('mousedown', closeTop);
  }, []);

  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ─── Sidebar ─── */}
      <aside
        style={{ width: collapsed ? 64 : 260, flexShrink: 0, transition: 'width 300ms ease' }}
        className="flex flex-col bg-[#0f0f0f] text-white"
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-base whitespace-nowrap">Nexus Pro</span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
          {navItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            const active = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={[
                  'flex items-center gap-3 h-10 px-2 rounded-md text-sm font-medium transition-all duration-150 group relative select-none',
                  active
                    ? 'bg-white/10 text-white border-l-2 border-[#2563eb]'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80 border-l-2 border-transparent',
                ].join(' ')}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-3 relative" ref={userRef}>
          <button
            onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-3 w-full rounded-md hover:bg-white/5 p-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-white/40 truncate">{user?.email || ''}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />
              </>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAdmin
                    ? <><Shield className="w-3 h-3 text-[#8b5cf6]" /><span className="text-xs text-[#8b5cf6]">Admin</span></>
                    : <><User className="w-3 h-3 text-white/40" /><span className="text-xs text-white/40 capitalize">{user?.role || 'Member'}</span></>
                  }
                </div>
              </div>
              <button
                onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center h-14 px-6 border-b border-border bg-card flex-shrink-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-muted border border-transparent rounded-lg focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
            />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#2563eb] hover:underline flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'task'    && <CheckSquare className="w-4 h-4 text-blue-500" />}
                          {n.type === 'project' && <FolderKanban className="w-4 h-4 text-green-500" />}
                          {n.type === 'alert'   && <AlertCircle className="w-4 h-4 text-red-500" />}
                          {n.type === 'info'    && <Info className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar topbar */}
            <div className="relative ml-1" ref={topUserRef}>
              <div
                className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-bold cursor-pointer overflow-hidden"
                onClick={() => { setTopUserMenuOpen(o => !o); setNotifOpen(false); }}
              >
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : initials}
              </div>

              {topUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isAdmin
                        ? <><Shield className="w-3 h-3 text-[#8b5cf6]" /><span className="text-xs text-[#8b5cf6]">Admin</span></>
                        : <><User className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground capitalize">{user?.role || 'Member'}</span></>
                      }
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/settings'); setTopUserMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button
                      onClick={() => { logout(); navigate('/login'); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
