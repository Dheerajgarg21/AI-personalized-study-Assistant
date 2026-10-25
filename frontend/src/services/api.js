const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = options.headers || {};

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'POST', body: JSON.stringify(data) }),

  // Courses
  getCourses: () => request('/courses'),
  getCourse: (courseId) => request(`/courses/${courseId}`),
  completeTopicDirect: (topicId) => request(`/topics/${topicId}/complete`, { method: 'POST' }),

  // Documents
  getDocuments: () => request('/documents'),
  uploadDocument: (formData) => request('/documents/upload', { method: 'POST', body: formData }),
  deleteDocument: (docId) => request(`/documents/${docId}`, { method: 'DELETE' }),

  // Chat / RAG
  sendChatMessage: (data) => request('/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Study Plan
  getStudyPlan: (courseId) => request(courseId ? `/study-plan?course_id=${courseId}` : '/study-plan'),
  generateStudyPlan: (data) => request('/study-plan/generate', { method: 'POST', body: JSON.stringify(data) }),
  completeTask: (taskId, isCompleted, notes) =>
    request(`/study-plan/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ is_completed: isCompleted, notes }),
    }),

  // Knowledge Map
  getKnowledgeMap: (courseId) => request(courseId ? `/knowledge-map?course_id=${courseId}` : '/knowledge-map'),

  // Quiz
  generateQuiz: (data) => request('/quiz/generate', { method: 'POST', body: JSON.stringify(data) }),
  getQuiz: (quizId) => request(`/quiz/${quizId}`),
  submitQuiz: (data) => request('/quiz/submit', { method: 'POST', body: JSON.stringify(data) }),
  getQuizAttempts: () => request('/quiz/history/attempts'),

  // Analytics & Progress
  getProgress: () => request('/progress'),
  getRecommendations: (courseId) => request(courseId ? `/recommendations?course_id=${courseId}` : '/recommendations'),

  // Demo Seed
  seedDemoData: () => request('/demo/seed', { method: 'POST' }),
};
