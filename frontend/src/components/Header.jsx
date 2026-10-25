import React from 'react';
import { Bot, User, BookOpen, Clock, AlertCircle } from 'lucide-react';

export default function Header({ currentPage, student, onNavigate }) {
  const pageTitles = {
    dashboard: 'Learning Dashboard',
    courses: 'Curriculum & Course Outline',
    chat: 'RAG AI Study Chatbot',
    planner: 'Personalized Study Planner',
    'knowledge-map': 'Course Knowledge Graph',
    quiz: 'Adaptive Quiz & Assessment',
    analytics: 'Learning State & Analytics',
    settings: 'Student Profile & Settings',
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-white tracking-tight">
          {pageTitles[currentPage] || 'Study Assistant'}
        </h2>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>{student?.course_name || 'Computer Science'}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Shortcut Buttons */}
        <button
          onClick={() => onNavigate('chat')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ask Study AI</span>
        </button>

        <button
          onClick={() => onNavigate('quiz')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
        >
          <span>Test Knowledge</span>
        </button>

        {/* Student Avatar / Profile Link */}
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 pl-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-indigo-400/40 group-hover:ring-2 group-hover:ring-indigo-400 transition-all">
            {student?.name ? student.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
              {student?.name || 'Alex Morgan'}
            </p>
            <p className="text-[10px] text-slate-400">{student?.learning_level || 'Intermediate'}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
