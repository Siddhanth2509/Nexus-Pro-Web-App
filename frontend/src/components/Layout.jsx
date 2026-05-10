import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Settings,
  ChevronLeft, ChevronRight, LogOut, Search, Bell, ChevronDown,
  Shield, User, Sun, Moon, X, Check, AlertCircle, Info
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/' },
  { label: 'Projects',     icon: FolderKanban,    path: '/projects' },
  { label: 'Tasks',        icon: CheckSquare,     path: '/tasks' },
  { label: 'Team Members', icon: Users,           path: '/team', adminOnly: true },
  { label: 'Settings',     icon: Settings,        path: '/settings' },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'task',    message: 'New task assigned to you: "API Integration"',  time: '2 min ago',  read: false },
  { id: 2, type: 'project', message: 'You were added to project "Ethara Platform v2"', time: '1 hour ago', read: false },
  { id: 3, type: 'alert',   message: 'Task "Database Schema" is overdue',             time: '3 hours ago', read: true },
  { id: 4, type: 'info',    message: 'Manager approved your task status update',      time: 'Yesterday',  read: true },
];

function NotifIcon({ type }) {
  if (type === 'task')    return <CheckSquare className="w-4 h-4 text-blue-400" />;
  if (type === 'project') return <FolderKanban className="w-4 h-4 text-green-400" />;
  if (type === 'alert')   return <AlertCircle className="w-4 h-4 text-red-400" />;
  return <Info className="w-4 h-4 text-gray-400" />;
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifs]      = useState(MOCK_NOTIFICATIONS);
  const [searchQuery, setSearchQuery]   = useState('');

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const notifRef  = useRef(null);
  const userRef   = useRef(null);

  const isAdmin    = user?.role === 'admin';
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-background overflow-hidden transition-colors duration-300">

      {/* ─── Sidebar ─── */}
      <aside
        className="flex flex-col bg-[#0f0f0f] text-white transition-all duration-300 ease-out flex-shrink-0 select-none relative z-20"
        style={{ width: collapsed ? 64 : 260 }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-nexus-gold rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.4)]">
              <CheckSquare className="w-4 h-4 text-black" />
            </div>
            {!collapsed && (
              <span className="font-bold text-base tracking-tight whitespace-nowrap text-white">
                Nexus Pro
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 h-10 px-2 rounded-md text-sm font-medium transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-white/10 text-white border-l-2 border-nexus-gold'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80 border-l-2 border-transparent'
                  }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                {/* Tooltip on collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-3" ref={userRef}>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 w-full rounded-md hover:bg-white/5 p-1.5 transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-nexus-gold to-yellow-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0 overflow-hidden">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : user?.name?.charAt(0)?.toUpperCase() || 'U'
                }
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-white/40 truncate">{user?.email || ''}</p>
                </div>
              )}
              {!collapsed && <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />}
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                <div className="px-3 py-2.5 border-b border-white/10">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isAdmin
                      ? <><Shield className="w-3 h-3 text-nexus-gold" /><span className="text-xs text-nexus-gold">Admin</span></>
                      : <><User className="w-3 h-3 text-white/40" /><span className="text-xs text-white/40 capitalize">{user?.role}</span></>
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
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="flex items-center h-14 px-6 border-b border-border bg-card flex-shrink-0">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-muted border border-transparent rounded-lg focus:outline-none focus:border-nexus-gold/50 focus:ring-1 focus:ring-nexus-gold/30 transition-all placeholder:text-muted-foreground"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-nexus-gold hover:underline flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markRead(notif.id)}
                          className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-nexus-gold/5' : ''}`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            <NotifIcon type={notif.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug ${!notif.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-nexus-gold mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-border">
                    <button className="text-xs text-nexus-gold hover:underline w-full text-center">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar in topbar */}
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-nexus-gold to-yellow-600 flex items-center justify-center text-black font-bold text-sm cursor-pointer overflow-hidden"
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : user?.name?.charAt(0)?.toUpperCase() || 'U'
              }
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
