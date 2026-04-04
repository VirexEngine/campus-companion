import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, User } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

export default function AdminQueriesPage() {
  const { user } = useAuthStore();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchQueries();
  }, [user]);

  const fetchQueries = async () => {
    try {
      const endpoint = user?.role === 'teacher' ? '/teacher/queries' : '/admin/queries';
      const data = await apiFetch(endpoint);
      setQueries(data);
    } catch (err) {
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (queryId: string) => {
    if (!replyText.trim()) return;
    try {
      await apiFetch('/queries/reply', {
        method: 'POST',
        body: JSON.stringify({ id: queryId, reply: replyText })
      });
      toast.success('Reply sent successfully');
      setReplyText('');
      setReplyingTo(null);
      fetchQueries();
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <MessageCircle size={24} /> {user?.role === 'teacher' ? 'Student Inquiries' : 'Student Queries'}
      </h1>

      <div className="space-y-3">
        {loading ? (
           <div className="py-12 text-center text-muted-foreground italic">Loading queries...</div>
        ) : queries.length === 0 ? (
           <div className="py-12 text-center text-muted-foreground italic">No inquiries found</div>
        ) : (
          queries.map((query, i) => (
            <motion.div
              key={query.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border shadow-soft p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{query.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">From: {query.from} • {query.date}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  query.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}>
                  {query.status}
                </span>
              </div>

              {query.reply && (
                <div className="mt-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <p className="text-xs text-muted-foreground mb-1">{user?.role === 'admin' ? 'Admin Reply:' : 'Your Response:'}</p>
                  <p className="text-sm text-foreground">{query.reply}</p>
                </div>
              )}

              <div className="mt-3">
                {replyingTo === query.id ? (
                  <div className="flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply(query.id)}
                      placeholder="Type your response..."
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button 
                      onClick={() => handleSendReply(query.id)}
                      className="p-2 rounded-lg gradient-primary text-primary-foreground shadow-glow"
                    >
                      <Send size={16} />
                    </button>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(query.id)}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <MessageCircle size={14} /> {query.reply ? 'Send Follow-up' : 'Reply to Query'}
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
