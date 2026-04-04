import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'event' | 'query';
  read: boolean;
  createdAt?: string;
  date?: string;
  query_id?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface AttendanceRecord {
  id: string;
  subject: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  studentId: string;
  studentName: string;
}

export interface TimetableEntry {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  user_id: string;
}

interface AppState {
  notifications: Notification[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  timetable: TimetableEntry[];
  subjects: {id: number, user_id: string, subject: string}[];
  sidebarOpen: boolean;
  isQuizActive: boolean;
  setQuizActive: (active: boolean) => void;
  toggleSidebar: () => void;
  markNotificationRead: (id: string) => void;
  toggleTask: (id: string) => void;
  fetchDashboardData: () => Promise<void>;
  clearData: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isQuizActive: false,
  setQuizActive: (active) => set({ isQuizActive: active }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  notifications: [],
  tasks: [],
  attendance: [],
  timetable: [],
  subjects: [],

  fetchDashboardData: async () => {
    try {
      const { apiFetch } = await import('@/lib/api');
      const [notificationsData, tasks, attendance, timetable, subjects] = await Promise.all([
        apiFetch('/notifications'),
        apiFetch('/tasks'),
        apiFetch('/attendance'),
        apiFetch('/timetable'),
        apiFetch('/subjects'),
      ]);
      
      // Map backend is_read to frontend read
      const notifications = notificationsData.map((n: any) => ({
        ...n,
        read: !!n.is_read
      }));

      set({ notifications, tasks, attendance, timetable, subjects });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  },

  clearData: () => set({ notifications: [], tasks: [], attendance: [], timetable: [] }),

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)),
    })),

  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    })),
}));
