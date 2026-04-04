import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { User, Mail, BookOpen, Hash, Settings, KeySquare, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const fields = [
    { label: 'Student/Teacher ID', value: user.user_id, icon: Hash },
    { label: 'Full Name', value: user.name, icon: User },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1), icon: Settings },
    ...(user.department ? [{ label: 'Department', value: user.department, icon: BookOpen }] : []),
  ];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch('/user/password', {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });
      toast.success('Password updated successfully. You can log in with this new password next time.');
      setIsChangingPassword(false);
      setNewPassword('');
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border shadow-soft p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-display text-2xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user.role} • {user.department || 'Administration'}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-8">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <field.icon size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{field.label}</p>
                {field.label === 'Student/Teacher ID' ? (
                  <p className="text-base font-bold text-primary select-all">{field.value}</p>
                ) : (
                  <p className="text-sm font-medium text-foreground">{field.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Security / Password Change */}
        <div className="border-t border-border pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeySquare size={18} className="text-primary" />
              <h3 className="font-medium">Security</h3>
            </div>
            {!isChangingPassword && (
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
               >
                Change Password
              </button>
            )}
          </div>

          {isChangingPassword && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="bg-muted/50 p-4 rounded-xl border border-border space-y-4"
              onSubmit={handleChangePassword}
            >
              <div>
                <label className="text-sm font-medium mb-1 block">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted-foreground/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={16} /> Save Password
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
