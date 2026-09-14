import React, { useState, useEffect } from 'react';
import { 
  Play, CheckCircle, Flame, Trophy, Clock, Zap, Menu, X, 
  Calendar, BarChart2, Plus, Sparkles, Smartphone,
  Award, Brain, CheckSquare, Trash2
} from 'lucide-react';
import { Task, UserStats } from './types';

export default function App() {
  // Navigation & Drawer State
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'analytics' | 'badges'>('today');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // App Data State (شاشة فارغة تماماً للمستخدم الجديد)
  const [tasks, setTasks] = useState<Task[]>([]);

  const [stats, setStats] = useState<UserStats>({
    streak: 0,
    lastCompletedDate: '',
    xp: 0,
    level: 1,
    unlockedBadges: []
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // New Task Inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Study');
  const [newTaskDuration, setNewTaskDuration] = useState(30);

  // PWA Install Prompt Listener
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  // Update active task whenever tasks list changes
  useEffect(() => {
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0) {
      setActiveTask(incompleteTasks[0]);
    } else {
      setActiveTask(null);
    }
  }, [tasks]);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      alert("لتثبيت التطبيق: اضغط على خيارات المتصفح (⋮ أو Share) ثم اختر 'Add to Home Screen'");
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updatedStatus = !t.completed;
        if (updatedStatus) {
          // إضافة نقاط عند الإنجاز
          setStats(s => {
            const newXp = s.xp + 20;
            const newLevel = Math.floor(newXp / 100) + 1;
            return { 
              ...s, 
              xp: newXp, 
              level: newLevel,
              streak: s.streak === 0 ? 1 : s.streak 
            };
          });
        }
        return { ...t, completed: updatedStatus };
      }
      return t;
    }));
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const currentTime = new Date();
    const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    setNewTaskTitle('');
  };

  const smartReorganize = () => {
    if (tasks.length === 0) {
      alert("لا توجد مهام حالياً لإعادة ترتيبها!");
      return;
    }
    const sorted = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
    setTasks(sorted);
    alert("تمت إعادة ترتيب المهام ذكياً!");
  };

  const filteredTasks = selectedCategory === 'All' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1️⃣ NAVBAR - شريط علوي أنيق */}
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

        {/* إحصائيات مستخدم جديد (0 Days / Lvl 1) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full text-xs font-semibold border border-amber-400/20">
            <Flame className="w-4 h-4" />
            <span>{stats.streak} Days</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-400/20">
            <Trophy className="w-4 h-4" />
            <span>Lvl {stats.level} ({stats.xp} XP)</span>
          </div>
        </div>
      </header>

      {/* 2️⃣ SIDEBAR DRAWER - القائمة الجانبية */}
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

              {/* أزرار التبويبات الرئيسية */}
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

              {/* تصفية التصنيفات */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">تصفية حسب التصنيف</label>
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

              {/* خيارات إضافية */}
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
              tempo. productivity app v1.3
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ MAIN CONTENT */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* 🔹 تبويب اليوم (Today Tab) */}
        {activeTab === 'today' && (
          <>
            {/* نموذج إضافة مهمة جديدة */}
            <form onSubmit={addTask} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <input 
                type="text"
                placeholder="ما هي مهمتك التالية؟..."
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

                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition text-xs font-semibold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> إضافة
                </button>
              </div>
            </form>

            {/* بطاقة المهمة الحالية (تظهر فقط لو في مهمة قائمة) */}
            {activeTask ? (
              <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    التركيز الحالي (NOW)
                  </span>
                  <span className="text-sm font-mono text-slate-400">{activeTask.startTime} ({activeTask.duration} min)</span>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">{activeTask.title}</h2>
                <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  التصنيف: <span className="text-slate-200">{activeTask.category}</span>
                </p>

                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20">
                  <Play className="w-5 h-5 fill-current" />
                  بدء وضع التركيز (Focus Mode)
                </button>
              </div>
            ) : (
              /* رسالة ترحيبية للمستخدم الجديد عندما تكون القائمة فارغة */
              <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-6">
                <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300 mb-1">لا توجد مهام حالياً</h3>
                <p className="text-xs text-slate-500">ابدأ بإضافة أول مهمة لك في النموذج أعلاه لتنظيم يومك!</p>
              </div>
            )}

            {/* رأس وتفاصيل قائمة المهام */}
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

                      <button 
                        onClick={(e) => deleteTask(task.id, e)}
                        className="p-1.5 text-slate-600 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* 🔹 تبويب الإحصائيات (Analytics Tab) */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">تحليل الإنتاجية والأداء</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">إجمالي المهام المكتملة</span>
                <span className="text-2xl font-bold text-indigo-400">{tasks.filter(t => t.completed).length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">معدل الإنجاز</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 🔹 تبويب الإنجازات (Badges Tab) */}
        {activeTab === 'badges' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">الأوسمة والإنجازات</h2>
            {stats.unlockedBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {stats.unlockedBadges.map((badge, idx) => (
                  <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-amber-500/20 flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{badge}</h4>
                      <span className="text-[10px] text-slate-500">مفتوح</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
                أنجز مهامك الأولى لفتح أوسمتك الأولى!
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
                    }
