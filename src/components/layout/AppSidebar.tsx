import { useAuthStore, UserRole } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CalendarCheck, Clock, MessageCircle, Bell, User, Settings,
  Users, FileText, BarChart3, LogOut, ChevronLeft, GraduationCap, Menu,
  BrainCircuit, Trophy, FolderLock
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['student', 'teacher', 'admin'] },
  { label: 'Attendance', icon: <CalendarCheck size={20} />, path: '/attendance', roles: ['student', 'teacher'] },
  { label: 'Timetable', icon: <Clock size={20} />, path: '/timetable', roles: ['student', 'teacher'] },
  { label: 'AI Assistant', icon: <MessageCircle size={20} />, path: '/chatbot', roles: ['student', 'teacher', 'admin'] },
  { label: 'AI Quizzes', icon: <BrainCircuit size={20} />, path: '/quizzes', roles: ['student', 'teacher', 'admin'] },
  { label: 'Leaderboard', icon: <Trophy size={20} />, path: '/leaderboard', roles: ['student', 'teacher', 'admin'] },
  { label: 'Notifications', icon: <Bell size={20} />, path: '/notifications', roles: ['student', 'teacher', 'admin'] },
  { label: 'Queries', icon: <FileText size={20} />, path: '/queries', roles: ['student', 'teacher', 'admin'] },
  { label: 'Document Vault', icon: <FolderLock size={20} />, path: '/documents', roles: ['student', 'teacher', 'admin'] },
  { label: 'Profile', icon: <User size={20} />, path: '/profile', roles: ['student', 'teacher', 'admin'] },
  { label: 'Manage Students', icon: <Users size={20} />, path: '/admin/students', roles: ['admin'] },
  { label: 'Manage Teachers', icon: <Users size={20} />, path: '/admin/teachers', roles: ['admin'] },
  { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/admin/analytics', roles: ['admin'] },
  { label: 'Admin Settings', icon: <Settings size={20} />, path: '/admin', roles: ['admin'] },
];

export default function AppSidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, notifications, isQuizActive } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const unreadBroadcasts = notifications.filter(n => !n.read && n.type !== 'query').length;

  const filteredItems = navItems.filter((item) => {
    if (isQuizActive && item.label === 'AI Assistant') return false;
    return item.roles.includes(user.role);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card shadow-soft border border-border"
      >
        <div className="relative">
          <Menu size={20} />
          {unreadBroadcasts > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
          )}
        </div>
      </button>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        className={`fixed left-0 top-0 h-screen bg-sidebar z-50 flex flex-col border-r border-sidebar-border transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-primary-foreground" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-display font-bold text-sidebar-foreground text-lg whitespace-nowrap overflow-hidden"
              >
                CampusHub
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={toggleSidebar}
            className="ml-auto hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 transition-colors"
          >
            <ChevronLeft size={16} className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isNotifications = item.label === 'Notifications';
            const count = isNotifications ? unreadBroadcasts : 0;

            return (
              <button
                key={item.path}
                onClick={() => {
                   navigate(item.path);
                   if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {count > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-sidebar" />
                  )}
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-between min-w-0"
                    >
                      <span className="whitespace-nowrap">{item.label}</span>
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isActive ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                          {count}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors mt-1"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
