import { motion } from 'framer-motion';
import { Search, MoreVertical } from 'lucide-react';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AttendanceManagerModal from '@/components/admin/AttendanceManagerModal';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await apiFetch('/admin/students');
      setStudents(data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Manage Students</h1>

      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Roll No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Attendance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">Loading students...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">No students found</td>
                </tr>
              ) : (
                filtered.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.rollNo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.department}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${student.attendance < 75 ? 'text-destructive' : 'text-success'}`}>
                        {student.attendance}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        student.status === 'active' ? 'bg-success/10 text-success' :
                        student.status === 'warning' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                      >
                        Manage Attendance
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <AttendanceManagerModal 
          student={selectedStudent} 
          onClose={() => {
            setSelectedStudent(null);
            fetchStudents(); // Refresh data as % might have changed
          }} 
        />
      )}
    </div>
  );
}
