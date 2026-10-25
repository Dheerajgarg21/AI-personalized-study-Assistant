import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage({ data, onNavigate, onCompleteTask, loading }) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading personalized student dashboard...</p>
        </div>
      </div>
    );
  }

  const { student, stats, weak_topics, strong_topics, topic_performance, quiz_trend, today_tasks, top_recommendation } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner with Agent Recommendation Highlight */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive Agent Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {student?.name}! 👋
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your overall course mastery is currently at{' '}
              <span className="font-bold text-indigo-400">{stats?.overall_progress_percentage}%</span>.
              {top_recommendation ? (
                <> Recommended next action: <strong className="text-amber-400">{top_recommendation.title}</strong>.</>
              ) : (
                ' Continue with today\'s scheduled tasks below.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('planner')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>View Study Plan</span>
            </button>
            <button
              onClick={() => onNavigate('quiz')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Take Quiz</span>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Overall Mastery</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats?.overall_progress_percentage}%</div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.overall_progress_percentage || 0}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {stats?.completed_topics} of {stats?.total_topics} topics completed
          </p>
        </div>

        {/* Study Streak Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Learning Streak</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{student?.streak} Days</div>
            <p className="text-[11px] text-amber-400 font-medium mt-1">Consistent daily progress</p>
          </div>
          <p className="text-[11px] text-slate-400">
            Daily goal: {student?.daily_goal_minutes} mins/day
          </p>
        </div>

        {/* Completed Topics */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Topics Mastered</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats?.completed_topics}</div>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              {stats?.pending_topics} pending in curriculum
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            {stats?.strong_topics_count} classified as strong topics
          </p>
        </div>

        {/* Study Time */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Study Time</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{student?.total_study_hours} hrs</div>
            <p className="text-[11px] text-purple-400 font-medium mt-1">Logged active learning</p>
          </div>
          <p className="text-[11px] text-slate-400">Includes chats, tests, and task completions</p>
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Agent Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Today's Study Schedule</h3>
              <p className="text-xs text-slate-400">Tasks tailored to your daily available time</p>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {today_tasks && today_tasks.length > 0 ? (
            <div className="space-y-2.5">
              {today_tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    task.is_completed
                      ? 'bg-slate-950/40 border-slate-800 opacity-60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onCompleteTask(task.id, !task.is_completed)}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                        task.is_completed
                          ? 'bg-emerald-500 text-white'
                          : 'border border-slate-600 hover:border-indigo-400'
                      }`}
                    >
                      {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          task.is_completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.duration_minutes} mins
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 capitalize">
                    {task.task_type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800 space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">No tasks scheduled for today</p>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Generate a personalized study plan &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Adaptive Agent Recommendations (1 col) */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Adaptive Learning Agent</h3>
                <p className="text-xs text-slate-400">Intelligent next-step recommendations</p>
              </div>
            </div>

            {top_recommendation ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {top_recommendation.priority} Priority
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium capitalize">
                    {top_recommendation.action_type.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  {top_recommendation.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {top_recommendation.description}
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 text-[11px] text-slate-300 border border-slate-800">
                  <span className="font-semibold text-indigo-400">Agent Reason:</span>{' '}
                  {top_recommendation.reason}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800">
                <p className="text-xs text-slate-400">No active gaps found. All topics on track!</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('analytics')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Full Learning State Model</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Weak & Strong Topics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Topics Requiring Revision</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {weak_topics?.length || 0} Topics
            </span>
          </div>

          {weak_topics && weak_topics.length > 0 ? (
            <div className="space-y-2">
              {weak_topics.map((topicName, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-slate-300">{topicName}</span>
                  <button
                    onClick={() => onNavigate('chat')}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Ask AI &rarr;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              No weak topics detected. Great consistency!
            </p>
          )}
        </div>

        {/* Strong Topics */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Strong & Mastered Topics</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {strong_topics?.length || 0} Topics
            </span>
          </div>

          {strong_topics && strong_topics.length > 0 ? (
            <div className="space-y-2">
              {strong_topics.map((topicName, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-slate-300">{topicName}</span>
                  <span className="text-[11px] font-semibold text-emerald-400">&ge; 80% Mastery</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              Take quizzes to reach strong mastery on curriculum topics.
            </p>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts: Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Mastery Bar Chart */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white">Curriculum Topic Mastery (%)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topic_performance || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="mastery" fill="#6366f1" radius={[4, 4, 0, 0]} name="Mastery %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Accuracy Trend Line Chart */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white">Quiz Performance History</h3>
          <div className="h-64 w-full">
            {quiz_trend && quiz_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quiz_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Accuracy %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Take your first quiz to generate the accuracy trend curve.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
