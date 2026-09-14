import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, CheckCircle, Flame, Trophy, Clock, Zap, Menu, X, 
  BarChart2, Plus, Sparkles, Smartphone, Award, Brain, Trash2, CheckSquare, Maximize2
} from 'lucide-react';
import { Task, UserStats } from './types';

export default function App() {
  // Navigation & Drawer State
  const [activeTab, setActiveTab] = useState<'today' | 'analytics' | 'badges'>('today');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Persistence using localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tempo_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('tempo_stats');
      return saved ? JSON.parse(saved) : {
        streak: 0,
        lastCompletedDate: '',
        xp: 0,
        level: 1,
        unlockedBadges: []
      };
    } catch {
      return { streak: 0, lastCompletedDate: '', xp: 0, level: 1, unlockedBadges: [] };
    }
  });

  // Focus Timer States
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // New Task Form States
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Study');
  const [newTaskDuration, setNewTaskDuration] = useState(25);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('tempo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tempo_stats', JSON.stringify(stats));
  }, [stats]);

  // Update default active task
  useEffect(() => {
    const incomplete = tasks.filter(t => !t.completed);
    if (incomplete.length > 0 && !activeTask) {
      setActiveTask(incomplete[0]);
    } else if (incomplete.length === 0) {
      setActiveTask(null);
    }
  }, [tasks, activeTask]);

  // Focus Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (activeTask) {
        toggleTask(activeTask.id);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, activeTask]);

  // PWA Prompt Listener
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      alert("لتثبيت التطبيق كـ App مستقل: اضغط خيارات المتصفح (⋮ أو Share) ثم 'Add to Home Screen'");
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = !t.completed;
        if (nextStatus) {
          setStats(s => {
            const newXp = s.xp + 25;
            const newLevel = Math.floor(newXp / 100) + 1;
            return {
              ...s,
              xp: newXp,
              level: newLevel,
              streak: s.streak === 0 ? 1 : s.streak
            };
          });
        }
        return { ...t, completed: nextStatus };
      }
      return t;
    }));
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTask?.id === id) {
      setActiveTask(null);
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      startTime: timeString,
      duration: Number(newTaskDuration),
      priority: 'Medium',
      completed: false,
      category: newTaskCategory,
      energyRequired: 'Medium'
    };

    setTasks([...tasks, newTask]);
    if (!activeTask) {
      setActiveTask(newTask);
      setTimerSeconds(newTask.duration * 60);
    }
    setNewTaskTitle('');
  };

  const startFocusForTask = (task: Task) => {
    setActiveTask(task);
    setTimerSeconds(task.duration * 60);
    setIsFocusModeOpen(true);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const smartReorganize = () => {
    if (tasks.length === 0) return;
    const sorted = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
    setTasks(sorted);
  };

  const filteredTasks = selectedCategory === 'All' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  const xpProgress = stats.xp % 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1️⃣ NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700/50"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
            tempo.
          </h1>
        </div>

        {/* Level & Streak Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full text-xs font-semibold border border-amber-400/20">
            <Flame className="w-4 h-4" />
            <span>{stats.streak}d Streak</span>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-400/20">
              <Trophy className="w-4 h-4" />
              <span>Lvl {stats.level}</span>
            </div>
            <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${xpProgress}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      {/* 2️⃣ SIDEBAR DRAWER */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="relative w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between h-full z-10 shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-200">التحكم والأدوات</h2>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-1.5">
                <button 
                  onClick={() => { setActiveTab('today'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'today' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Clock className="w-5 h-5" />
                  <span>جدول اليوم (Today)</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <BarChart2 className="w-5 h-5" />
                  <span>الإحصائيات والإنتاجية</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('badges'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'badges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Award className="w-5 h-5" />
                  <span>الإنجازات والأوسمة</span>
                </button>
              </nav>

              <hr className="border-slate-800" />

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">تصفية التصنيفات</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Study', 'Health', 'Planning', 'General'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${selectedCategory === cat ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-slate-800" />

              <div className="space-y-2">
                <button 
                  onClick={() => { smartReorganize(); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 border border-amber-400/20 font-medium transition"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>إعادة تنظيم ذكية (AI)</span>
                </button>
                <button 
                  onClick={() => { handleInstallApp(); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 border border-emerald-400/20 font-medium transition"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>تثبيت تطبيق الهاتف (PWA)</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-800">
              tempo. productivity app v2.0
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ MAIN CONTENT */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <>
            {/* New Task Form */}
            <form onSubmit={addTask} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
              <input 
                type="text"
                placeholder="ما هي المهمة القادمة؟..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-500"
              />
              <div className="flex items-center justify-between gap-2">
                <select 
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Study">مذاكرة (Study)</option>
                  <option value="Health">صحية (Health)</option>
                  <option value="Planning">تخطيط (Planning)</option>
                  <option value="General">عام (General)</option>
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">المدة:</span>
                  <input 
                    type="number" 
                    value={newTaskDuration} 
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-center text-slate-200"
                    min="5" step="5"
                  />
                  <span className="text-xs text-slate-400">دقيقة</span>
                </div>

                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/30">
                  <Plus className="w-4 h-4" /> إضافة
                </button>
              </div>
            </form>

            {/* Focus Card Hero */}
            {activeTask ? (
              <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                    التركيز الحالي (NOW)
                  </span>
                  <span className="text-sm font-mono text-slate-400">{activeTask.startTime} ({activeTask.duration} دقيقة)</span>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">{activeTask.title}</h2>
                <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  التصنيف: <span className="text-slate-200">{activeTask.category}</span>
                </p>

                <button 
                  onClick={() => startFocusForTask(activeTask)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/25"
                >
                  <Play className="w-5 h-5 fill-current" />
                  بدء وضع التركيز (Focus Mode)
                </button>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-6">
                <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300 mb-1">لا توجد مهام حالياً</h3>
                <p className="text-xs text-slate-500">أضف مهمتك الأولى أعلاه لتنظيم يومك وزيادة إنتاجيتك!</p>
              </div>
            )}

            {/* Task List Header */}
            {filteredTasks.length > 0 && (
              <>
                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-lg font-bold text-slate-200">جدول المهام</h3>
                  <span className="text-xs text-slate-400">
                    {filteredTasks.filter(t => t.completed).length} من {filteredTasks.length} مكتمل
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => setActiveTask(task)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        activeTask?.id === task.id 
                          ? 'bg-slate-900 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20' 
                          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                          className={`p-1 rounded-lg transition ${task.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          <CheckCircle className={`w-6 h-6 ${task.completed ? 'fill-emerald-400/10' : ''}`} />
                        </button>
                        
                        <div>
                          <h4 className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>{task.startTime}</span>
                            <span>•</span>
                            <span>{task.duration} دقيقة</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">{task.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); startFocusForTask(task); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 transition rounded-lg hover:bg-slate-800"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => deleteTask(task.id, e)}
                          className="p-1.5 text-slate-600 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">تحليل الإنتاجية والأداء</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className
