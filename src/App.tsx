import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  Flame, 
  Trophy, 
  BarChart3, 
  Menu, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles,
  Target,
  Brain,
  Trash2,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Task {
  id: string;
  title: string;
  category: 'study' | 'health' | 'planning' | 'general';
  duration: number; // in minutes
  completed: boolean;
  xp: number;
}

export default function App() {
  // Persistence via localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tempo_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      { id: '1', title: 'Review Microbiology Case Studies', category: 'study', duration: 45, completed: false, xp: 60 },
      { id: '2', title: 'Topographic Anatomy Practice', category: 'study', duration: 30, completed: false, xp: 45 },
      { id: '3', title: 'Cardiovascular Hemostasis Review', category: 'study', duration: 60, completed: false, xp: 80 },
    ];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Task['category']>('study');
  const [newTaskDuration, setNewTaskDuration] = useState(30);

  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('tempo_xp');
    return saved ? Number(saved) : 1420;
  });

  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem('tempo_level');
    return saved ? Number(saved) : 4;
  });

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('tempo_streak');
    return saved ? Number(saved) : 5;
  });

  const [activeTab, setActiveTab] = useState<'today' | 'focus' | 'stats' | 'badges'>('today');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Focus Timer States
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const [activeTaskForFocus, setActiveTaskForFocus] = useState<Task | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('tempo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tempo_xp', xp.toString());
    const calculatedLevel = Math.floor(xp / 500) + 1;
    setLevel(calculatedLevel);
    localStorage.setItem('tempo_level', calculatedLevel.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('tempo_streak', streak.toString());
  }, [streak]);

  // Focus Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isFocusRunning && focusTime > 0) {
      interval = setInterval(() => {
        setFocusTime((prev) => prev - 1);
      }, 1000);
    } else if (focusTime === 0 && isFocusRunning) {
      setIsFocusRunning(false);
      setXp((prev) => prev + 50);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      alert('Focus session completed! You earned 50 XP.');
    }
    return () => clearInterval(interval);
  }, [isFocusRunning, focusTime]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const calculatedXp = Number(newTaskDuration) * 1.5;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      duration: Number(newTaskDuration),
      completed: false,
      xp: Math.round(calculatedXp),
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const nextCompleted = !task.completed;
        if (nextCompleted) {
          setXp(prev => prev + task.xp);
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        } else {
          setXp(prev => Math.max(0, prev - task.xp));
        }
        return { ...task, completed: nextCompleted };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const smartReorganize = () => {
    const sorted = [...tasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    setTasks(sorted);
    confetti({ particleCount: 50, spread: 50 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              tempo.
            </h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Life OS</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-inner">
            <Flame className="w-4 h-4 fill-amber-400/20" />
            <span>{streak}d</span>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 shadow-inner">
            <Trophy className="w-4 h-4" />
            <span>Lvl {level}</span>
          </div>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <span className="text-base font-bold text-indigo-400 tracking-wide">Tempo OS</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                <button 
                  onClick={() => { setActiveTab('today'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === 'today' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Target className="w-4 h-4" />
                  <span>Today's Tasks</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('focus'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === 'focus' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Focus Timer</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistics</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('badges'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === 'badges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Badges & Trophies</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Tempo System</span>
                <span className="text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">v2.0 PWA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 pb-24 space-y-6">
        {activeTab === 'today' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Progress Bar Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-200">Daily Momentum</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{completedCount} of {totalTasks} objectives completed</p>
                </div>
                <span className="text-lg font-black text-indigo-400">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Add Task Form */}
            <form onSubmit={addTask} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <input 
                type="text"
                placeholder="What needs to be done today?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="study">📚 Study</option>
                  <option value="health">⚡ Health</option>
                  <option value="planning">🎯 Planning</option>
                  <option value="general">💼 General</option>
                </select>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="number" 
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    min={5}
                    max={180}
                    className="w-12 bg-transparent text-xs text-slate-200 focus:outline-none text-center"
                  />
                  <span className="text-[10px] text-slate-500">mins</span>
                </div>
                
                <button 
                  type="submit"
                  className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
            </form>

            {/* Smart Toolbar */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Objectives</h2>
              <button 
                onClick={smartReorganize}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Sort</span>
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/30 rounded-2xl border border-slate-900">
                  No tasks added yet. Start planning your day above!
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${task.completed ? 'bg-slate-900/30 border-slate-900/80 opacity-60' : 'bg-slate-900/80 border-slate-800 shadow-md hover:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleTask(task.id)} 
                        className="text-indigo-400 hover:text-indigo-300 transition-colors flex-shrink-0"
                      >
                        {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase font-semibold">
                            {task.category}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.duration}m
                          </span>
                          <span className="text-[10px] text-indigo-400 font-medium">
                            +{task.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-600 hover:text-rose-400 p-2 transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'focus' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-200">Deep Focus Engine</h2>
              <p className="text-xs text-slate-500 mt-1">Isolate distractions and maximize output</p>
            </div>

            {/* Timer Display Circle */}
            <div className="relative w-64 h-64 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-900/50 shadow-2xl shadow-indigo-500/10">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-pulse pointer-events-none" />
              <div className="text-4xl font-black tracking-wider text-indigo-400 font-mono">
                {formatTime(focusTime)}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsFocusRunning(!isFocusRunning)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                {isFocusRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isFocusRunning ? 'Pause Session' : 'Start Focus'}</span>
              </button>
              <button 
                onClick={() => { setIsFocusRunning(false); setFocusTime(25 * 60); }}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white p-3.5 rounded-2xl transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-base font-bold text-slate-200">System Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total XP</span>
                <p className="text-3xl font-black text-indigo-400 mt-2">{xp}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Rank: Level {level}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Streak</span>
                <p className="text-3xl font-black text-amber-400 mt-2">{streak} Days</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Consistency is key</span>
              </div>
