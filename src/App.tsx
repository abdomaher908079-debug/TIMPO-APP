import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, CheckCircle2, Circle, AlertTriangle, Zap, Plus, 
  Calendar, Sun, Trash2, Check, Sparkles, Bell
} from 'lucide-react';
import { Task, ScheduleHealth } from './types';

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Review neck fasciae anatomy', startTime: '10:40', duration: 90, priority: 'High', completed: false, category: 'University' },
  { id: '2', title: 'Epidemiology: 10 key definitions', startTime: '14:00', duration: 45, priority: 'High', completed: false, category: 'University' },
  { id: '3', title: '30 min brisk walk', startTime: '18:30', duration: 30, priority: 'Medium', completed: false, category: 'Personal' },
  { id: '4', title: 'Prepare tomorrow schedule & goals', startTime: '21:30', duration: 20, priority: 'Low', completed: false, category: 'Routine' }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tempo_app_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMorningBrief, setShowMorningBrief] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('12:00');
  const [newDuration, setNewDuration] = useState('45');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newCategory, setNewCategory] = useState('University');

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendSystemNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('tempo_app_tasks', JSON.stringify(tasks));
  }, [tasks]);

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
    setNotificationMsg('⚡ Your day has been successfully reorganized by priority!');
    sendSystemNotification('TEMPO — Schedule Updated', 'Your remaining tasks have been automatically reorganized.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const toggleTask = (id: string) => {
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
      category: newCategory
    };

    setTasks([...tasks, newTask]);
    setNewTitle('');
    setShowTaskModal(false);
    sendSystemNotification('Task Added', `"${newTitle}" scheduled for ${newStart}`);
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {notificationMsg && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">{notificationMsg}</span>
        </div>
      )}

      <header className="border-b border-white/10 bg-[#090D16]/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              tempo<span className="text-indigo-500">.</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            {scheduleStats.health === 'ON_TRACK' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-400">● On track</span>
              </>
            )}
            {scheduleStats.health === 'SLIPPING' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-amber-400">● Falling behind</span>
              </>
            )}
            {scheduleStats.health === 'CRITICAL' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-rose-400">● Needs attention</span>
              </>
            )}
          </div>

          <button
            onClick={() => setShowMorningBrief(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Morning Brief
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
              <div>
                <p className="text-xs uppercase font-semibold tracking-widest text-indigo-400 mb-1">Overview</p>
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
                <p className="text-xs text-slate-400">Work Remaining</p>
                <p className="text-lg font-bold text-indigo-400 mt-1">{formatMinutes(scheduleStats.remainingMinutes)}</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                <p className="text-xs text-slate-400">Time Available</p>
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
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                NOW FOCUS
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
                  <p className="text-xs text-slate-400 mt-1">Category: <span className="text-slate-200">{currentFocus.task.category}</span></p>
                </div>
                <button
                  onClick={() => toggleTask(currentFocus.task.id)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4" /> Mark Complete
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Your schedule is currently clear! Enjoy your break.</p>
            )}
          </div>

          {scheduleStats.health !== 'ON_TRACK' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Your schedule is slipping</h4>
                  <p className="text-xs text-amber-200/70 mt-0.5">
                    You have {formatMinutes(scheduleStats.remainingMinutes)} of remaining work, but only {formatMinutes(scheduleStats.availableMinutes)} available time today.
                  </p>
                </div>
              </div>
              <button
                onClick={handleFixMyDay}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shrink-0 shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-3.5 h-3.5 fill-current" /> ⚡ Fix My Day
              </button>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Today's Schedule
                <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              </h3>
              <div className="flex items-center gap-3">
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
                  <p className="text-sm">Your schedule is completely clear.</p>
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all glass-card-hover ${
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
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
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
                        </div>
                      </div>
                    </div>

                    <button onClick={() => deleteTask(t.id)} className="text-slate-500 hover:text-rose-400 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-indigo-950/40 to-slate-900">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400 fill-current" /> Smart Schedule Assistant
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Auto-reorganize your remaining day. High-priority tasks are placed first, with small reasonable buffers in between.
            </p>
            <button
              onClick={handleFixMyDay}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              ⚡ Fix My Day
            </button>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-white">Push Notifications</p>
                <p className="text-[10px] text-slate-400">Get schedule alerts on mobile</p>
              </div>
            </div>
            <button
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      sendSystemNotification('TEMPO', 'Push notifications enabled!');
                    }
                  });
                }
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-indigo-300 rounded-lg border border-white/10 font-medium"
            >
              Enable
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" /> Daily Timeline
            </h3>

            <div className="space-y-4 relative border-l border-white/10 pl-4 ml-2">
              {tasks.map((t) => (
                <div key={t.id} className="relative">
                  <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#090D16] ${
                    t.completed ? 'bg-emerald-400' : 'bg-indigo-500'
                  }`}></div>
                  <div className="text-xs font-mono text-slate-400">{t.startTime}</div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">{t.title}</div>
                  <div className="text-[10px] text-slate-500">{t.duration} minutes</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                  placeholder="e.g. Study Anatomy Chapter 4"
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

              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e: any) => setNewPriority(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="High" className="bg-[#111726]">High Priority</option>
                  <option value="Medium" className="bg-[#111726]">Medium Priority</option>
                  <option value="Low" className="bg-[#111726]">Low Priority</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 py-2.5 bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
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

      {showMorningBrief && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 bg-[#111726] space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sun className="w-5 h-5" /> Morning Brief
            </div>
            <h3 className="text-xl font-bold text-white">Good Morning!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have <span className="font-bold text-white">{tasks.length} tasks</span> scheduled for today totaling <span className="font-bold text-indigo-400">{formatMinutes(scheduleStats.totalPlannedMinutes)}</span> of planned work.
            </p>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Today's Most Important Focus</p>
              <p className="text-sm font-bold text-white">
                {tasks.find(t => t.priority === 'High')?.title || tasks[0]?.title || 'No tasks added'}
              </p>
            </div>
            <button
              onClick={() => setShowMorningBrief(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
            >
              Let's Start The Day
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
