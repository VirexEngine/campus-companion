import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { motion } from 'framer-motion';
import { Bell, Calendar, AlertTriangle, CheckCircle, Info, MessageCircle, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

const typeIcons: Record<string, any> = {
  event: Calendar,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  query: MessageCircle,
};

const typeStyles: Record<string, string> = {
  event: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  info: 'bg-primary/10 text-primary',
  query: 'bg-accent/10 text-accent',
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { notifications, markNotificationRead } = useAppStore();
  
  const [queryMsg, setQueryMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientType, setRecipientType] = useState<'admin' | 'teacher'>('admin');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [teacherReplyText, setTeacherReplyText] = useState('');

  // Fetch teachers for selection
  useState(() => {
    apiFetch('/teachers').then(setTeachers).catch(console.error);
  });

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryMsg) return;
    if (recipientType === 'teacher' && !selectedTeacherId) {
      toast.error('Please select a teacher');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/queries', {
        method: 'POST',
        body: JSON.stringify({ 
          message: queryMsg,
          receiver_role: recipientType,
          receiver_id: recipientType === 'teacher' ? selectedTeacherId : 'ADMIN-GLOBAL'
        })
      });
      toast.success(`Query submitted to ${recipientType === 'admin' ? 'Administration' : 'Teacher'}!`);
      setQueryMsg('');
    } catch(e) {
      toast.error('Failed to submit query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyQuery = async (queryId: number, text: string) => {
    if (!text.trim()) return;
    try {
      await apiFetch('/queries/reply', {
        method: 'POST',
        body: JSON.stringify({ id: queryId, reply: text })
      });
      toast.success('Reply sent successfully');
      useAppStore.getState().fetchDashboardData();
    } catch(err) {
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell size={24} /> News & Announcements
        </h1>
        <span className="text-sm text-muted-foreground font-medium">
          {notifications.filter((n) => !n.read && n.type !== 'query').length} unread
        </span>
      </div>

      <div className="space-y-3">
        {notifications.filter(n => n.type !== 'query').length === 0 ? (
           <div className="py-12 text-center bg-card rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">You have no system alerts yet.</p>
           </div>
        ) : null}
        
        {notifications.filter(n => n.type !== 'query').map((notif, i) => {
          const type = notif.type || 'info';
          const Icon = typeIcons[type] || Info;
          const style = typeStyles[type] || typeStyles.info;
          
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-4 rounded-xl border shadow-soft cursor-pointer transition-colors ${
                notif.read ? 'bg-card border-border' : 'bg-card border-primary/20 shadow-glow'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${style}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {notif.title || 'System Alert'}
                    </h3>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 font-medium">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-2 opacity-80">{notif.date || notif.createdAt || ''}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
