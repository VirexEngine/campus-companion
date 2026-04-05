import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserRole } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, ArrowRight, UserPlus, LogIn, Camera, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import FaceCapture from '@/components/auth/FaceCapture';
import * as faceapi from 'face-api.js';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isFaceLogin, setIsFaceLogin] = useState(false);
  const [setupFaceId, setSetupFaceId] = useState(false);
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('CSE');
  const [subject, setSubject] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuthStore();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const success = await login(userId, password);
      setLoading(false);
      if (success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid ID or password.');
      }
    } else {
      if (!setupFaceId && !faceDescriptor) {
        setSetupFaceId(true);
        setLoading(false);
        return;
      }

      const signupData: any = { name, email, password, role, department, face_descriptor: faceDescriptor };
      if (role === 'teacher' && subject) {
        signupData.subject = subject;
      }
      const generatedId = await signup(signupData);
      setLoading(false);
      if (generatedId) {
        toast.success(`Signup successful! Your ID is: ${generatedId}`);
        if (faceDescriptor) {
          toast.info('Face ID has been linked to your account.');
        }
        setUserId(generatedId);
        setIsLogin(true);
        setSetupFaceId(false);
      } else {
        toast.error('Signup failed. Email may already be in use.');
      }
    }
  };

  const handleFaceLogin = async (currentDescriptorStr: string) => {
    if (!userId) {
      toast.error('Please enter your ID first.');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch user's stored descriptor
      const userRes = await fetch(`${API_BASE_URL}/api/login/face/get-descriptor/${userId}`);
      if (!userRes.ok) throw new Error('User not found or Face ID not set up.');
      
      const { face_descriptor: storedDescriptorStr } = await userRes.json();
      if (!storedDescriptorStr) throw new Error('Face ID not set up for this user.');

      // 2. Compare descriptors
      const currentDescriptor = new Float32Array(JSON.parse(currentDescriptorStr));
      const storedDescriptor = new Float32Array(JSON.parse(storedDescriptorStr));
      
      const distance = faceapi.euclideanDistance(currentDescriptor, storedDescriptor);
      console.log(`FACE-API: Security check for ${userId} - Distance: ${distance.toFixed(4)}`);
      
      const threshold = 0.45; // Stricter threshold to prevent false positives

      if (distance < threshold) {
        // 3. Match found! Authenticate on backend using store
        const success = await useAuthStore.getState().loginWithFace(userId);

        if (success) {
          toast.success(`Face matched (Dist: ${distance.toFixed(3)})! Welcome.`);
          navigate('/dashboard');
        } else {
          toast.error('Server authentication failed.');
        }
      } else {
        toast.error(`Face mismatch (Dist: ${distance.toFixed(3)}). Minimum: ${threshold}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Face login failed.');
    } finally {
      setLoading(false);
      setIsFaceLogin(false);
    }
  };

  const quickLogin = async (uid: string, pass: string) => {
    setUserId(uid);
    setPassword(pass);
    setLoading(true);
    const success = await login(uid, pass);
    setLoading(false);
    if (success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <GraduationCap size={28} className="text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-foreground">CampusHub</h1>
          </motion.div>
          <p className="text-primary-foreground/60 text-sm">Your AI-Powered College Companion</p>
        </div>

        <div className="bg-card rounded-2xl shadow-medium p-8 border border-border overflow-hidden relative">
          
          <div className="flex gap-4 mb-6 border-b border-border pb-4">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setIsFaceLogin(false); setSetupFaceId(false); }} 
              className={`flex-1 font-semibold flex items-center justify-center gap-2 pb-2 border-b-2 transition-all ${isLogin ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
              <LogIn size={18} /> Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setIsFaceLogin(false); setSetupFaceId(false); }} 
              className={`flex-1 font-semibold flex items-center justify-center gap-2 pb-2 border-b-2 transition-all ${!isLogin ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
              <UserPlus size={18} /> Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {setupFaceId ? (
              <motion.div
                key="face-setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-foreground mb-1">Set up Face ID</h3>
                  <p className="text-xs text-muted-foreground">Enroll your biometrics for a faster, safer login experience.</p>
                </div>
                
                <FaceCapture onCapture={(desc) => setFaceDescriptor(desc)} />

                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSetupFaceId(false)}
                      className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={handleAuth}
                      disabled={!faceDescriptor || loading}
                      className="flex-[2] py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" /> : 'Complete Signup'} <ShieldCheck size={18} />
                    </button>
                  </div>
                  
                  {!faceDescriptor && (
                    <button
                      type="button"
                      onClick={() => {
                        setFaceDescriptor(null);
                        handleAuth({ preventDefault: () => {} } as any);
                      }}
                      className="w-full py-2 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      Skip Face ID and complete signup
                    </button>
                  )}
                </div>
              </motion.div>
            ) : isFaceLogin ? (
              <motion.div
                key="face-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-foreground mb-1">Face Recognition Login</h3>
                  <p className="text-xs text-muted-foreground">Position your face in front of the camera.</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm your ID</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="e.g. STU-1001"
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background"
                    />
                  </div>
                </div>
                
                <FaceCapture onCapture={handleFaceLogin} label="Face ID Login" />

                <button
                  onClick={() => setIsFaceLogin(false)}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Cancel and use password
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="auth-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAuth}
                className="space-y-4"
              >
                {!isLogin && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background"
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@college.edu"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Role</label>
                        <select 
                          value={role} 
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Department</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background"
                        >
                          <option value="CSE">CSE</option>
                          <option value="DS">DS</option>
                          <option value="CSE AI-ML">CSE AI-ML</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">ID</label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="STU-1001"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background"
                      required={isLogin}
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>{isLogin ? 'Sign In' : 'Proceed to Face ID Setup'} <ArrowRight size={18} /></>
                    )}
                  </button>

                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsFaceLogin(true)}
                      className="w-full py-2.5 rounded-lg border-2 border-primary/20 text-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                    >
                      <Camera size={18} /> Sign in with Face
                    </button>
                  )}
                </div>

                {isLogin && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-[10px] text-muted-foreground mb-3 text-center uppercase tracking-wider font-bold">Quick Access</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Student', uid: 'STU-1001', pass: 'student123' },
                        { label: 'Teacher', uid: 'TCH-2001', pass: 'teacher123' },
                        { label: 'Admin', uid: 'ADM-0001', pass: 'admin123' },
                      ].map((demo) => (
                        <button
                          key={demo.label}
                          type="button"
                          onClick={() => quickLogin(demo.uid, demo.pass)}
                          className="py-1.5 px-2 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        >
                          {demo.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
