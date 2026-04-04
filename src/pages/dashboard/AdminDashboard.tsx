import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import StatCard from '@/components/shared/StatCard';
import { Users, GraduationCap, CalendarCheck, MessageCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const result = await apiFetch('/admin/analytics');
        setData(result);
      } catch (err) {
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-lg font-medium">Synchronizing institution data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete overview of your institution</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={data.totalStudents} icon={GraduationCap} variant="primary" />
        <StatCard title="Total Teachers" value={data.totalTeachers} icon={Users} variant="accent" />
        <StatCard title="Avg Attendance" value={`${data.avgAttendance}%`} icon={CalendarCheck} variant="success" />
        <StatCard title="Pending Queries" value={data.pendingQueries} icon={MessageCircle} variant="warning" />
        <StatCard title="Active Users" value={data.activeToday} subtitle="Today" icon={TrendingUp} variant="primary" />
        <StatCard title="Low Attendance Alerts" value={data.lowAttendanceAlerts} icon={AlertTriangle} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border shadow-soft p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Department Overview</h2>
          <div className="space-y-3">
            {data.departments.map((d: any) => (
              <div key={d.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.students} students</p>
                </div>
                <span className={`text-sm font-semibold ${d.avgAttendance < 80 ? 'text-destructive' : 'text-success'}`}>
                  {d.avgAttendance}%
                </span>
              </div>
            ))}
            {data.departments.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No department data available</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border shadow-soft p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Recent Queries</h2>
          <div className="space-y-3">
            {data.recentQueries.map((q: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{q.query}</p>
                  <p className="text-xs text-muted-foreground">{q.from}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 capitalize ${
                  q.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}>
                  {q.status}
                </span>
              </div>
            ))}
            {data.recentQueries.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No recent queries</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
