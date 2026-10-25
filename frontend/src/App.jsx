import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import ChatPage from './pages/ChatPage';
import PlannerPage from './pages/PlannerPage';
import KnowledgeMapPage from './pages/KnowledgeMapPage';
import QuizPage from './pages/QuizPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [student, setStudent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Cross-page navigation payloads
  const [initialChatQuery, setInitialChatQuery] = useState('');
  const [initialQuizTopicId, setInitialQuizTopicId] = useState('');

  useEffect(() => {
    loadAppInitialData();
  }, []);

  const loadAppInitialData = async () => {
    try {
      setLoading(true);
      const [prof, progress] = await Promise.all([api.getProfile(), api.getProgress()]);
      setStudent(prof);
      setDashboardData(progress);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [prof, progress] = await Promise.all([api.getProfile(), api.getProgress()]);
      setStudent(prof);
      setDashboardData(progress);
    } catch (err) {
      console.error('Refresh error', err);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await api.seedDemoData();
      await refreshData();
      alert('Demo data successfully reloaded! Computer Networks curriculum, sample notes, and progress are ready.');
    } catch (err) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCompleteTask = async (taskId, isCompleted) => {
    try {
      await api.completeTask(taskId, isCompleted);
      await refreshData();
    } catch (err) {
      console.error('Task complete error', err);
    }
  };

  const handleSelectTopicForQuiz = (topicId) => {
    setInitialQuizTopicId(topicId);
    setCurrentPage('quiz');
  };

  const handleSelectTopicForChat = (topicName) => {
    setInitialChatQuery(topicName);
    setCurrentPage('chat');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        student={student}
        onSeedDemo={handleSeedDemo}
        seeding={seeding}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentPage={currentPage} student={student} onNavigate={setCurrentPage} />

        <main className="flex-1 overflow-y-auto px-6 py-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <DashboardPage
                data={dashboardData}
                onNavigate={setCurrentPage}
                onCompleteTask={handleCompleteTask}
                loading={loading}
              />
            )}

            {currentPage === 'courses' && (
              <CoursesPage
                onNavigate={setCurrentPage}
                onSelectTopicForQuiz={handleSelectTopicForQuiz}
                onSelectTopicForChat={handleSelectTopicForChat}
              />
            )}

            {currentPage === 'chat' && (
              <ChatPage initialQuery={initialChatQuery} />
            )}

            {currentPage === 'planner' && (
              <PlannerPage onTaskCompleted={refreshData} />
            )}

            {currentPage === 'knowledge-map' && (
              <KnowledgeMapPage
                onSelectTopicForQuiz={handleSelectTopicForQuiz}
                onSelectTopicForChat={handleSelectTopicForChat}
              />
            )}

            {currentPage === 'quiz' && (
              <QuizPage
                initialTopicId={initialQuizTopicId}
                onQuizSubmitted={refreshData}
              />
            )}

            {currentPage === 'analytics' && (
              <AnalyticsPage />
            )}

            {currentPage === 'settings' && (
              <SettingsPage
                onProfileUpdated={refreshData}
                onSeedDemo={handleSeedDemo}
                seeding={seeding}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
