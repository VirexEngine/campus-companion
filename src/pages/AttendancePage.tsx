import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { motion } from 'framer-motion';
import { CalendarCheck, Check, X, Clock, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  rollNo: string;
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const { attendance, subjects: storeSubjects, fetchDashboardData } = useAppStore();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [markingStatus, setMarkingStatus] = useState<Record<string, 'present' | 'absent'>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract subject names from store
  const subjectNames = storeSubjects.map(s => s.subject);

  useEffect(() => {
    if (subjectNames.length > 0 && !selectedSubject) {
      setSelectedSubject(subjectNames[0]);
    }
  }, [subjectNames, selectedSubject]);

  useEffect(() => {
    if (user?.role !== 'student') {
      const fetchStudents = async () => {
        try {
          const data = await apiFetch('/teacher/students');
          setStudents(data.map((s: any) => ({
            id: s.user_id,
            name: s.name,
            rollNo: s.user_id
          })));
        } catch (err) {
          console.error('Failed to fetch students:', err);
        }
      };
      fetchStudents();
    }
  }, [user]);

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent') => {
    if (!selectedSubject) {
      toast.error('Please select a subject first');
      return;
    }

    // Optimistic update
    setMarkingStatus(prev => ({ ...prev, [studentId]: status }));

    try {
      await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          user_id: studentId,
          subject: selectedSubject,
          status: status,
          date: new Date().toISOString().split('T')[0]
        })
      });
      // Refresh global attendance data to reflect in other components
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to save attendance');
      // Revert on error
      setMarkingStatus(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }
  };

  if (user?.role === 'student') {
    const myAttendance = attendance.filter((a) => a.studentId === user.user_id);
    const subjectStats = subjectNames.map((subject) => {
      const records = myAttendance.filter((a) => a.subject === subject);
      const present = records.filter((a) => a.status === 'present' || a.status === 'late').length;
      return { subject, total: records.length, present, percentage: records.length > 0 ? Math.round((present / records.length) * 100) : 0 };
    });

    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Attendance</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjectStats.map((stat) => (
            <motion.div
              key={stat.subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border shadow-soft p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{stat.subject}</h3>
                <span className={`text-lg font-display font-bold ${stat.percentage < 75 ? 'text-destructive' : 'text-success'}`}>
                  {stat.percentage}%
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${stat.percentage < 75 ? 'bg-destructive' : 'bg-success'}`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.present}/{stat.total} classes attended</p>
              {stat.percentage < 75 && (
                <p className="text-xs text-destructive mt-1 font-medium">⚠ Below minimum requirement</p>
              )}
            </motion.div>
          ))}
          {subjectStats.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No subjects assigned to your profile.
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-card rounded-xl border border-border shadow-soft p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Recent Records</h2>
          <div className="space-y-2">
            {myAttendance.slice(0, 8).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {record.status === 'present' ? (
                    <Check size={16} className="text-success" />
                  ) : record.status === 'late' ? (
                    <Clock size={16} className="text-warning" />
                  ) : (
                    <X size={16} className="text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{record.subject}</p>
                    <p className="text-xs text-muted-foreground">{record.date}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  record.status === 'present' ? 'bg-success/10 text-success' :
                  record.status === 'late' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
            {myAttendance.length === 0 && (
              <p className="text-center py-4 text-sm text-muted-foreground">No recent attendance records found.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Teacher/Admin view - Mark attendance
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Mark Attendance</h1>
        <div className="flex items-center gap-2">
          <Users size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{students.length} students logged in</span>
        </div>
      </div>

      {/* Subject selector */}
      <div className="flex gap-2 flex-wrap">
        {subjectNames.map((subject) => (
          <button
            key={subject}
            onClick={() => setSelectedSubject(subject)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSubject === subject
                ? 'gradient-primary text-primary-foreground shadow-glow'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {subject}
          </button>
        ))}
        {subjectNames.length === 0 && (
          <p className="text-sm text-destructive font-medium italic">No subjects specifically assigned to your teacher profile. Please contact Admin.</p>
        )}
      </div>

      {/* Student list */}
      <div className="bg-card rounded-xl border border-border shadow-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <CalendarCheck size={18} className="text-primary" /> {selectedSubject || 'No Subject Selected'}
          </h2>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkAttendance(student.id, 'present')}
                  title="Mark Present"
                  className={`p-2 rounded-lg transition-colors ${
                    markingStatus[student.id] === 'present'
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted hover:bg-success/10 text-muted-foreground hover:text-success'
                  }`}
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => handleMarkAttendance(student.id, 'absent')}
                  title="Mark Absent"
                  className={`p-2 rounded-lg transition-colors ${
                    markingStatus[student.id] === 'absent'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed border-border rounded-lg">
              No active students found. <br />
              <span className="text-xs">Students must log in at least once to appear in the "Real Students" roster.</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <p>Attendance is saved automatically in real-time. ✅</p>
        </div>
      </div>
    </div>
  );
}
