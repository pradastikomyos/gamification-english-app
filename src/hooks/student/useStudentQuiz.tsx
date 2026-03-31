import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { studentQueryKeys } from './queryKeys';

export interface StudentQuizQuestion {
  id: string;
  question_text: string;
  media_url: string | null;
  options: Record<string, string>;
  difficulty: 'easy' | 'medium' | 'hard';
  correct_answer: string;
  explanation: string | null;
}

export interface StudentQuizDetails {
  quiz_title: string;
  quiz_description: string;
  time_limit_seconds: number | null;
  questions: StudentQuizQuestion[];
}

export interface ResultBreakdownItem {
  question_id: string;
  question_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface QuizSubmissionResult {
  final_score: number;
  base_score: number;
  bonus_points: number;
  results_breakdown: ResultBreakdownItem[];
}

export interface SubmitQuizAttemptPayload {
  quizId: string;
  studentAnswers: Record<string, string>;
  timeTakenSeconds: number;
  profileId: string | null;
}

async function fetchQuizDetails(quizId: string): Promise<StudentQuizDetails> {
  const { data, error } = await supabase.rpc('get_quiz_details_for_student', {
    p_quiz_id: quizId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('Quiz not found or has no questions.');
  }

  return data[0] as StudentQuizDetails;
}

export function useStudentQuizDetails(quizId: string | null) {
  return useQuery<StudentQuizDetails, Error>({
    queryKey: quizId
      ? studentQueryKeys.quizDetails(quizId)
      : [...studentQueryKeys.all, 'quiz-details', 'anonymous'],
    queryFn: async () => fetchQuizDetails(quizId as string),
    enabled: !!quizId,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation<QuizSubmissionResult | null, Error, SubmitQuizAttemptPayload>({
    mutationKey: [...studentQueryKeys.all, 'submit-quiz-attempt'],
    scope: { id: 'submit-quiz-attempt' },
    mutationFn: async ({ quizId, studentAnswers, timeTakenSeconds }) => {
      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_quiz_id: quizId,
        p_student_answers: studentAnswers,
        p_time_taken_seconds: timeTakenSeconds,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as QuizSubmissionResult;
    },
    onSuccess: (_result, variables) => {
      if (variables.profileId) {
        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.assignedQuizzes(variables.profileId),
        });
        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.quizResults(variables.profileId),
        });
        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.dashboard(variables.profileId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.all });
      }
    },
  });
}
