import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function CoursesPage({ onNavigate, onSelectTopicForQuiz, onSelectTopicForChat }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingTopicId, setCompletingTopicId] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getCourses();
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTopic = async (topicId) => {
    try {
      setCompletingTopicId(topicId);
      await api.completeTopicDirect(topicId);
      await loadCourses();
    } catch (err) {
      alert(`Error completing topic: ${err.message}`);
    } finally {
      setCompletingTopicId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group topics by unit
  const unitsMap = {};
  if (selectedCourse && selectedCourse.topics) {
    selectedCourse.topics.forEach((topic) => {
      const unit = topic.unit_or_chapter || 'Unit 1';
      if (!unitsMap[unit]) {
        unitsMap[unit] = [];
      }
      unitsMap[unit].push(topic);
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Course Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {selectedCourse?.code || 'CS301'}
            </span>
            <span className="text-xs text-slate-400">Curriculum Syllabus</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{selectedCourse?.title}</h1>
          <p className="text-xs text-slate-400 max-w-2xl">{selectedCourse?.description}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold text-white">{selectedCourse?.topics?.length || 0} Topics</div>
            <p className="text-xs text-slate-400">Total in Course</p>
          </div>
          <button
            onClick={() => onNavigate('knowledge-map')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Open Knowledge Graph
          </button>
        </div>
      </div>

      {/* Topics by Unit Breakdown */}
      <div className="space-y-8">
        {Object.entries(unitsMap).map(([unitName, topics]) => (
          <div key={unitName} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{unitName}</span>
              </h3>
              <span className="text-xs text-slate-400">{topics.length} Topics</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((t) => {
                const masteryPct = Math.round((t.mastery_score || 0) * 100);
                const isCompleted = t.status === 'completed' || masteryPct >= 80;
                const isWeak = masteryPct > 0 && masteryPct < 50;

                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-400'
                                : isWeak
                                ? 'bg-rose-400'
                                : masteryPct > 0
                                ? 'bg-amber-400'
                                : 'bg-slate-600'
                            }`}
                          />
                          <h4 className="text-sm font-bold text-white">{t.name}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            t.difficulty === 'hard'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : t.difficulty === 'medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {t.difficulty}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>

                      {/* Prerequisites info */}
                      {t.prerequisite_names && t.prerequisite_names.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Requires: {t.prerequisite_names.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Student Mastery</span>
                          <span
                            className={`font-bold ${
                              isCompleted
                                ? 'text-emerald-400'
                                : isWeak
                                ? 'text-rose-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {masteryPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isWeak
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${masteryPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleCompleteTopic(t.id)}
                          disabled={completingTopicId === t.id || isCompleted}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Mastered' : 'Mark Studied'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectTopicForChat(t.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-colors cursor-pointer"
                            title="Ask AI about this topic"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectTopicForQuiz(t.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Quiz</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
