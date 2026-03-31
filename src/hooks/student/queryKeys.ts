export const studentQueryKeys = {
  all: ['student'] as const,
  assignedQuizzes: (profileId: string) => ['student', 'assigned-quizzes', profileId] as const,
  quizDetails: (quizId: string) => ['student', 'quiz-details', quizId] as const,
  quizReview: (quizId: string) => ['student', 'quiz-review', quizId] as const,
  quizResults: (profileId: string) => ['student', 'quiz-results', profileId] as const,
  dashboard: (profileId: string) => ['student', 'dashboard', profileId] as const,
  studyMaterials: () => ['student', 'study-materials'] as const,
  leaderboard: (profileId: string, view: 'class' | 'school', role: string) =>
    ['student', 'leaderboard', profileId, view, role] as const,
};
