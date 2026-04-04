import { motion } from 'framer-motion';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await apiFetch('/admin/teachers');
        setTeachers(data);
      } catch (err) {
        toast.error('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Manage Teachers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
           <div className="col-span-full py-12 text-center text-muted-foreground italic">Loading teachers...</div>
        ) : teachers.length === 0 ? (
           <div className="col-span-full py-12 text-center text-muted-foreground italic">No teachers found</div>
        ) : (
          teachers.map((teacher, i) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border shadow-soft p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-accent-foreground font-display text-lg font-bold">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{teacher.name}</h3>
                  <p className="text-xs text-muted-foreground">{teacher.department}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {teacher.subjects.map((s: string) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
                ))}
                {teacher.subjects.length === 0 && <span className="text-xs text-muted-foreground italic">No subjects assigned</span>}
              </div>
              <p className="text-xs text-muted-foreground">{teacher.students} students in department</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
