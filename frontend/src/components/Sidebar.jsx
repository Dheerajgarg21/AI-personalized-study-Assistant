import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquareCode,
  CalendarDays,
  Network,
  GraduationCap,
  TrendingUp,
  Settings,
  Sparkles,
  Flame,
  UserCheck,
} from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate, student, onSeedDemo, seeding }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'chat', label: 'AI Study Chat', icon: MessageSquareCode, badge: 'RAG' },
    { id: 'planner', label: 'Study Planner', icon: CalendarDays },
    { id: 'knowledge-map', label: 'Knowledge Map', icon: Network },
    { id: 'quiz', label: 'Quiz & Practice', icon: GraduationCap },
    { id: 'analytics', label: 'Analytics & State', icon: TrendingUp },
    { id: 'settings', label: 'Settings & Profile', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Logo */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            <Sparkles className="w-5 h-5 text-indigo-100 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
              StudySense <span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Adaptive Study Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Learning System
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Student Badge & Quick Demo Action */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-300">
              {student?.current_streak || 3} Day Streak
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
            {student?.learning_level || 'Intermediate'}
          </span>
        </div>

        <button
          onClick={onSeedDemo}
          disabled={seeding}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 transition-all cursor-pointer disabled:opacity-50"
          title="Reset and reload Computer Networks course with pre-indexed notes and quiz attempts"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>{seeding ? 'Seeding Data...' : 'Reload Demo Data'}</span>
        </button>
      </div>
    </aside>
  );
}
