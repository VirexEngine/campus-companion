import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: number;
  subject: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

interface Props {
  student: any;
  onClose: () => void;
}

export default function AttendanceManagerModal({ student, onClose }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    fetchRecords();
  }, [student.id]);

  const fetchRecords = async () => {
    try {
      const data = await apiFetch(`/admin/attendance/${student.id}`);
      setRecords(data);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await apiFetch(`/admin/attendance/${recordId}`, { method: 'DELETE' });
      toast.success('Record deleted');
      setRecords(records.filter(r => r.id !== recordId));
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const handleUpdate = async (recordId: number) => {
    try {
      await apiFetch('/admin/attendance/update', {
        method: 'PATCH',
        body: JSON.stringify({ id: recordId, status: newStatus })
      });
      toast.success('Record updated');
      setRecords(records.map(r => r.id === recordId ? { ...r, status: newStatus as any } : r));
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to update record');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Manage Attendance</h2>
            <p className="text-sm text-muted-foreground">{student.name} ({student.rollNo})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground italic">Fetching attendance history...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-border">
              <AlertCircle size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">No records found</p>
              <p className="text-sm text-muted-foreground mt-1">This student has no attendance recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-transparent hover:border-border transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground border border-border">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{record.subject}</p>
                      <p className="text-xs text-muted-foreground">{record.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {editingId === record.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          value={newStatus} 
                          onChange={e => setNewStatus(e.target.value)}
                          className="text-xs bg-background border rounded px-2 py-1 outline-none"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                        <button onClick={() => handleUpdate(record.id)} className="p-1.5 text-success hover:bg-success/10 rounded transition-colors">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          record.status === 'present' ? 'bg-success/10 text-success' :
                          record.status === 'late' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {record.status}
                        </span>
                        <div className="flex gap-1 border-l border-border pl-3 ml-1">
                          <button 
                            onClick={() => {
                              setEditingId(record.id);
                              setNewStatus(record.status);
                            }} 
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
