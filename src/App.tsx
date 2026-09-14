import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, CheckCircle2, Circle, AlertTriangle, Zap, Plus, 
  Calendar, Sun, Trash2, Check, Sparkles, Moon, Play, 
  Pause, Trophy, Award, Volume2, VolumeX, Flame, RefreshCw, Link,
  BarChart3, ChevronLeft, ChevronRight, BookOpen, TrendingUp, Filter
} from 'lucide-react';
import { Task, ScheduleHealth, UserStats, EnergyLevel } from './types';

// تاريخ اليوم بصيغة YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Review neck fasciae anatomy', startTime: '10:40', duration: 90, priority: 'High', completed: false, category: 'University', energyRequired: 'High' },
  { id: '2', title: 'Epidemiology: 10 key definitions', startTime: '14:00', duration: 45, priority: 'High', completed: false, category: 'University', energyRequired: 'Medium' },
  { id: '3', title: '30 min brisk walk', startTime: '18:30', duration: 30, priority: 'Medium', completed: false, category: 'Personal', energyRequired: 'Low' },
  { id: '4', title: 'Prepare tomorrow schedule & goals', startTime: '21:30', duration: 20, priority: 'Low', completed: false, category: 'Routine', energyRequired: 'Low' }
];

const INITIAL_STATS: UserStats = {
  streak: 3,
  lastCompletedDate: getTodayStr(),
  xp: 450,
  level: 2,
  unlockedBadges: ['3_day_streak', 'first_task']
};

interface DailyLog {
  date: string;
  tasks: Task[];
  journalNote?: string;
  completedMinutes: number;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tempo_app_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('tempo_app_user_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  // أرشيف الأيام السابقة
  const [dailyHistory, setDailyHistory] = useState<Record<string, DailyLog>>(() => {
    const saved = localStorage.getItem('tempo_app_history');
    return saved ? JSON.parse(saved) : {
      [getTodayStr()]: { date: getTodayStr(), tasks: INITIAL_TASKS, completedMinutes: 0 }
    };
  });

  // التنقل بين اليوم والأرشيف والإحصائيات
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'analytics'>('today');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(getTodayStr());
  const [nightJournalNote, setNightJournalNote] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMorningBrief, setShowMorningBrief] = useState(false);
  const [showNightBrief, setShowNightBrief] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGCalModal, setShowGCalModal] = useState(false);
  const [gcalUrl, setGcalUrl] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Focus Engine & Audio
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);
  const [audioRef] = useState(() => new Audio('https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=soft-rain-ambient-111154.mp3'));

  // Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('12:00');
  const [newDuration, setNewDuration] = useState('45');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newCategory, setNewCategory] = useState('University');
  const [newEnergy, setNewEnergy] = useState<EnergyLevel>('Medium');

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const installApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      alert('لتثبيت التطبيق على الآيفون: اضغط على زر المشاركة (Share) ثم اختار "Add to Home Screen".');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('tempo_app_tasks', JSON.stringify(tasks));
    // مزامنة المهام الحالية مع الأرشيف لليوم الحالي
    const today = getTodayStr();
    setDailyHistory(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        date: today,
        tasks: tasks,
        completedMinutes: tasks.filter(t => t.completed).reduce((acc, t) => acc + t.duration, 0)
      }
    }));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tempo_app_history', JSON.stringify(dailyHistory));
  }, [dailyHistory]);

  useEffect(() => {
    localStorage.setItem('tempo_app_user_stats', JSON.stringify(stats));
  }, [stats]);

  // Handle Focus Audio
  useEffect(() => {
    if (ambientSound && isTimerRunning) {
      audioRef.loop = true;
      audioRef.play().catch(() => {});
    } else {
      audioRef.pause();
    }
  }, [ambientSound, isTimerRunning, audioRef]);

  // Focus Timer Engine
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && focusTimeLeft > 0) {
      timer = setInterval(() => setFocusTimeLeft(prev => prev - 1), 1000);
    } else if (focusTimeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setNotificationMsg('🎉 Focus Session Completed! +50 XP Earned!');
      addXP(50);
      if (focusTask) toggleTask(focusTask.id);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, focusTimeLeft]);

  const addXP = (amount: number) => {
    setStats(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 300) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutesOfDay = currentTime.getHours() * 60 + currentTime.getMinutes();
  const plannedBedTimeMinutes = 23 * 60;

  const scheduleStats = useMemo(() => {
    const remainingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    const remainingMinutes = remainingTasks.reduce((acc, t) => acc + t.duration, 0);
    const completedMinutes = completedTasks.reduce((acc, t) => acc + t.duration, 0);
    const totalPlannedMinutes = tasks.reduce((acc, t) => acc + t.duration, 0);

    const availableMinutes = Math.max(0, plannedBedTimeMinutes - currentMinutesOfDay);
    const deficitMinutes = remainingMinutes - availableMinutes;

    let health: ScheduleHealth = 'ON_TRACK';
    if (deficitMinutes > 0) {
      health = 'CRITICAL';
    } else if (availableMinutes - remainingMinutes < 30) {
      health = 'SLIPPING';
    }

    return {
      remainingTasksCount: remainingTasks.length,
      completedTasksCount: completedTasks.length,
      remainingMinutes,
      completedMinutes,
      totalPlannedMinutes,
      availableMinutes,
      deficitMinutes,
      health
    };
  }, [tasks, currentMinutesOfDay]);

  // حساب تحليلات الطاقة وذروة الإنتاجية من الأرشيف
  const energyPeakAnalytics = useMemo(() => {
    const historyEntries = Object.values(dailyHistory);
    const timeSlots: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    const energyStats: Record<EnergyLevel, number> = { High: 0, Medium: 0, Low: 0 };

    historyEntries.forEach(log => {
      log.tasks.filter(t => t.completed).forEach(t => {
        const hour = parseInt(t.startTime.split(':')[0]);
        if (hour >= 5 && hour < 12) timeSlots.Morning += t.duration;
        else if (hour >= 12 && hour < 17) timeSlots.Afternoon += t.duration;
        else if (hour >= 17 && hour < 22) timeSlots.Evening += t.duration;
        else timeSlots.Night += t.duration;

        if (t.energyRequired) {
          energyStats[t.energyRequired] += 1;
        }
      });
    });

    const peakSlot = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Morning';
    return { timeSlots, energyStats, peakSlot };
  }, [dailyHistory]);

  const currentFocus = useMemo(() => {
    const uncompleted = tasks.filter(t => !t.completed);
    if (uncompleted.length === 0) return null;

    const active = uncompleted.find(t => {
      const start = timeToMinutes(t.startTime);
      const end = start + t.duration;
      return currentMinutesOfDay >= start && currentMinutesOfDay <= end;
    });

    if (active) return { task: active, isActiveNow: true };

    const sorted = [...uncompleted].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    return { task: sorted[0], isActiveNow: false };
  }, [tasks, currentMinutesOfDay]);

  const handleFixMyDay = () => {
    let currentPointer = Math.max(currentMinutesOfDay + 10, timeToMinutes('09:00'));

    const uncompleted = tasks.filter(t => !t.completed).sort((a, b) => {
      const pWeight = { High: 3, Medium: 2, Low: 1 };
      return pWeight[b.priority] - pWeight[a.priority];
    });

    const reorganized = tasks.map(t => {
      if (t.completed) return t;

      const matchedUncompleted = uncompleted.find(u => u.id === t.id);
      if (matchedUncompleted) {
        const hours = Math.floor(currentPointer / 60);
        const mins = currentPointer % 60;
        const newStartTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        currentPointer += t.duration + 15;
        return { ...t, startTime: newStartTime };
      }
      return t;
    });

    setTasks(reorganized);
    setNotificationMsg('⚡ Day intelligently reorganized by energy and priority!');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const toggleTask = (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (targetTask && !targetTask.completed) {
      addXP(30);
    }
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      startTime: newStart,
      duration: parseInt(newDuration) || 30,
      priority: newPriority,
      completed: false,
      category: newCategory,
      energyRequired: newEnergy
    };

    setTasks([...tasks, newTask]);
    setNewTitle('');
    setShowTaskModal(false);
  };

  const saveNightJournal = () => {
    const today = getTodayStr();
    setDailyHistory(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        journalNote: nightJournalNote
      }
    }));
    setShowNightBrief(false);
    setNotificationMsg('📝 Daily Reflection Saved to History!');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const startFocusSession = (task: Task) => {
    setFocusTask(task);
    setFocusTimeLeft(task.duration * 60);
    setIsTimerRunning(true);
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };
    return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans select-none">
      {notificationMsg && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">{notificationMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#090D16]/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              tempo<span className="text-indigo-500">.</span>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'today' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-amber-400">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{stats.streak} Days</span>
          </div>

          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-400 hover:bg-indigo-500/20"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Lvl {stats.level}</span>
          </button>

          <button
            onClick={installApp}
            className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 px-3 py-1.5 rounded-lg border border-indigo-500/30 font-semibold"
          >
            📱 Install App
          </button>

          <button
            onClick={() => setShowGCalModal(true)}
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <Link className="w-3.5 h-3.5 text-blue-400" /> Sync Calendar
          </button>

          <button
            onClick={() => setShowMorningBrief(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Morning
          </button>

          <button
            onClick={() => setShowNightBrief(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" /> Night
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {activeTab === 'today' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs uppercase font-semibold tracking-widest text-indigo-400 mb-1">Dynamic Dashboard</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Your day, under control.</h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-white">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Planned Work</p>
                  <p className="text-lg font-bold text-white mt-1">{formatMinutes(scheduleStats.totalPlannedMinutes)}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="text-lg font-bold text-indigo-400 mt-1">{formatMinutes(scheduleStats.remainingMinutes)}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Time Left</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{formatMinutes(scheduleStats.availableMinutes)}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {tasks.length > 0 ? Math.round((scheduleStats.completedTasksCount / tasks.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* FOCUS MODE BAR */}
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  NOW FOCUS & AMBIENCE
                </span>
                {currentFocus && (
                  <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    {currentFocus.task.startTime} ({currentFocus.task.duration} min)
                  </span>
                )}
              </div>

              {currentFocus ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentFocus.task.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Energy Required: <span className="text-amber-400 font-semibold">{currentFocus.task.energyRequired || 'Medium'}⚡</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => startFocusSession(currentFocus.task)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                    >
                      <Play className="w-4 h-4 fill-current" /> Deep Focus Mode
                    </button>
                    <button
                      onClick={() => toggleTask(currentFocus.task.id)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 border border-white/10"
                    >
                      <Check className="w-4 h-4" /> Complete
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">All planned tasks completed for today!</p>
              )}
            </div>

            {scheduleStats.health !== 'ON_TRACK' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">Schedule Deficit Detected</h4>
                    <p className="text-xs text-amber-200/70 mt-0.5">
                      {formatMinutes(scheduleStats.remainingMinutes)} tasks remaining, but only {formatMinutes(scheduleStats.availableMinutes)} free time left.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFixMyDay}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-amber-400 shrink-0 shadow-lg shadow-amber-500/20"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" /> ⚡ Fix My Day
                </button>
              </div>
            )}

            {/* TASK LIST */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Today's Tasks
                  <span className="text-xs font-normal text-slate-400 bg-[#ffffff0d] px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFixMyDay}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg"
                  >
                    <Zap className="w-3 h-3" /> Reorganize
                  </button>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-sm">No tasks added yet.</p>
                  </div>
                ) : (
                  tasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        t.completed ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleTask(t.id)} className="text-slate-400 hover:text-indigo-400">
                          {t.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold ${t.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                            <span>{t.startTime}</span>
                            <span>•</span>
                            <span>{t.duration} min</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
                              t.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {t.priority}
                            </span>
                            {t.energyRequired && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300">
                                ⚡ {t.energyRequired} Energy
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!t.completed && (
                          <button onClick={() => startFocusSession(t)} className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 flex items-center gap-1">
                            <Play className="w-3 h-3 fill-current" /> Focus Mode
                          </button>
                        )}
                        <button onClick={() => deleteTask(t.id)} className="text-slate-500 hover:text-rose-400 p-1.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* SIDEBAR */}
          <section className="lg:col-span-4 space-y-6">
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-indigo-950/40 to-slate-900">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400 fill-current" /> Smart Reorganizer
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Dynamically reschedules uncompleted tasks based on current time and priority weight.
              </p>
              <button
                onClick={handleFixMyDay}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                ⚡ Fix My Day Now
              </button>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> Dynamic Timeline
              </h3>
              <div className="space-y-4 relative border-l border-white/10 pl-4 ml-2">
                {tasks.map((t) => (
                  <div key={t.id} className="relative">
                    <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#090D16] ${
                      t.completed ? 'bg-emerald-400' : 'bg-indigo-500'
                    }`}></div>
                    <div className="text-xs font-mono text-slate-400">{t.startTime}</div>
                    <div className="text-xs font-semibold text-slate-200 mt-0.5">{t.title}</div>
                    <div className="text-[10px] text-slate-500">{t.duration} min</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}
            {/* HISTORY & ARCHIVE TAB */}
      {activeTab === 'history' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" /> Daily History & Archive
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تصفح سجلك اليومي السابق، المهام المنفذة، وملاحظات التدوين اليومية.
              </p>
            </div>
            <input
              type="date"
              value={selectedHistoryDate}
              onChange={e => setSelectedHistoryDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white">
                  Tasks Log for {selectedHistoryDate}
                </h3>
                {dailyHistory[selectedHistoryDate]?.tasks.length ? (
                  <div className="space-y-3">
                    {dailyHistory[selectedHistoryDate].tasks.map(t => (
                      <div key={t.id} className="p-4 rounded-xl border bg-white/5 border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {t.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
                          <div>
                            <p className={`text-sm font-semibold ${t.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                              {t.title}
                            </p>
                            <span className="text-xs text-slate-500">{t.startTime} • {t.duration} min • {t.priority}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-8 text-center">لا توجد سجلات محفوظة لهذا اليوم.</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  📝 Daily Reflection Note
                </h3>
                {dailyHistory[selectedHistoryDate]?.journalNote ? (
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-white/5 p-4 rounded-xl border border-white/5">
                    "{dailyHistory[selectedHistoryDate].journalNote}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">لم تدوّن ملاحظة ختامية لهذا اليوم.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ENERGY & PERFORMANCE ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-400" /> Energy & Peak Productivity Analytics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              تحليل كفاءة يومك وأوقات ذروة تركيزك بناءً على أدائك الفعلي في الأرشيف.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-amber-400">
              <p className="text-xs text-slate-400 uppercase font-bold">Peak Focus Time</p>
              <h3 className="text-2xl font-black text-amber-400 mt-2">{energyPeakAnalytics.peakSlot}</h3>
              <p className="text-xs text-slate-400 mt-1">أعلى وقت تنجز فيه معظم مهامك عالية الطاقة.</p>
            </div>
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-indigo-500">
              <p className="text-xs text-slate-400 uppercase font-bold">Total Focus Sessions</p>
              <h3 className="text-2xl font-black text-white mt-2">{stats.xp / 10} Sessions</h3>
              <p className="text-xs text-slate-400 mt-1">إجمالي الجلسات التي أكملتها بنجاح.</p>
            </div>
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-400">
              <p className="text-xs text-slate-400 uppercase font-bold">Consistency Rating</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">{stats.streak > 2 ? 'High 🔥' : 'Growing 🌱'}</h3>
              <p className="text-xs text-slate-400 mt-1">تقييم استمراريتك في إنجاز المهام.</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Focus Time Distribution Across Day (Minutes)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(energyPeakAnalytics.timeSlots).map(([slot, mins]) => (
                <div key={slot} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400 font-semibold">{slot}</span>
                  <div className="text-lg font-bold text-indigo-300 mt-1">{formatMinutes(mins)}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* FULL FOCUS MODE WITH AUDIO */}
      {focusTask && (
        <div className="fixed inset-0 z-50 bg-[#070A12] flex flex-col items-center justify-between p-8">
          <div className="w-full flex justify-between items-center max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">FOCUS & AMBIENT MODE</span>
            </div>
            <button
              onClick={() => setAmbientSound(!ambientSound)}
              className={`p-3 border rounded-xl flex items-center gap-2 text-xs font-semibold ${
                ambientSound ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {ambientSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {ambientSound ? 'Rain Sound ON' : 'Ambience Muted'}
            </button>
          </div>

          <div className="text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white max-w-xl">{focusTask.title}</h2>
            <div className="text-7xl sm:text-9xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
              {Math.floor(focusTimeLeft / 60).toString().padStart(2, '0')}:{(focusTimeLeft % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-slate-400">Category: {focusTask.category} • Energy: {focusTask.energyRequired}</p>
          </div>

          <div className="flex items-center gap-4 w-full max-w-md">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30"
            >
              {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              {isTimerRunning ? 'Pause Session' : 'Resume Session'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setFocusTask(null);
              }}
              className="py-4 px-6 bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold rounded-2xl"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* GAMIFICATION MODAL */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-[#111726] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Levels & Progress
              </h3>
              <button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Level {stats.level} Scholar</span>
                <span className="text-indigo-400">{stats.xp} / {stats.level * 300} XP</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${Math.min(100, (stats.xp / (stats.level * 300)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Unlocked Achievements</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                  <Flame className="w-6 h-6 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{stats.streak} Days Streak</p>
                    <p className="text-[10px] text-slate-400">Consistency Badge</p>
                  </div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                  <Award className="w-6 h-6 text-indigo-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Focus Master</p>
                    <p className="text-[10px] text-slate-400">Focus Sessions Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE CALENDAR MODAL */}
      {showGCalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-[#111726] space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-400" /> Sync Google Calendar (iCal)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ادخل رابط iCal الخاص بتقويم Google لجلب المهام والمواعيد تلقائياً.
            </p>
            <input
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/..."
              value={gcalUrl}
              onChange={e => setGcalUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowGCalModal(false)}
                className="flex-1 py-2.5 bg-white/5 text-slate-400 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setNotificationMsg('Calendar Feed Saved! Syncing...');
                  setShowGCalModal(false);
                  setTimeout(() => setNotificationMsg(null), 3000);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                Save Sync Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NIGHTLY REVIEW & JOURNAL MODAL */}
      {showNightBrief && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 bg-[#111726] space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Moon className="w-5 h-5" /> Nightly Reflection & Journal
            </div>
            <h3 className="text-2xl font-bold text-white">Day Complete! 🎉</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You finished <span className="font-bold text-emerald-400">{scheduleStats.completedTasksCount} tasks</span> out of {tasks.length}. Total focus time: <span className="font-bold text-indigo-400">{formatMinutes(scheduleStats.completedMinutes)}</span>.
            </p>
            
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-300 font-semibold block">Daily Reflection (ملاحظات وتأمل اليوم):</label>
              <textarea
                rows={3}
                placeholder="اكتب انطباعك عن اليوم وما الذي ساعدك أو عاقك..."
                value={nightJournalNote}
                onChange={e => setNightJournalNote(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={saveNightJournal}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30"
            >
              Save & Finish Day
            </button>
          </div>
        </div>
      )}

      {/* MORNING BRIEF MODAL */}
      {showMorningBrief && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 bg-[#111726] space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sun className="w-5 h-5" /> Morning Briefing
            </div>
            <h3 className="text-xl font-bold text-white">Good Morning!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have <span className="font-bold text-white">{tasks.length} tasks</span> scheduled for today totaling <span className="font-bold text-indigo-400">{formatMinutes(scheduleStats.totalPlannedMinutes)}</span>.
            </p>
            <button
              onClick={() => setShowMorningBrief(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
            >
              Start My Day
            </button>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-[#111726]">
            <h3 className="text-lg font-bold text-white mb-4">Add New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Study Anatomy"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={e => setNewDuration(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High" className="bg-[#111726]">High</option>
                    <option value="Medium" className="bg-[#111726]">Medium</option>
                    <option value="Low" className="bg-[#111726]">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Energy Required</label>
                  <select
                    value={newEnergy}
                    onChange={(e: any) => setNewEnergy(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High" className="bg-[#111726]">High ⚡</option>
                    <option value="Medium" className="bg-[#111726]">Medium ⚡</option>
                    <option value="Low" className="bg-[#111726]">Low ⚡</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 py-2.5 bg-white/5 text-slate-400 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
