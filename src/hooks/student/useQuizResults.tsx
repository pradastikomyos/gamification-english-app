import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { studentQueryKeys } from './queryKeys';

interface QuizQuestionMeta {
  id: string;
  quiz_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correct_answer: string;
  points: number | null;
}

interface QuizAttemptRaw {
  id: string;
  quiz_id: string;
  final_score: number;
  base_score: number;
  bonus_points: number;
  time_taken_seconds: number | null;
  completed_at: string;
  answers: Record<string, string> | null;
  quizzes: {
    title: string;
    total_questions: number | null;
  } | {
    title: string;
    total_questions: number | null;
  }[];
}

export interface QuizResultFormatted {
  id: string;
  quiz_id: string;
  final_score: number;
  base_score: number;
  bonus_points: number;
  time_taken_seconds: number | null;
  completed_at: string;
  quiz_title: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  difficulty_breakdown: {
    easy: { correct: number; total: number; points: number };
    medium: { correct: number; total: number; points: number };
    hard: { correct: number; total: number; points: number };
  };
}

export interface QuizResultsStats {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
  totalPointsEarned: number;
  difficultyStats: {
    easy: { total: number; correct: number; percentage: number };
    medium: { total: number; correct: number; percentage: number };
    hard: { total: number; correct: number; percentage: number };
  };
}

export interface QuizResultsData {
  results: QuizResultFormatted[];
  stats: QuizResultsStats;
}

const EMPTY_STATS: QuizResultsStats = {
  totalQuizzes: 0,
  averageScore: 0,
  bestScore: 0,
  totalTimeSpent: 0,
  totalPointsEarned: 0,
  difficultyStats: {
    easy: { total: 0, correct: 0, percentage: 0 },
    medium: { total: 0, correct: 0, percentage: 0 },
    hard: { total: 0, correct: 0, percentage: 0 },
  },
};

function unwrapQuizMeta(quiz: QuizAttemptRaw['quizzes']) {
  if (Array.isArray(quiz)) {
    return quiz[0] || { title: 'Unknown Quiz', total_questions: 0 };
  }

  return quiz || { title: 'Unknown Quiz', total_questions: 0 };
}

function buildStats(results: QuizResultFormatted[]): QuizResultsStats {
  if (results.length === 0) {
    return EMPTY_STATS;
  }

  const totalQuizzes = results.length;
  const totalCorrectAnswers = results.reduce((sum, r) => sum + (r.correct_answers || 0), 0);
  const totalQuestionsAnswered = results.reduce((sum, r) => sum + (r.total_questions || 0), 0);
  const averageScore = totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0;
  const bestScore = Math.max(...results.map((r) => r.score_percentage || 0));
  const totalTimeSpent = results.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0);
  const totalPointsEarned = results.reduce((sum, r) => sum + (r.final_score || 0), 0);

  let easyTotal = 0;
  let easyCorrect = 0;
  let mediumTotal = 0;
  let mediumCorrect = 0;
  let hardTotal = 0;
  let hardCorrect = 0;

  results.forEach((result) => {
    easyTotal += result.difficulty_breakdown.easy.total;
    easyCorrect += result.difficulty_breakdown.easy.correct;
    mediumTotal += result.difficulty_breakdown.medium.total;
    mediumCorrect += result.difficulty_breakdown.medium.correct;
    hardTotal += result.difficulty_breakdown.hard.total;
    hardCorrect += result.difficulty_breakdown.hard.correct;
  });

  return {
    totalQuizzes,
    averageScore,
    bestScore,
    totalTimeSpent,
    totalPointsEarned,
    difficultyStats: {
      easy: {
        total: easyTotal,
        correct: easyCorrect,
        percentage: easyTotal > 0 ? Math.round((easyCorrect / easyTotal) * 100) : 0,
      },
      medium: {
        total: mediumTotal,
        correct: mediumCorrect,
        percentage: mediumTotal > 0 ? Math.round((mediumCorrect / mediumTotal) * 100) : 0,
      },
      hard: {
        total: hardTotal,
        correct: hardCorrect,
        percentage: hardTotal > 0 ? Math.round((hardCorrect / hardTotal) * 100) : 0,
      },
    },
  };
}

async function fetchQuizResults(profileId: string): Promise<QuizResultsData> {
  const { data: attemptsData, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('id, quiz_id, final_score, base_score, bonus_points, time_taken_seconds, completed_at, answers, quizzes!inner(title, total_questions)')
    .eq('student_id', profileId)
    .order('completed_at', { ascending: false });

  if (attemptsError) {
    throw new Error(attemptsError.message);
  }

  const attempts = (attemptsData || []) as QuizAttemptRaw[];

  if (attempts.length === 0) {
    return { results: [], stats: EMPTY_STATS };
  }

  const quizIds = Array.from(new Set(attempts.map((attempt) => attempt.quiz_id)));

  const { data: questionsData, error: questionsError } = await supabase
    .from('questions')
    .select('id, quiz_id, difficulty, correct_answer, points')
    .in('quiz_id', quizIds);

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questionMap = new Map<string, QuizQuestionMeta[]>();

  (questionsData || []).forEach((question) => {
    const list = questionMap.get(question.quiz_id) || [];
    list.push(question as QuizQuestionMeta);
    questionMap.set(question.quiz_id, list);
  });

  const results: QuizResultFormatted[] = attempts.map((attempt) => {
    const quizMeta = unwrapQuizMeta(attempt.quizzes);
    const questions = questionMap.get(attempt.quiz_id) || [];
    const answers = attempt.answers || {};

    let easyCorrect = 0;
    let easyTotal = 0;
    let easyPoints = 0;
    let mediumCorrect = 0;
    let mediumTotal = 0;
    let mediumPoints = 0;
    let hardCorrect = 0;
    let hardTotal = 0;
    let hardPoints = 0;
    let totalCorrect = 0;

    questions.forEach((question) => {
      const studentAnswer = answers[question.id];
      const isCorrect = studentAnswer === question.correct_answer;

      if (isCorrect) {
        totalCorrect += 1;
      }

      if (question.difficulty === 'easy') {
        easyTotal += 1;
        if (isCorrect) {
          easyCorrect += 1;
          easyPoints += question.points || 2;
        }
      } else if (question.difficulty === 'medium') {
        mediumTotal += 1;
        if (isCorrect) {
          mediumCorrect += 1;
          mediumPoints += question.points || 3;
        }
      } else {
        hardTotal += 1;
        if (isCorrect) {
          hardCorrect += 1;
          hardPoints += question.points || 5;
        }
      }
    });

    const totalQuestions = Number(quizMeta.total_questions || questions.length || 0);
    const scorePercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return {
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      final_score: Number(attempt.final_score || 0),
      base_score: Number(attempt.base_score || 0),
      bonus_points: Number(attempt.bonus_points || 0),
      time_taken_seconds: attempt.time_taken_seconds,
      completed_at: attempt.completed_at,
      quiz_title: quizMeta.title,
      total_questions: totalQuestions,
      correct_answers: totalCorrect,
      score_percentage: scorePercentage,
      difficulty_breakdown: {
        easy: { correct: easyCorrect, total: easyTotal, points: easyPoints },
        medium: { correct: mediumCorrect, total: mediumTotal, points: mediumPoints },
        hard: { correct: hardCorrect, total: hardTotal, points: hardPoints },
      },
    };
  });

  return {
    results,
    stats: buildStats(results),
  };
}

export function useQuizResults(profileId: string | null) {
  return useQuery<QuizResultsData, Error>({
    queryKey: profileId
      ? studentQueryKeys.quizResults(profileId)
      : [...studentQueryKeys.all, 'quiz-results', 'anonymous'],
    queryFn: async () => fetchQuizResults(profileId as string),
    enabled: !!profileId,
    staleTime: 30 * 1000,
  });
}
