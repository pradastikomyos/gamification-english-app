import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { studentQueryKeys } from './queryKeys';

export interface AssignedQuiz {
  assignment_id: string;
  quiz_id: string;
  class_id: string;
  assigned_at: string;
  due_date?: string;
  quiz: {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    time_limit: number;
    points_per_question: number;
    status: 'open' | 'closed';
  };
  completion?: {
    id: string;
    score: number;
    completed_at: string;
  };
}

async function fetchAssignedQuizzes(profileId: string): Promise<AssignedQuiz[]> {
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', profileId)
    .single();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!studentData?.class_id) {
    return [];
  }

  const { class_id: classId } = studentData;

  const { data: classQuizzesData, error: classQuizzesError } = await supabase
    .from('class_quizzes')
    .select('assignment_id:id, quiz_id, class_id, assigned_at, due_date, quiz:quizzes!inner(*)')
    .eq('class_id', classId);

  if (classQuizzesError) {
    throw new Error(classQuizzesError.message);
  }

  if (!classQuizzesData || classQuizzesData.length === 0) {
    return [];
  }

  const validAssignments = classQuizzesData.filter(
    (assignment) => assignment.quiz != null && !Array.isArray(assignment.quiz)
  );

  if (validAssignments.length === 0) {
    return [];
  }

  const assignedQuizIds = validAssignments.map((assignment) => assignment.quiz_id);

  const { data: attemptsData, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('id, quiz_id, score:final_score, completed_at')
    .eq('student_id', profileId)
    .in('quiz_id', assignedQuizIds);

  if (attemptsError) {
    console.error('Error fetching quiz attempts:', attemptsError);
  }

  return validAssignments.map((assignment) => {
    const completion = attemptsData?.find((attempt) => attempt.quiz_id === assignment.quiz_id);

    return {
      assignment_id: assignment.assignment_id,
      quiz_id: assignment.quiz_id,
      class_id: assignment.class_id,
      assigned_at: assignment.assigned_at,
      due_date: assignment.due_date,
      quiz: assignment.quiz as unknown as AssignedQuiz['quiz'],
      completion: completion || undefined,
    };
  });
}

export function useAssignedQuizzes(profileId: string | null) {
  return useQuery<AssignedQuiz[], Error>({
    queryKey: profileId
      ? studentQueryKeys.assignedQuizzes(profileId)
      : [...studentQueryKeys.all, 'assigned-quizzes', 'anonymous'],
    queryFn: async () => fetchAssignedQuizzes(profileId as string),
    enabled: !!profileId,
    staleTime: 30 * 1000,
  });
}
