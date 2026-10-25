import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  Flame,
  Check,
} from 'lucide-react';
import { api } from '../services/api';

export default function PlannerPage({ onTaskCompleted }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form options
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState(2);
  const [focusWeak, setFocusWeak] = useState(true);
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [revisionDays, setRevisionDays] = useState(3);

  useEffect(() => {
    loadCoursesAndPlan();
  }, []);

  const loadCoursesAndPlan = async () => {
    try {
      setLoading(true);
      const courseList = await api.getCourses();
      setCourses(courseList);

      const activeCourseId = courseList[0]?.id;
      if (activeCourseId) {
        setSelectedCourseId(activeCourseId);
        const plan = await api.getStudyPlan(activeCourseId);
        setStudyPlan(plan);
      }
    } catch (err) {
      console.error('Failed to load study plan', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (e) => {
    e?.preventDefault();
    if (!selectedCourseId) return;

    try {
      setGenerating(true);
      const plan = await api.generateStudyPlan({
        course_id: parseInt(selectedCourseId),
        exam_date: examDate,
        daily_available_hours: parseFloat(dailyHours),
        focus_weak_topics: focusWeak,
        include_breaks: includeBreaks,
        revision_frequency_days: parseInt(revisionDays),
      });
      setStudyPlan(plan);
    } catch (err) {
      alert(`Plan generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId, isCompleted) => {
    try {
      await api.completeTask(taskId, isCompleted);
      // Update local state smoothly
      setStudyPlan((prev) => {
        if (!prev) return prev;
        const updatedTasks = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: isCompleted } : t
        );
        const completedCount = updatedTasks.filter((t) => t.is_completed).length;
        return {
          ...prev,
          tasks: updatedTasks,
          completed_tasks_count: completedCount,
        };
      });
      if (onTaskCompleted) onTaskCompleted();
    } catch (err) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group tasks by date
  const tasksByDate = {};
  if (studyPlan?.tasks) {
    studyPlan.tasks.forEach((task) => {
      if (!tasksByDate[task.date]) {
        tasksByDate[task.date] = [];
      }
      tasksByDate[task.date].push(task);
    });
  }

  const completionPct =
    studyPlan?.total_tasks_count > 0
      ? Math.round((studyPlan.completed_tasks_count / studyPlan.total_tasks_count) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Planner Controls Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Schedule Generator
              </span>
              <span className="text-xs text-slate-400">Adaptive Spaced Scheduling</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Personalized Study Plan</h1>
            <p className="text-xs text-slate-400">
              Generates an optimized daily timeline prioritizing weak topics, unmastered prerequisites, and spaced revision slots.
            </p>
          </div>

          {studyPlan && (
            <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  {studyPlan.completed_tasks_count} / {studyPlan.total_tasks_count} Done
                </div>
                <p className="text-[11px] text-slate-400">{completionPct}% Plan Progress</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
                {completionPct}%
              </div>
            </div>
          )}
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-3 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Daily Study Hours ({dailyHours} hrs/day)
            </label>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              className="w-full accent-indigo-500 mt-2"
            />
          </div>

          <div className="flex flex-col justify-end space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={focusWeak}
                onChange={(e) => setFocusWeak(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              <span>Prioritize Weak Topics</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBreaks}
                onChange={(e) => setIncludeBreaks(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              <span>Include Rest Breaks</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Regenerating...' : 'Regenerate Plan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Daily Schedule Timeline */}
      <div className="space-y-6">
        {Object.keys(tasksByDate).length > 0 ? (
          Object.entries(tasksByDate).map(([dateStr, tasks]) => {
            const dateObj = new Date(dateStr);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const allCompleted = tasks.every((t) => t.is_completed);

            return (
              <div key={dateStr} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
                {/* Date Header */}
                <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-white">{formattedDate}</span>
                    {allCompleted && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Day Complete
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {tasks.reduce((sum, t) => sum + t.duration_minutes, 0)} mins total
                  </span>
                </div>

                {/* Day Tasks */}
                <div className="p-4 space-y-2.5">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        task.is_completed
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTask(task.id, !task.is_completed)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                            task.is_completed
                              ? 'bg-emerald-500 text-white'
                              : 'border border-slate-600 hover:border-indigo-400'
                          }`}
                        >
                          {task.is_completed && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              task.is_completed ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{task.notes}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 pl-8 sm:pl-0">
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {task.duration_minutes}m
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            task.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : task.priority === 'medium'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${
                            task.task_type === 'revision'
                              ? 'bg-amber-500/10 text-amber-400'
                              : task.task_type === 'practice_quiz'
                              ? 'bg-purple-500/10 text-purple-400'
                              : task.task_type === 'break'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {task.task_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Active Study Plan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Choose your exam date and daily available hours above, then click 'Regenerate Plan'.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
