import { useAppStore } from '@/store/appStore';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const COLORS = [
  'border-l-primary bg-primary/5',
  'border-l-accent bg-accent/5',
  'border-l-success bg-success/5',
  'border-l-info bg-info/5',
  'border-l-warning bg-warning/5',
];

export default function TimetablePage() {
  const { timetable, tasks, toggleTask } = useAppStore();

  const subjectColorMap: Record<string, string> = {};
  let colorIdx = 0;
  timetable.forEach((t) => {
    if (!subjectColorMap[t.subject]) {
      subjectColorMap[t.subject] = COLORS[colorIdx % COLORS.length];
      colorIdx++;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Timetable & Tasks</h1>

      {/* Timetable */}
      <div className="space-y-4">
        {DAYS.map((day) => {
          const dayClasses = timetable.filter((t) => t.day === day);
          if (dayClasses.length === 0) return null;
          return (
            <motion.div key={day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border shadow-soft p-5">
              <h2 className="font-display font-semibold text-foreground mb-3">{day}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayClasses.map((cls) => (
                  <div key={cls.id} className={`p-3 rounded-lg border-l-4 ${subjectColorMap[cls.subject]}`}>
                    <p className="text-sm font-medium text-foreground">{cls.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock size={12} /> {cls.startTime} - {cls.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground">{cls.teacher} • {cls.room}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tasks */}
      <div className="bg-card rounded-xl border border-border shadow-soft p-5">
        <h2 className="font-display font-semibold text-foreground mb-4">Tasks & Assignments</h2>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  task.completed ? 'bg-success border-success text-success-foreground' : 'border-border hover:border-primary'
                }`}
              >
                {task.completed && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">{task.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  task.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                  task.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                }`}>
                  {task.priority}
                </span>
                <span className="text-xs text-muted-foreground">{task.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
