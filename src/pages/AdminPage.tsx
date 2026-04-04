import { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, UserPlus, X, BookOpen, MessageSquare, Send, Megaphone, Users, Activity } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { User, UserRole } from '@/store/authStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [queries, setQueries] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' as UserRole, department: 'CSE' });

  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uData, aData, qData] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/analytics'),
        apiFetch('/admin/queries')
      ]);
      setUsers(uData);
      setAnalytics(aData);
      setQueries(qData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user_id: string, name: string) => {
    // Removed native confirm as it may be blocked by iframe/browser environments
    try {
      await apiFetch(`/admin/users/${user_id}`, { method: 'DELETE' });
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.user_id !== user_id));
    } catch (e: any) {
      console.error(e);
      toast.error(`Deletion failed: ${e.message || 'Unknown error'}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiFetch(`/admin/users/${editingUser.user_id}`, {
        method: 'PUT',
        body: JSON.stringify(editingUser)
      });
      toast.success('Profile updated');
      setEditingUser(null);
      fetchData();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      toast.success(`Created: ${res.user_id}`);
      setIsCreatingUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'student', department: 'CSE' });
      fetchData();
    } catch (e) {
      toast.error('Creation failed');
    }
  };

  const handleReplyQuery = async (queryId: number) => {
    const text = replyText[queryId];
    if (!text) return;
    try {
      await apiFetch(`/admin/queries/${queryId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: text })
      });
      toast.success('Reply sent');
      setReplyText({ ...replyText, [queryId]: '' });
      fetchData();
    } catch (e) {
      toast.error('Reply failed');
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
      toast.success('Broadcast dispatched');
      setBroadcastMsg('');
    } catch (err) {
      toast.error('Broadcast failed');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow">
              <Shield size={32} />
            </div>
            Admin Center
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage users, analyze performance, and broadcast updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreatingUser(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 shadow-glow hover:opacity-90 transition-all text-sm"
          >
            <UserPlus size={18} /> Create New Account
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Total Students', value: analytics.total_students, icon: Users, color: 'text-primary' },
            { label: 'Total Teachers', value: analytics.total_teachers, icon: BookOpen, color: 'text-indigo-500' },
            { label: 'Active Queries', value: analytics.open_queries, icon: MessageSquare, color: 'text-orange-500' }
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="bg-card border border-border rounded-2xl p-6 shadow-soft hover:shadow-glow transition-all"
            >
              <stat.icon size={28} className={`${stat.color} mb-3`} />
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Global Broadcast */}
      <section className="bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-8 shadow-soft">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-glow animate-pulse">
            <Megaphone size={36} />
          </div>
          <div className="flex-1 w-full space-y-4">
            <div>
              <h2 className="text-2xl font-bold">University Broadcast</h2>
              <p className="text-muted-foreground text-sm">Instantly notify all campus users via their notification hub.</p>
            </div>
            <form onSubmit={handleBroadcast} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Type your urgent announcement here..."
                className="flex-1 px-5 py-4 border border-border rounded-2xl bg-background/50 focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                required
              />
              <button type="submit" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all">
                <Send size={18} /> Dispatch
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-1 static gap-10">
        {/* User Management */}
        <div className="bg-card rounded-3xl p-8 border border-border shadow-soft overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <Users className="text-primary" size={24} />
            <h2 className="text-2xl font-bold">User Directory</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-medium">Synchronizing Secure Data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">User ID</th>
                    <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Identity</th>
                    <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Department</th>
                    <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-widest text-right">Settings</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={u.id}
                      className="border-t border-border/50 hover:bg-primary/5 transition-colors group"
                    >
                      <td className="p-4">
                        <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg text-xs tracking-tighter shadow-sm border border-primary/20">
                          {u.user_id}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{u.name}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                          <div className="mt-1 flex gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                              {u.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium bg-muted px-2.5 py-1 rounded-md border border-border/50">
                          {u.department || 'Management'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingUser(u)} className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"><Edit size={18} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.user_id, u.name); }} className="p-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Queries Responder */}
        <div className="bg-card rounded-3xl p-8 border border-border shadow-soft">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MessageSquare size={24} className="text-primary" />
              Support Queries
            </h2>
            <div className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-full uppercase tracking-widest border border-border">
              {queries.filter(q => q.status === 'open').length} Urgent
            </div>
          </div>
          {loading ? (
            <div className="py-10 animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded-2xl" />
              <div className="h-20 bg-muted rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {queries.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border">
                  No active support requests at this moment.
                </div>
              ) : queries.map(q => (
                <div key={q.id} className={`p-6 rounded-2xl border transition-all ${q.status === 'open' ? 'border-orange-500/30 bg-orange-500/5 shadow-sm' : 'border-border bg-muted/20'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-base flex items-center gap-2">
                        {q.name}
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md border border-border/50">{q.role}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">{new Date(q.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${q.status === 'resolved' ? 'bg-success/10 border-success/30 text-success' : 'bg-orange-500/10 border-orange-500/30 text-orange-600'}`}>
                      {q.status}
                    </span>
                  </div>
                  <p className="text-sm mb-5 font-medium leading-relaxed italic text-foreground/80">&quot;{q.message}&quot;</p>

                  {q.status === 'open' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Resolution details..."
                        className="flex-1 text-sm px-4 py-2.5 border border-border rounded-xl bg-background"
                        value={replyText[q.id] || ''}
                        onChange={e => setReplyText({ ...replyText, [q.id]: e.target.value })}
                      />
                      <button onClick={() => handleReplyQuery(q.id)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-glow hover:opacity-90">Send</button>
                    </div>
                  ) : (
                    <div className="bg-background/80 p-4 rounded-xl border border-border/50 shadow-inner">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={12} className="text-primary" />
                        <span className="font-bold text-primary text-[10px] uppercase tracking-widest">Admin Response</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{q.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isCreatingUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-8 relative">
            <button onClick={() => setIsCreatingUser(false)} className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">New Identity</h2>
              <p className="text-sm text-muted-foreground mt-1">Onboard a new member to the campus network.</p>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Full Name</label>
                <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-5 py-3 border border-border rounded-2xl bg-background/50 focus:ring-2 focus:ring-primary/50" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">University Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-5 py-3 border border-border rounded-2xl bg-background/50 focus:ring-2 focus:ring-primary/50" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Secure Password</label>
                <input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-5 py-3 border border-border rounded-2xl bg-background/50 focus:ring-2 focus:ring-primary/50" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Network Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })} className="w-full px-4 py-3 border border-border rounded-2xl bg-background/50 outline-none">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Department</label>
                  <select value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} className="w-full px-4 py-3 border border-border rounded-2xl bg-background/50 outline-none">
                    <option value="CSE">CSE</option>
                    <option value="DS">DS</option>
                    <option value="CSE AI-ML">CSE AI-ML</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl mt-6 font-bold shadow-glow hover:opacity-90 transition-all">Authorize & Create Account</button>
            </form>
          </motion.div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-8 relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 p-2 text-muted-foreground hover:bg-muted rounded-full">
              <X size={20} />
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">Modifying identity settings for <span className="text-primary font-mono">{editingUser.user_id}</span></p>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Name</label>
                <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full px-5 py-3 border border-border rounded-2xl bg-background/50 focus:ring-2 focus:ring-primary/50" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Email</label>
                <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full px-5 py-3 border border-border rounded-2xl bg-background/50 focus:ring-2 focus:ring-primary/50" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Role</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })} className="w-full px-4 py-3 border border-border rounded-2xl bg-background/50 outline-none">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Department</label>
                  <select value={editingUser.department} onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })} className="w-full px-4 py-3 border border-border rounded-2xl bg-background/50 outline-none">
                    <option value="CSE">CSE</option>
                    <option value="DS">DS</option>
                    <option value="CSE AI-ML">CSE AI-ML</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-3 rounded-2xl font-bold hover:bg-muted transition-all">Discard</button>
                <button type="submit" className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-glow hover:opacity-90 transition-all">Apply Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
