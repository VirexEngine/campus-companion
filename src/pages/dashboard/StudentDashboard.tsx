import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import StatCard from '@/components/shared/StatCard';
import { CalendarCheck, Clock, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { attendance, tasks, timetable, notifications } = useAppStore();

  const totalClasses = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const overallPercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const unreadNotifs = notifications.filter((n) => !n.read && n.type !== 'query').length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = timetable.filter((t) => t.day === today);

  // Subject-wise attendance
  const { subjects } = useAppStore();
  const subjectList = subjects.map(s => s.subject);
  
  const subjectStats = subjectList.map((subject) => {
    const subRecords = attendance.filter((a) => a.subject === subject);
    const present = subRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
    return { subject, total: subRecords.length, present, percentage: subRecords.length > 0 ? Math.round((present / subRecords.length) * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Attendance" value={`${overallPercentage}%`} icon={CalendarCheck} variant={overallPercentage < 75 ? 'warning' : 'success'} />
        <StatCard title="Today's Classes" value={todayClasses.length} subtitle={today} icon={Clock} variant="primary" />
        <StatCard title="Pending Tasks" value={pendingTasks} icon={AlertTriangle} variant={pendingTasks > 2 ? 'warning' : 'default'} />
        <StatCard title="Unread Alerts" value={unreadNotifs} icon={CheckCircle} variant="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border shadow-soft p-5">
          <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary" /> Today's Schedule
          </h2>
          {todayClasses.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No classes today 🎉</p>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-muted-foreground">{cls.startTime}</p>
                    <p className="text-xs text-muted-foreground">{cls.endTime}</p>
                  </div>
                  <div className="h-10 w-0.5 bg-primary rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{cls.subject}</p>
                    <p className="text-xs text-muted-foreground">{cls.teacher} • {cls.room}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Subject Attendance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border shadow-soft p-5">
          <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" /> Subject Attendance
          </h2>
          <div className="space-y-3">
            {subjectStats.map((stat) => (
              <div key={stat.subject} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{stat.subject}</span>
                  <span className={`font-semibold ${stat.percentage < 75 ? 'text-destructive' : 'text-success'}`}>
                    {stat.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-full rounded-full ${stat.percentage < 75 ? 'bg-destructive' : 'bg-success'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
