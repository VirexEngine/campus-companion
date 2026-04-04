import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Trophy, Flame, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

interface Leader {
  name: string;
  department: string;
  max_streak: number;
  total_score: number;
  quizzes_taken: number;
}

export default function LeaderboardPage() {
  const { data: leaders, isLoading } = useQuery<Leader[]>({
    queryKey: ['leaderboard'],
    queryFn: () => apiFetch('/leaderboard'),
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-glow flex items-center justify-center text-white">
          <Trophy size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Global Leaderboard</h1>
          <p className="text-muted-foreground font-medium mt-1">Real-time Global Rankings across tracking streaks and scores.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-secondary rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="space-y-3">
          {leaders?.map((leader, idx) => {
            const isTop3 = idx < 3;
            return (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  idx === 0 ? 'bg-gradient-to-r from-yellow-400/20 to-transparent border-yellow-400/30' : 
                  idx === 1 ? 'bg-gradient-to-r from-slate-300/20 to-transparent border-slate-300/30' :
                  idx === 2 ? 'bg-gradient-to-r from-orange-300/20 to-transparent border-orange-300/30' :
                  'bg-card border-border'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                  isTop3 ? 'bg-background shadow-soft' : 'text-muted-foreground'
                }`}>
                  #{idx + 1}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-soft">
                  {leader.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate flex items-center gap-2">
                    {leader.name}
                    {idx === 0 && <Medal size={14} className="text-yellow-500" />}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{leader.department} • {leader.quizzes_taken} Quizzes</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Max Streak</div>
                    <div className="font-bold text-foreground flex items-center gap-1 justify-end">
                      {leader.max_streak > 0 && <Flame size={14} className="text-warning fill-warning" />}
                      {leader.max_streak}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Score</div>
                    <div className="font-bold font-display text-xl text-primary">{leader.total_score}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
          
          {leaders?.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <Trophy size={48} className="mx-auto mb-4 opacity-20" />
              <p>The leaderboard is completely empty. Be the very first to strike!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
