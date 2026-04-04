import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, Search, BrainCircuit, Play, CheckCircle2, ChevronRight, XCircle, Flame, Trash2, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Quiz {
  id: number;
  teacher_name: string;
  teacher_id: string;
  topic_name: string;
  created_at: string;
  timer_seconds: number;
}

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export default function QuizzesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Student Mode State
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<{score: number, total: number, new_streak: number, message: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { setQuizActive } = useAppStore();
  
  // Teacher Mode State
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('');
  const [timerOption, setTimerOption] = useState(30);

  // Data Fetching
  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: () => apiFetch('/quizzes'),
  });

  const { data: activeQuizData } = useQuery({
    queryKey: ['quiz', activeQuizId],
    queryFn: () => apiFetch(`/quizzes/${activeQuizId}`),
    enabled: !!activeQuizId,
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!file || !topic.trim()) throw new Error('Missing file or topic');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('topic', topic);
      formData.append('timer', String(timerOption));
      
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL || ''}/api/teacher/quizzes/generate`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generative engine failure');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('NotebookLM Quiz Generated Perfectly! ✨');
      setFile(null);
      setTopic('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId: number) => apiFetch(`/quizzes/${quizId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz deleted successfully');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/quizzes/${activeQuizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: studentAnswers })
      });
    },
    onSuccess: (data) => {
      setQuizScore(data);
      if (data.new_streak > 0) toast.success(`Streak Bumping! You are on a ${data.new_streak} 🔥 streak!`);
      else toast.warning('Streak lost! Keep studying!');
    }
  });

  // Handlers
  const handleAnswerSelect = (qId: number, optionLetter: string) => {
    setStudentAnswers(prev => ({ ...prev, [qId]: optionLetter }));
  };

  const handleNextQuestion = () => {
    if (!activeQuizData) return;
    if (currentQuestionIndex < activeQuizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitMutation.mutate();
    }
  };

  const closeQuiz = () => {
    setActiveQuizId(null);
    setCurrentQuestionIndex(0);
    setStudentAnswers({});
    setQuizScore(null);
    setQuizActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  };

  useEffect(() => {
    if (!activeQuizId || !activeQuizData) return;

    const duration = activeQuizData.quiz?.timer_seconds ?? 30;
    setTimeLeft(duration);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeQuizId, activeQuizData, currentQuestionIndex]);


  if (activeQuizId && activeQuizData) {
    if (quizScore) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 h-full">
          <motion.div initial={{scale:0.8}} animate={{scale:1}} className="bg-card p-10 rounded-2xl shadow-soft border border-border text-center max-w-sm w-full">
            <h2 className="text-3xl font-display font-bold mb-2">Quiz Complete!</h2>
            <div className="text-5xl font-bold text-primary mb-4">{quizScore.score}/{quizScore.total}</div>
            {quizScore.new_streak > 0 ? (
              <div className="flex items-center justify-center gap-2 text-warning font-bold text-lg mb-4">
                <Flame size={24} className="fill-warning" /> {quizScore.new_streak}x Streak!
              </div>
            ) : (
              <div className="text-muted-foreground mb-4">Streak Broken. Start again!</div>
            )}
            <p className="text-sm mb-6 pb-4 border-b border-border">{quizScore.message}</p>
            <button onClick={closeQuiz} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
              Return to Dashboard
            </button>
          </motion.div>
        </div>
      );
    }

    const currentQ: Question = activeQuizData.questions[currentQuestionIndex];
    const totalQs = activeQuizData.questions.length;
    
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-foreground">{activeQuizData.quiz.topic_name}</h2>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm border ${
              (timeLeft || 0) <= 10 ? 'bg-destructive/10 border-destructive text-destructive animate-pulse' : 'bg-primary/10 border-primary text-primary'
            }`}>
              <Clock size={14} />
              {timeLeft}s
            </div>
            <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">Q {currentQuestionIndex + 1} / {totalQs}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex) / totalQs) * 100}%` }}
          />
        </div>

        <motion.div
           key={currentQ.id}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="bg-card rounded-2xl p-6 shadow-soft border border-border relative overflow-hidden"
           onContextMenu={(e) => e.preventDefault()}
           style={{ userSelect: 'none' }}
        >
          {/* Anti-Cheat Overlay Hint (Optional) */}
          <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
            <ShieldAlert size={40} />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-6 leading-relaxed">
            {currentQ.question_text}
          </h3>
          <div className="space-y-3">
            {['a', 'b', 'c', 'd'].map(opt => {
              const optionText = currentQ[`option_${opt}` as keyof Question];
              const isSelected = studentAnswers[currentQ.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswerSelect(currentQ.id, opt)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10 text-primary shadow-glow ring-1 ring-primary' 
                      : 'border-border bg-background hover:border-primary/50 text-foreground'
                  }`}
                >
                  <span className="font-bold uppercase mr-3 opacity-50">{opt}.</span>
                  {optionText}
                </button>
              )
            })}
          </div>
        </motion.div>

        <div className="flex justify-end">
          <button
            onClick={handleNextQuestion}
            disabled={!studentAnswers[currentQ.id]}
            className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {currentQuestionIndex === totalQs - 1 ? 'Submit Answers' : 'Next Question'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">AI Quizzes</h1>
        <p className="text-muted-foreground mt-2">NotebookLM-powered competitive learning platform.</p>
      </div>

      {user?.role === 'teacher' && (
        <section className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-3xl border border-primary/20 shadow-glow mb-10">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-foreground">Teacher Engine</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Upload syllabus PDFs (max 15 pages). Google Gemini will instantly structure and deploy a 10-question quiz for students.</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Quiz Topic (e.g., Computer Networks Midterm)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <div className="relative flex-1">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="h-full min-h-[48px] px-4 py-3 rounded-xl bg-background border border-border flex items-center gap-2 text-sm text-muted-foreground hover:bg-primary/5 transition-colors">
                <FileUp size={18} className="text-primary" />
                {file ? file.name : 'Upload PDF Document...'}
              </div>
            </div>
            
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={timerOption}
                onChange={(e) => setTimerOption(Number(e.target.value))}
                className="pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 text-sm appearance-none cursor-pointer min-w-[140px]"
              >
                <option value={15}>15s / Question</option>
                <option value={30}>30s / Question</option>
                <option value={60}>60s / Question</option>
                <option value={120}>120s / Question</option>
              </select>
            </div>
            
            <button
               onClick={() => generateMutation.mutate()}
               disabled={generateMutation.isPending || !file || !topic.trim()}
               className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow-glow flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Parsing AI...' : 'Deploy Quiz'}
            </button>
          </div>
        </section>
      )}

      {/* Student View Grid */}
      <section>
        <div className="flex items-center gap-2 mb-6 text-foreground font-medium">
          <CheckCircle2 className="text-success" /> Available Quizzes
        </div>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
             <div className="h-24 bg-secondary rounded-2xl w-full"></div>
             <div className="h-24 bg-secondary rounded-2xl w-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes?.map(q => (
              <motion.div 
                whileHover={{ y: -2 }}
                key={q.id} 
                className="bg-card p-5 rounded-2xl border border-border shadow-soft flex flex-col justify-between h-36 relative overflow-hidden group"
              >
                <div>
                  <h3 className="font-bold text-foreground text-lg truncate pr-8">{q.topic_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">By Prof. {q.teacher_name}</p>
                </div>

                {(user?.role === 'admin' || q.teacher_id === user?.user_id) && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this quiz?')) {
                        deleteMutation.mutate(q.id);
                      }
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div className="flex justify-between items-end mt-4">
                  <span className="text-[10px] text-muted-foreground/50 uppercase font-bold tracking-wider">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => {
                      setActiveQuizId(q.id);
                      setQuizActive(true);
                      toast.info("Quiz Mode: AI Assistant is disabled for fairness! 🛡️");
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary gradient-primary/10 px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    Start <Play size={12} className="fill-current" />
                  </button>
                </div>
              </motion.div>
            ))}
            {quizzes?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border text-sm">
                No Quizzes Available Yet.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
