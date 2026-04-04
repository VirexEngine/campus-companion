import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, User, Bell, Search, Filter } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

export default function QueriesPage() {
  const { user } = useAuthStore();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // For students to send queries
  const [queryMsg, setQueryMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientRole, setRecipientRole] = useState<'admin' | 'teacher'>('admin');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQueries();
    if (user?.role === 'student' || user?.role === 'teacher') {
       fetchRecipientOptions();
    }
  }, [user]);

  const fetchRecipientOptions = async () => {
    try {
      const data = await apiFetch('/teachers');
      setTeachers(data);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const fetchQueries = async () => {
    try {
      setLoading(true);
      let endpoint = '/queries'; // Student sees their own
      if (user?.role === 'teacher') endpoint = '/teacher/queries';
      if (user?.role === 'admin') endpoint = '/admin/queries';
      
      const data = await apiFetch(endpoint);
      setQueries(data);
      
      // Auto-refresh sidebar counts
      useAppStore.getState().fetchDashboardData();
    } catch (err) {
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryMsg.trim()) return;
    if (recipientRole === 'teacher' && !selectedTeacherId) {
      toast.error('Please select a teacher');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/queries', {
        method: 'POST',
        body: JSON.stringify({ 
          message: queryMsg,
          receiver_role: recipientRole,
          receiver_id: recipientRole === 'teacher' ? selectedTeacherId : 'ADMIN-GLOBAL'
        })
      });
      toast.success(`Query sent to ${recipientRole === 'admin' ? 'Administration' : 'Teacher'}!`);
      setQueryMsg('');
      setShowForm(false);
      fetchQueries();
    } catch(e) {
      toast.error('Failed to send query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (queryId: number) => {
    if (!replyText.trim()) return;
    try {
      await apiFetch('/queries/reply', {
        method: 'POST',
        body: JSON.stringify({ id: queryId, reply: replyText })
      });
      toast.success('Reply sent successfully');
      setReplyText('');
      setReplyingToId(null);
      fetchQueries();
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const handleDeleteQuery = async (queryId: number) => {
    if (!confirm('Are you sure you want to delete this query? This will also remove related notifications.')) return;
    try {
      await apiFetch(`/queries/${queryId}`, { method: 'DELETE' });
      toast.success('Query deleted');
      fetchQueries();
    } catch (err) {
      toast.error('Failed to delete query');
    }
  };

  const markRead = async (queryId: number) => {
    try {
      const q = queries.find(curr => curr.id === queryId);
      const msgFragment = q?.question?.substring(0, 15);
      
      // 1. Local update for instant feedback
      const store = useAppStore.getState();
      const relevantNotifs = store.notifications.filter(n => 
        (String(n.query_id) === String(queryId) || (msgFragment && n.message.includes(msgFragment))) && !n.read
      );
      
      relevantNotifs.forEach(n => store.markNotificationRead(n.id));

      // 2. Backend update
      await apiFetch(`/queries/read/${queryId}`, { method: 'POST' });
      
      // 3. Optional: Sync backend state
      // await store.fetchDashboardData();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleClearAllNotifs = async () => {
    try {
      await apiFetch('/notifications/clear-queries', { method: 'POST' });
      toast.success('All query alerts marked as seen');
      useAppStore.getState().fetchDashboardData();
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle size={28} className="text-primary" /> Queries & Support
        </h1>
        <div className="flex items-center gap-2">
           {(user?.role === 'student' || user?.role === 'teacher') && (
             <button 
                onClick={() => setShowForm(!showForm)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showForm ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground shadow-glow hover:opacity-90'}`}
             >
                {showForm ? 'Cancel' : <><Send size={16} /> Ask Question</>}
             </button>
           )}
           <button 
              onClick={fetchQueries}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Refresh"
           >
              <Search size={20} />
           </button>
        </div>
      </div>

      {/* Collapsible Ask a Query form */}
      {(user?.role === 'student' || user?.role === 'teacher') && showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card rounded-2xl border border-border shadow-soft p-6 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
             <Send size={18} className="text-primary" /> Send New Message
          </h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
             <div className="flex bg-muted p-1 rounded-xl">
                <button 
                  onClick={() => setRecipientRole('admin')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${recipientRole === 'admin' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  ADMINISTRATION
                </button>
                <button 
                  onClick={() => setRecipientRole('teacher')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${recipientRole === 'teacher' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  TEACHER
                </button>
             </div>

             {recipientRole === 'teacher' && (
               <select 
                 value={selectedTeacherId}
                 onChange={e => setSelectedTeacherId(e.target.value)}
                 className="px-4 py-1.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none hover:border-primary/30 transition-colors"
                 required
               >
                 <option value="">Select recipient...</option>
                 {teachers.map(t => (
                   <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                 ))}
               </select>
             )}
          </div>

          <form onSubmit={handleSubmitQuery} className="flex gap-3">
             <input 
               type="text"
               value={queryMsg}
               onChange={e => setQueryMsg(e.target.value)}
               placeholder="Type your message here..."
               className="flex-1 px-4 py-2.5 border rounded-xl bg-background focus:ring-2 focus:ring-primary/50 text-sm outline-none transition-all"
               required
             />
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-glow"
             >
                <Send size={16} /> Send
             </button>
          </form>
        </motion.div>
      )}

      {/* Inbox List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
             <Filter size={14} /> Inbox ({queries.length})
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
             <p className="text-muted-foreground italic text-sm">Loading your threads...</p>
          </div>
        ) : queries.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border">
             <p className="text-muted-foreground italic text-sm">No messages found. Start a conversation above!</p>
          </div>
        ) : (
          queries.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => markRead(q.id)}
              className={`bg-card rounded-2xl border border-border shadow-soft p-5 group transition-all hover:border-primary/30 relative ${!q.reply && user?.role !== 'student' ? 'border-l-4 border-l-warning' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${q.status === 'answered' ? 'text-success bg-success/10' : 'text-primary bg-primary/10'}`}>
                       {q.status || 'Active'}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{q.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {q.question}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.role === 'student' ? (
                       <>To: <span className="font-semibold text-foreground">{q.to || 'Administration'}</span></>
                    ) : (
                       <>From: <span className="font-semibold text-foreground">{q.from}</span></>
                    )}
                  </p>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteQuery(q.id); }}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Inquiry"
                >
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
              </div>

              {q.reply && (
                <div className="mt-4 p-4 rounded-xl bg-success/5 border border-success/10 relative">
                   <div className="absolute -top-2 left-4 px-2 bg-card border border-success/10 text-[10px] font-bold text-success uppercase">
                      Response
                   </div>
                   <p className="text-sm text-foreground/90 italic">"{q.reply}"</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                {replyingToId === q.id ? (
                  <div className="flex gap-2 w-full" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      className="flex-1 px-3 py-1.5 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Type your follow-up..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendReply(q.id)}
                    />
                    <button 
                      onClick={() => handleSendReply(q.id)}
                      className="p-2 rounded-lg bg-primary text-primary-foreground shadow-glow"
                    >
                      <Send size={14} />
                    </button>
                    <button 
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       setReplyingToId(q.id);
                       setReplyText('');
                    }}
                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-tighter hover:opacity-80 transition-opacity"
                  >
                    <MessageCircle size={14} /> {q.reply ? 'Follow Up' : (user?.role === 'student' ? 'Send Message' : 'Reply')}
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
