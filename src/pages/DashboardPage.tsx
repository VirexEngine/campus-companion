import { useAuthStore } from '@/store/authStore';
import StudentDashboard from './dashboard/StudentDashboard';
import TeacherDashboard from './dashboard/TeacherDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  return <StudentDashboard />;
}
