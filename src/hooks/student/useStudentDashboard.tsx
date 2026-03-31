import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { studentQueryKeys } from './queryKeys';

interface StudentData {
  id: string;
  class_id?: string | null;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  classes?: { name: string } | null;
}

interface DashboardQuiz {
  id?: string;
  quiz_id: string;
  assigned_at?: string;
  due_date?: string | null;
  completed?: boolean;
  quizzes?: {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
    time_limit?: number;
    status?: string;
  };
  quiz?: {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
    time_limit?: number;
    status?: string;
  };
}

interface RecentQuiz {
  id: string;
  completed_at: string;
  score: number;
  total_questions: number;
  quizzes?: {
    title: string;
    difficulty?: string;
  };
}

export interface StudentDashboardData {
  studentData: StudentData | null;
  recentQuizzes: RecentQuiz[];
  achievements: any[];
  availableQuizzes: DashboardQuiz[];
  assignedQuizzes: DashboardQuiz[];
  classRank: number;
  totalClassmates: number;
}

const EMPTY_DASHBOARD: StudentDashboardData = {
  studentData: null,
  recentQuizzes: [],
  achievements: [],
  availableQuizzes: [],
  assignedQuizzes: [],
  classRank: 0,
  totalClassmates: 0,
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }

  return value;
}

async function fetchStudentDashboard(profileId: string): Promise<StudentDashboardData> {
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('id, class_id, name, total_points, level, current_streak, classes:class_id(name)')
    .eq('id', profileId)
    .single();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!studentData) {
    return EMPTY_DASHBOARD;
  }

  const classId = studentData.class_id;

  const recentQuizzesPromise = supabase
    .from('quiz_attempts')
    .select('id, quiz_id, completed_at, final_score, quizzes:quiz_id(title, difficulty, total_questions)')
    .eq('student_id', profileId)
    .order('completed_at', { ascending: false })
    .limit(5);

  const achievementsPromise = supabase
    .from('user_achievements')
    .select('id, earned_at, achievements:achievement_id(*)')
    .eq('student_id', profileId)
    .order('earned_at', { ascending: false })
    .limit(3);

  let availableQuizzesData: any[] = [];
  let assignedQuizzesData: any[] = [];
  let classmatesData: Array<{ id: string; total_points: number }> = [];

  if (classId) {
    const [availableResult, assignedResult, classmatesResult] = await Promise.all([
      supabase
        .from('class_quizzes')
        .select('id, quiz_id, assigned_at, due_date, quizzes:quiz_id!inner(*)')
        .eq('class_id', classId)
        .eq('quizzes.status', 'open')
        .order('assigned_at', { ascending: false }),
      supabase
        .from('class_quizzes')
        .select('id, quiz_id, assigned_at, due_date, quiz:quizzes!inner(id, title, description, difficulty, time_limit, status)')
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false })
        .limit(3),
      supabase
        .from('students')
        .select('id, total_points')
        .eq('class_id', classId)
        .order('total_points', { ascending: false }),
    ]);

    if (availableResult.error) {
      throw new Error(availableResult.error.message);
    }

    if (assignedResult.error) {
      throw new Error(assignedResult.error.message);
    }

    if (classmatesResult.error) {
      throw new Error(classmatesResult.error.message);
    }

    availableQuizzesData = availableResult.data || [];
    assignedQuizzesData = assignedResult.data || [];
    classmatesData = classmatesResult.data || [];
  }

  const recentQuizzesResult = await recentQuizzesPromise;
  const achievementsResult = await achievementsPromise;

  if (recentQuizzesResult.error) {
    throw new Error(recentQuizzesResult.error.message);
  }

  if (achievementsResult.error) {
    throw new Error(achievementsResult.error.message);
  }

  const quizIds = Array.from(
    new Set([
      ...availableQuizzesData.map((q) => q.quiz_id),
      ...assignedQuizzesData.map((q) => q.quiz_id),
    ])
  );

  let completedQuizIds = new Set<string>();

  if (quizIds.length > 0) {
    const { data: attemptsData, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('student_id', profileId)
      .in('quiz_id', quizIds);

    if (!attemptsError && attemptsData) {
      completedQuizIds = new Set(attemptsData.map((attempt) => attempt.quiz_id));
    }
  }

  const availableQuizzes = availableQuizzesData
    .filter((quiz) => !completedQuizIds.has(quiz.quiz_id))
    .slice(0, 3)
    .map((quiz) => ({
      ...quiz,
      quizzes: unwrapRelation(quiz.quizzes),
    }));

  const assignedQuizzes = assignedQuizzesData.map((quiz) => ({
    ...quiz,
    completed: completedQuizIds.has(quiz.quiz_id),
    quiz: unwrapRelation(quiz.quiz),
  }));

  const recentQuizzes = (recentQuizzesResult.data || []).map((quiz) => {
    const quizMeta = unwrapRelation(quiz.quizzes);
    return {
      id: quiz.id,
      completed_at: quiz.completed_at,
      score: Number(quiz.final_score || 0),
      total_questions: Number(quizMeta?.total_questions || 0),
      quizzes: quizMeta ? { title: quizMeta.title, difficulty: quizMeta.difficulty } : undefined,
    };
  });

  const classRank = classmatesData.findIndex((student) => student.id === profileId) + 1;

  return {
    studentData: {
      ...studentData,
      classes: unwrapRelation(studentData.classes),
    },
    recentQuizzes,
    achievements: achievementsResult.data || [],
    availableQuizzes,
    assignedQuizzes,
    classRank: classRank > 0 ? classRank : 0,
    totalClassmates: classmatesData.length,
  };
}

export function useStudentDashboard(profileId: string | null) {
  return useQuery<StudentDashboardData, Error>({
    queryKey: profileId
      ? studentQueryKeys.dashboard(profileId)
      : [...studentQueryKeys.all, 'dashboard', 'anonymous'],
    queryFn: async () => fetchStudentDashboard(profileId as string),
    enabled: !!profileId,
    staleTime: 30 * 1000,
  });
}
