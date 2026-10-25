import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  CheckCircle,
  Database,
  Cpu,
  Shield,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ onProfileUpdated, onSeedDemo, seeding }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [learningLevel, setLearningLevel] = useState('Intermediate');
  const [dailyTime, setDailyTime] = useState(120);
  const [studyGoals, setStudyGoals] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setName(data.name || '');
      setCourseName(data.course_name || '');
      setLearningLevel(data.learning_level || 'Intermediate');
      setDailyTime(data.daily_available_time || 120);
      setStudyGoals(data.study_goals || '');
    } catch (err) {
      console.error('Failed to load profile settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);
      const updated = await api.updateProfile({
        name,
        course_name: courseName,
        learning_level: learningLevel,
        daily_available_time: parseInt(dailyTime),
        study_goals: studyGoals,
      });
      setProfile(updated);
      setSaveSuccess(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-bold text-white">Student Profile & Settings</h1>
        <p className="text-xs text-slate-400">
          Configure your academic parameters, daily study target, and AI engine preferences.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Student Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Student Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Current Major / Degree</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Current Learning Level</label>
            <select
              value={learningLevel}
              onChange={(e) => setLearningLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner (Foundational concepts & simple analogies)</option>
              <option value="Intermediate">Intermediate (Core syllabus & standard problem sets)</option>
              <option value="Advanced">Advanced (Rigorous mathematical proofs & complex systems)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Daily Available Study Time ({dailyTime} Minutes)
            </label>
            <input
              type="number"
              min="30"
              max="600"
              step="15"
              value={dailyTime}
              onChange={(e) => setDailyTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Academic Study Goals</label>
            <textarea
              rows="3"
              value={studyGoals}
              onChange={(e) => setStudyGoals(e.target.value)}
              placeholder="e.g. Master semester syllabus, score >85% in final exam, clarify difficult topics..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Profile settings successfully saved!</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">Updates are synchronized immediately.</span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      {/* System Architecture & Engine Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>AI Architecture & Engine Specs</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Vector Database</span>
            </div>
            <p className="text-slate-400">
              In-Memory Scikit-Learn TF-IDF Cosine Similarity with persistent SQLite chunk storage.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Mode / Fallback</span>
            </div>
            <p className="text-slate-400">
              Works 100% offline via local grounded RAG generation, with plug-and-play OpenAI / Gemini API support in <code className="text-indigo-300">.env</code>.
            </p>
          </div>
        </div>

        {/* Demo Data Reset Action */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-200">Reset Demo Curriculum & Notes</p>
            <p className="text-[11px] text-slate-400">
              Restores Computer Networks sample student, 10 topics, notes, and quiz history.
            </p>
          </div>

          <button
            type="button"
            onClick={onSeedDemo}
            disabled={seeding}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-indigo-400 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Resetting...' : 'Reload Demo Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
