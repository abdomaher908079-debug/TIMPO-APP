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
  Zap,
  User,
  Image as ImageIcon,
  Sun,
  ShieldCheck,
  Send
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

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
}

export default function App() {
  // User Profile States
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('tempo_user_name') || 'Abdullah Maher');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('tempo_user_avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('tempo_posts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      { id: '1', author: 'Abdullah Maher', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', content: 'أنجزت مراجعة الهيموستيز بنجاح اليوم! الخطوة القادمة هي الميكروبيولوجي 🔥', timestamp: 'منذ ساعتين', likes: 14 }
    ];
  });

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');

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

  const [activeTab, setActiveTab] = useState<'today' | 'focus' | 'social' | 'stats' | 'badges'>('today');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Focus Timer States
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState(false);

  // Day countdown timer calculation
  const [timeLeftToday, setTimeLeftToday] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateDayCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeftToday({ hours, minutes, seconds });
      }
    };
    updateDayCountdown();
    const timerInterval = setInterval(updateDayCountdown, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('tempo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tempo_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('tempo_user_name', userName);
    localStorage.setItem('tempo_user_avatar', userAvatar);
  }, [userName, userAvatar]);

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

  const addPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      author: userName,
      avatar: userAvatar,
      content: newPostContent.trim(),
      image: newPostImage.trim() || undefined,
      timestamp: 'الآن',
      likes: 0
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImage('');
    confetti({ particleCount: 60, spread: 50 });
  };

  const likePost = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="h-16 border-b border-indigo-500/20 bg-slate-900/60 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-40 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-colors border border-indigo-500/30"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              tempo.
            </h1>
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Fresh Life OS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/15 text-amber-300 px-3 py-1.5 rounded-full border border-amber-500/30 shadow-inner font-bold text-xs">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
            <span>{streak}d</span>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-500/15 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/30 shadow-inner font-bold text-xs">
            <Trophy className="w-4 h-4 text-indigo-400" />
            <span>Lvl {level}</span>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-400/50 hover:border-indigo-400 transition-all shadow-md"
          >
            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-80 bg-slate-900 border-r border-indigo-500/30 p-6 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover border border-indigo-500" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">{userName}</h2>
                    <span className="text-[10px] text-indigo-400">Level {level} Achiever</span>
                  </div>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'today' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Today's Plan</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('focus'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'focus' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Focus Engine</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('social'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'social' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>Journals & Feed</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Statistics</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('badges'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'badges' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Badges</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={() => { setIsProfileModalOpen(true); setIsSidebarOpen(false); }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 flex items-center justify-center gap-2 transition-all border border-indigo-500/20"
              >
                <User className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative bg-slate-900 border border-indigo-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Account Settings</span>
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <img src={userAvatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-lg" />
                <span className="text-xs text-slate-400">Customize your personal profile</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Your Full Name</label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Avatar Image URL</label>
                <input 
                  type="text" 
                  value={userAvatar} 
                  onChange={(e) => setUserAvatar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all mt-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 pb-24 space-y-6">
        {activeTab === 'today' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Day Countdown & Momentum Widget */}
            <div className="bg-gradient-to-r from-indigo-900/50 via-slate-900 to-purple-950/50 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Day Countdown</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-950/60 px-3 py-1 rounded-xl border border-indigo-500/20 text-xs font-mono font-bold text-cyan-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{String(timeLeftToday.hours).padStart(2, '0')}:{String(timeLeftToday.minutes).padStart(2, '0')}:{String(timeLeftToday.seconds).padStart(2, '0')} left</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-black text-white">Hello, {userName} ✨</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{completedCount} of {totalTasks} daily objectives achieved</p>
                </div>
                <span className="text-xl font-black text-cyan-400">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-indigo-500/30">
                <div 
                  className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Add Task Form */}
            <form onSubmit={addTask} className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-4 shadow-xl space-y-3 backdrop-blur-md">
              <input 
                type="text"
                placeholder="What objective will you conquer today?"
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
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <input 
                    type="number" 
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    min={5}
                    max={180}
                    className="w-12 bg-transparent text-xs text-slate-200 focus:outline-none text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-500">mins</span>
                </div>
                
                <button 
                  type="submit"
                  className="ml-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Objective</span>
                </button>
              </div>
            </form>

            {/* Smart Toolbar */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Active Objectives</h2>
              <button 
                onClick={smartReorganize}
                className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1 transition-colors bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Smart Sort</span>
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm bg-slate-900/40 rounded-3xl border border-slate-800">
                  No tasks added yet. Start planning your day above!
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${task.completed ? 'bg-slate-900/30 border-slate-900 opacity-60' : 'bg-slate-950/80 border-indigo-500/20 shadow-md hover:border-indigo-500/40'}`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleTask(task.id)} 
                        className="text-indigo-400 hover:text-indigo-300 transition-colors flex-shrink-0"
                      >
                        {task.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Circle className="w-6 h-6 text-slate-500" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 uppercase font-bold border border-indigo-500/20">
                            {task.category}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-indigo-400" /> {task.duration}m
                          </span>
                          <span className="text-[10px] text-cyan-400 font-bold">
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
              <h2 className="text-xl font-extrabold text-white">Deep Focus Engine</h2>
              <p className="text-xs text-indigo-300 mt-1">Isolate distractions and maximize daily output</p>
            </div>

            {/* Timer Display Circle */}
            <div className="relative w-64 h-64 rounded-full border-4 border-indigo-500/30 flex items-center justify-center bg-gradient-to-br from-indigo-950/80 to-slate-900 shadow-2xl shadow-indigo-600/20">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20 animate-pulse pointer-events-none" />
              <div className="text-5xl font-black tracking-wider text-cyan-300 font-mono">
                {formatTime(focusTime)}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsFocusRunning(!isFocusRunning)}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/40 transition-all active:scale-95"
              >
                {isFocusRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isFocusRunning ? 'Pause Session' : 'Start Focus'}</span>
              </button>
              <button 
                onClick={() => { setIsFocusRunning(false); setFocusTime(25 * 60); }}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white p-3.5 rounded-2xl transition-colors shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Journals & Achievements Feed</h2>
                <p className="text-xs text-indigo-300">Share your daily progress and photos with the community</p>
              </div>
            </div>

            {/* Create Post Form */}
            <form onSubmit={addPost} className="bg-slate-950/90 border border-indigo-500/30 rounded-3xl p-4 shadow-xl space-y-3">
              <div className="flex items-center gap-3">
                <img src={userAvatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-indigo-500" />
                <span className="text-xs font-bold text-slate-200">{userName}</span>
              </div>
              <textarea 
                placeholder="What did you achieve today? Share your thoughts or photos..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex items-center justify-between pt-1">
                <input 
                  type="text" 
                  placeholder="Optional image URL..."
                  value={newPostImage}
                  onChange={(e) => setNewPostImage(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 w-1/2 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              </div>
            </form>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-950/80 border border-indigo-500/20 rounded-3xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover border border-indigo-500" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{post.author}</h4>
                        <span className="text-[10px] text-slate-400">{post.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">{post.content}</p>

                  {post.image && (
                    <div className="rounded-2xl overflow-hidden border border-indigo-500/20 max-h-64">
                      <img src={post.image} alt="Post media" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-900">
                    <button 
                      onClick={() => likePost(post.id)}
                      className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-semibold bg-pink-500/10 px-3 py-1 rounded-xl border border-pink-500/20 transition-all"
                    >
                      <Flame className="w-3.5 h-3.5 fill-pink-400" />
                      <span>{post.likes} Likes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-base font-bold text-white">System Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-indigo-500/30 p-5 rounded-3xl shadow-xl">
                <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Total XP</span>
                <p className="text-3xl font-black text-cyan-300 mt-2">{xp}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Rank: Level {level}</span>
              </div>
              <div className="bg-slate-950/80 border border-indigo-500/30 p-5 rounded-3xl shadow-xl">
                <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Active Streak</span>
                <p className="text-3xl font-black text-amber-400 mt-2">{streak} Days</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Unstoppable momentum</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-base font-bold text-white">Badges & Trophies</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-indigo-500/40 p-4 rounded-3xl flex items-center gap-3.5 shadow-xl">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">First Step</h3>
                  <p className="text-[10px] text-indigo-300 mt-0.5">Initiated system</p>
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-3xl flex items-center gap-3.5 opacity-60">
                <div className="p-3 bg-slate-900 text-slate-500 rounded-2xl">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400">Deep Thinker</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">10h focus goal</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-16 border-t border-indigo-500/20 bg-slate-900/80 backdrop-blur-xl px-4 flex items-center justify-around fixed bottom-0 left-0 right-0 z-40 shadow-2xl">
        <button 
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'today' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Target className="w-5 h-5" />
          <span>Today</span>
        </button>
        <button 
          onClick={() => setActiveTab('focus')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'focus' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Clock className="w-5 h-5" />
          <span>Focus</span>
        </button>
        <button 
          onClick={() => setActiveTab('social')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'social' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <ImageIcon className="w-5 h-5" />
          <span>Journals</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'stats' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Stats</span>
        </button>
        <button 
          onClick={() => setActiveTab('badges')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'badges' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Trophy className="w-5 h-5" />
          <span>Badges</span>
        </button>
      </nav>
    </div>
  );
}
