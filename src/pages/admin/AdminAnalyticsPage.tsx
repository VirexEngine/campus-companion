import StatCard from '@/components/shared/StatCard';
import { Users, GraduationCap, CalendarCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await apiFetch('/admin/analytics');
        setData(result);
      } catch (err) {
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Gathering real-time insights...</p>
      </div>
    );
  }

  if (!data) return null;

  const currentDept = selectedDept === 'All' ? null : data.departments?.find((d: any) => d.name === selectedDept);
  const deptData = data.departments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 size={24} className="text-primary" /> Analytics Overview
        </h1>
        
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border border-border shadow-soft">
          <Filter size={16} className="text-muted-foreground ml-2" />
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent text-sm font-semibold outline-none pr-4"
          >
            <option value="All">All Departments</option>
            {deptData.map((d: any) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={currentDept ? currentDept.students : data.totalStudents} 
          icon={GraduationCap} 
          variant="primary" 
        />
        <StatCard 
          title="Total Teachers" 
          value={data.totalTeachers} 
          icon={Users} 
          variant="accent" 
        />
        <StatCard 
          title="Avg Attendance" 
          value={`${currentDept ? currentDept.avgAttendance : data.avgAttendance}%`} 
          icon={CalendarCheck} 
          variant="success" 
        />
        <StatCard 
          title="Pending Queries" 
          value={data.pendingQueries} 
          icon={TrendingUp} 
          variant="primary" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise List */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl border border-border shadow-soft p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-6 flex items-center gap-2">
             <LayoutDashboard size={18} className="text-primary" /> Department Standings
          </h2>
          <div className="space-y-6">
            {deptData.map((dept: any) => (
              <div 
                key={dept.name} 
                className={`space-y-2 p-3 rounded-xl transition-all cursor-pointer ${selectedDept === dept.name ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}
                onClick={() => setSelectedDept(dept.name)}
              >
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-foreground">{dept.name}</span>
                  <span className="text-xs text-muted-foreground">{dept.students} students • <span className={dept.avgAttendance < 80 ? 'text-destructive font-bold' : 'text-success font-bold'}>{dept.avgAttendance}%</span></span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dept.avgAttendance}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${dept.avgAttendance < 80 ? 'bg-destructive' : 'bg-primary shadow-glow-sm'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Subject-wise Breakdown (Dynamic) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl border border-border shadow-soft p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-6 flex items-center gap-2">
             <BarChart3 size={18} className="text-primary" /> {selectedDept === 'All' ? 'Overall Subject Performance' : `${selectedDept} Subject Metrics`}
          </h2>
          
          {selectedDept === 'All' ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center gap-3">
               <div className="p-3 bg-muted rounded-full"><Filter size={24} className="text-muted-foreground" /></div>
               <p className="text-sm text-muted-foreground">Select a department above to see<br/>detailed subject-wise performance.</p>
            </div>
          ) : (
            <div className="space-y-5">
               {currentDept?.subjects?.length > 0 ? (
                 currentDept.subjects.map((s: any) => (
                   <div key={s.name} className="flex items-center gap-4">
                      <div className="w-24 text-xs font-semibold text-muted-foreground truncate">{s.name}</div>
                      <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden relative">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${s.avgAttendance}%` }}
                           className="h-full bg-success opacity-80"
                         />
                         <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-foreground drop-shadow-sm">
                            {s.avgAttendance}%
                         </span>
                      </div>
                   </div>
                 ))
               ) : (
                 <p className="text-sm text-center py-10 text-muted-foreground italic">No subject data found for this department.</p>
               )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

const Filter = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const LayoutDashboard = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);
