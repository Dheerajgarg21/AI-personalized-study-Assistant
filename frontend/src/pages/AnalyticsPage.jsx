import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [profile, setProfile] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [prof, prog] = await Promise.all([api.getProfile(), api.getProgress()]);
      setProfile(prof);
      setProgressData(prog);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { learning_states = [], recent_activities = [] } = profile || {};
  const { activity_timeline = [], quiz_trend = [], topic_performance = [] } = progressData || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Analytics Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Cognitive Learning Model
            </span>
            <span className="text-xs text-slate-400">Section 3.A State Representation</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Student State & Progress Analytics</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Displays the student's dynamic learning state vector: mastery score, confidence, last studied timestamp, quiz accuracy, and spaced revision flags.
          </p>
        </div>

        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span>{showRawJson ? 'Hide Raw JSON' : 'Export Learning State JSON'}</span>
        </button>
      </div>

      {/* Raw JSON Modal / Dropdown */}
      {showRawJson && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-indigo-400">
              Structured Student Learning State Output:
            </span>
            <span>{learning_states.length} Topics Indexed</span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-xs text-emerald-400 font-mono overflow-x-auto max-h-72">
            {JSON.stringify(learning_states, null, 2)}
          </pre>
        </div>
      )}

      {/* Structured Learning State Table (Mandatory Prompt Feature) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Student Topic Learning States</h3>
          </div>
          <span className="text-xs text-slate-400">{learning_states.length} Curriculum Topics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Topic Name</th>
                <th className="py-3 px-4">Mastery Score</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Last Studied</th>
                <th className="py-3 px-4">Quiz Accuracy</th>
                <th className="py-3 px-4">Revision Needed</th>
                <th className="py-3 px-4">State Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {learning_states.map((st) => {
                const masteryPct = Math.round(st.mastery_score * 100);
                const confPct = Math.round(st.confidence * 100);
                const accPct = Math.round(st.quiz_accuracy * 100);

                return (
                  <tr key={st.topic_id} className="hover:bg-slate-950/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{st.topic}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{masteryPct}%</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              masteryPct >= 80
                                ? 'bg-emerald-500'
                                : masteryPct < 50
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${masteryPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-purple-400 font-semibold">{confPct}%</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {st.last_studied ? st.last_studied : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{accPct}%</td>
                    <td className="py-3.5 px-4">
                      {st.revision_needed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Due
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">Current</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          st.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : st.status === 'needs_revision'
                            ? 'bg-rose-500/10 text-rose-400'
                            : st.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {st.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Analytics Grid: Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Minutes Area Chart */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Daily Study Activity (Last 7 Days)</h3>
            <span className="text-xs text-slate-400">Minutes Studied</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMins)" name="Study Minutes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Progression Curve */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Quiz Accuracy Trajectory</h3>
            <span className="text-xs text-slate-400">Test Scores</span>
          </div>
          <div className="h-64 w-full">
            {quiz_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quiz_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2.5} name="Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No quiz submissions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Learning Activity History Log Feed */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Learning Activity History Log</h3>
          </div>
          <span className="text-xs text-slate-400">{recent_activities.length} Recent Events</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {recent_activities.length > 0 ? (
            recent_activities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      act.activity_type === 'quiz_taken'
                        ? 'bg-emerald-400'
                        : act.activity_type === 'chat_question'
                        ? 'bg-indigo-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-slate-200 capitalize">
                      {act.activity_type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500 mx-2">&bull;</span>
                    <span className="text-slate-400">{act.notes}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 text-slate-500 text-[11px]">
                  {new Date(act.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">No learning events logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
