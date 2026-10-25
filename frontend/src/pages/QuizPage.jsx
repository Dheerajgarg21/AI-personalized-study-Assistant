import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';

export default function QuizPage({ initialTopicId, onQuizSubmitted }) {
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [historyAttempts, setHistoryAttempts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);

  const loadData = async () => {
    try {
      const courseList = await api.getCourses();
      setCourses(courseList);
      if (courseList.length > 0) {
        const allTopics = courseList.flatMap((c) => c.topics || []);
        setTopics(allTopics);
        if (!selectedTopicId && allTopics.length > 0) {
          setSelectedTopicId(allTopics[0].id);
        }
      }
      loadHistory();
    } catch (err) {
      console.error('Failed to load quiz options', err);
    }
  };

  const loadHistory = async () => {
    try {
      const attempts = await api.getQuizAttempts();
      setHistoryAttempts(attempts);
    } catch (err) {
      console.error('Failed to load quiz history', err);
    }
  };

  const handleGenerateQuiz = async (e) => {
    e?.preventDefault();
    try {
      setGenerating(true);
      setQuizResult(null);
      setUserAnswers({});
      const quiz = await api.generateQuiz({
        topic_id: selectedTopicId ? parseInt(selectedTopicId) : null,
        num_questions: parseInt(numQuestions),
        difficulty: difficulty,
      });
      setActiveQuiz(quiz);
    } catch (err) {
      alert(`Quiz generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId, optionKey) => {
    if (quizResult) return; // Prevent modifying answers after submission
    setUserAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionKey,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < activeQuiz.questions.length) {
      if (!window.confirm(`You answered ${answeredCount} of ${activeQuiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const result = await api.submitQuiz({
        quiz_id: activeQuiz.id,
        answers: userAnswers,
      });
      setQuizResult(result);
      await loadHistory();
      if (onQuizSubmitted) onQuizSubmitted();
    } catch (err) {
      alert(`Failed to submit quiz: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const answeredQuestionsCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Quiz Generator Toolbar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MCQ Generator
              </span>
              <span className="text-xs text-slate-400">RAG Grounded Assessment</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Quiz & Knowledge Testing</h1>
            <p className="text-xs text-slate-400">
              Evaluates concept retention, updates your real mastery score in the database, and drives adaptive agent recommendations.
            </p>
          </div>
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerateQuiz} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Topic</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.unit_or_chapter}: {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {['easy', 'medium', 'hard'].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`py-1.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Questions Count</label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="3">3 Questions (Quick check)</option>
              <option value="5">5 Questions (Standard)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generating Quiz...' : 'Generate New Quiz'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Quiz Card */}
      {activeQuiz && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden space-y-6">
          {/* Quiz Header Bar */}
          <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{activeQuiz.title}</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeQuiz.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Answer all questions and submit to update your mastery score.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-300 font-medium">
                Answered: <strong className="text-indigo-400">{answeredQuestionsCount}</strong> /{' '}
                {activeQuiz.questions.length}
              </span>
              {!quizResult && (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting || answeredQuestionsCount === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? 'Evaluating...' : 'Submit & Grade'}
                </button>
              )}
            </div>
          </div>

          {/* Submission Result Score Banner */}
          {quizResult && (
            <div className="mx-6 p-6 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Grading Complete
                  </span>
                  <h3 className="text-2xl font-extrabold text-white">
                    Score: {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">{quizResult.feedback}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Agent Recommendation:</p>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      {quizResult.recommended_action.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateQuiz}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>

              {quizResult.learning_state_update && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
                  <span>
                    Mastery Score Updated: <strong>{Math.round(quizResult.learning_state_update.old_mastery * 100)}%</strong> &rarr;{' '}
                    <strong className="text-emerald-400">{Math.round(quizResult.learning_state_update.new_mastery * 100)}%</strong>
                  </span>
                  <span className="capitalize font-semibold text-slate-300">
                    Status: {quizResult.learning_state_update.status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Questions List */}
          <div className="p-6 space-y-6">
            {activeQuiz.questions.map((q, idx) => {
              const review = quizResult?.reviews?.find((r) => r.question_id === q.id);
              const selectedOption = userAnswers[String(q.id)];

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    review
                      ? review.is_correct
                        ? 'bg-emerald-950/15 border-emerald-500/40'
                        : 'bg-rose-950/15 border-rose-500/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-sm font-semibold text-white leading-relaxed">
                      <span className="text-indigo-400 font-bold mr-2">Q{idx + 1}.</span>
                      {q.question_text}
                    </h4>

                    {review && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                          review.is_correct
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {review.is_correct ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {['A', 'B', 'C', 'D'].map((key) => {
                      const optionText =
                        key === 'A'
                          ? q.option_a
                          : key === 'B'
                          ? q.option_b
                          : key === 'C'
                          ? q.option_c
                          : q.option_d;

                      const isSelected = selectedOption === key;
                      const isCorrectAnswer = review?.correct_answer === key;
                      const isWrongSelected = review && isSelected && !review.is_correct;

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => handleSelectOption(q.id, key)}
                          disabled={!!quizResult}
                          className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${
                            isCorrectAnswer
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-medium'
                              : isWrongSelected
                              ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                              : isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-medium shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrectAnswer
                                ? 'bg-emerald-500 text-white'
                                : isWrongSelected
                                ? 'bg-rose-500 text-white'
                                : isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {key}
                          </span>
                          <span className="leading-relaxed">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {review && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-indigo-400">Explanation & Citation:</p>
                      <p className="text-slate-400 leading-relaxed">{review.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Attempts Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Past Assessment Attempts</h3>
          </div>
          <span className="text-xs text-slate-400">{historyAttempts.length} Records</span>
        </div>

        {historyAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Quiz Title</th>
                  <th className="py-2.5 px-4">Score</th>
                  <th className="py-2.5 px-4">Accuracy</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-950/40">
                    <td className="py-3 px-4 font-semibold text-slate-200">{attempt.quiz_title}</td>
                    <td className="py-3 px-4">
                      {attempt.score} / {attempt.total_questions}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-400">{attempt.percentage}%</td>
                    <td className="py-3 px-4 text-slate-400">{attempt.date_attempted}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={attempt.feedback}>
                      {attempt.feedback}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">No previous attempts recorded.</p>
        )}
      </div>
    </div>
  );
}
