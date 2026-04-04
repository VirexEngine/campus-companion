import { useState, useEffect } from 'react';
import StatCard from '@/components/shared/StatCard';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Users, CalendarCheck, BookOpen, Megaphone, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const { subjects } = useAppStore();
  const [students, setStudents] = useState<any[]>([]);
  
  const [attStudentId, setAttStudentId] = useState('');
  const [attSubject, setAttSubject] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState('present');

  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await apiFetch('/teacher/students');
      setStudents(data);
    } catch(e) {
      toast.error('Failed to load students list');
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attStudentId || !attSubject) return toast.error('Please select student and subject');
    try {
      await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({ user_id: attStudentId, subject: attSubject, date: attDate, status: attStatus })
      });
      toast.success('Attendance recorded successfully');
    } catch(e) {
      toast.error('Failed to record attendance');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    try {
      await apiFetch('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ message: broadcastMsg, type: 'info' })
      });
      toast.success('Broadcast sent to all users');
      setBroadcastMsg('');
    } catch (err) {
      toast.error('Broadcast failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your classes, students, and announcements.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} variant="primary" />
        <StatCard 
          title={subjects.length === 1 ? "My Subject" : "My Subjects"} 
          value={subjects.length === 1 ? subjects[0].subject : subjects.length} 
          icon={BookOpen} 
          variant="accent" 
        />
        <StatCard title="Quick Options" value="3 Actions" icon={CheckCircle} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Tool */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border shadow-soft p-5">
          <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <CalendarCheck size={18} className="text-primary"/> Record Attendance
          </h2>
          <form onSubmit={handleAttendanceSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Student</label>
              <select value={attStudentId} onChange={e => setAttStudentId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background" required>
                <option value="">Select a student...</option>
                {students.map(s => <option key={s.user_id} value={s.user_id}>{s.name} ({s.user_id}) - {s.department}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <select 
                value={attSubject || (subjects.length === 1 ? subjects[0].subject : '')} 
                onChange={e => setAttSubject(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg bg-background" 
                required
              >
                {subjects.length !== 1 && <option value="">Select your subject...</option>}
                {subjects.map(s => <option key={s.id} value={s.subject}>{s.subject}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select value={attStatus} onChange={e => setAttStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background" required>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-lg mt-2 font-medium">Record Attendance</button>
          </form>
        </motion.div>

        {/* Global Broadcast */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border shadow-soft p-5">
          <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Megaphone size={18} className="text-primary"/> Global Announcement
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Send a notification that will appear to all students instantly.</p>
          <form onSubmit={handleBroadcast} className="space-y-4">
             <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <textarea 
                  rows={4} 
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background resize-none" 
                  placeholder="e.g. Tomorrow's Maths class is cancelled."
                  required
                />
             </div>
             <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium">Broadcast Message</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
