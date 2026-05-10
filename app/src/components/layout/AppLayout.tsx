import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Shield,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Team Members", icon: Users, path: "/team", adminOnly: true },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside
        className="flex flex-col bg-[#0f0f0f] text-[#fafafa] transition-all duration-300 ease-out flex-shrink-0 select-none"
        style={{ width: collapsed ? 64 : 260 }}
      >
        {/* Logo area */}
        <div className="flex items-center h-14 px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-base tracking-tight whitespace-nowrap">
                TaskFlow
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
            style={{ marginLeft: collapsed ? "auto" : undefined }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 h-10 px-2 rounded-md text-sm font-medium transition-all duration-150 group relative
                  ${isActive
                    ? "bg-white/10 text-white border-l-2 border-[#2563eb]"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80 border-l-2 border-transparent"
                  }
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 w-full rounded-md hover:bg-white/5 p-1.5 transition-colors"
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={user?.avatar || ""} />
                <AvatarFallback className="bg-[#2563eb] text-white text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-white/40 truncate">{user?.email || ""}</p>
                </div>
              )}
              {!collapsed && <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />}
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 z-50">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isAdmin ? (
                      <>
                        <Shield className="w-3 h-3 text-[#8b5cf6]" />
                        <span className="text-xs text-[#8b5cf6]">Admin</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-white/40" />
                        <span className="text-xs text-white/40">Member</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center h-14 px-6 border-b border-border bg-card flex-shrink-0">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-muted border border-transparent rounded-lg focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Avatar */}
            <Avatar className="w-8 h-8 cursor-pointer" onClick={() => setUserMenuOpen(true)}>
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
