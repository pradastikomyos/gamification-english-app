import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { studentQueryKeys } from './queryKeys';

export interface ReviewResultBreakdownItem {
  question_id: string;
  question_text: string;
  options: Record<string, string>;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string | null;
}

export interface QuizReviewData {
  quiz_title: string;
  final_score: number;
  base_score: number;
  bonus_points: number;
  time_taken_seconds: number;
  submitted_at: string;
  results_breakdown: ReviewResultBreakdownItem[];
}

async function fetchQuizReview(quizId: string): Promise<QuizReviewData> {
  const { data, error } = await supabase.rpc('get_quiz_review_details', {
    p_quiz_id: quizId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('Data ulasan untuk kuis ini tidak ditemukan. Mungkin Anda belum mengerjakannya.');
  }

  return data[0] as QuizReviewData;
}

export function useQuizReview(quizId: string | null) {
  return useQuery<QuizReviewData, Error>({
    queryKey: quizId
      ? studentQueryKeys.quizReview(quizId)
      : [...studentQueryKeys.all, 'quiz-review', 'anonymous'],
    queryFn: async () => fetchQuizReview(quizId as string),
    enabled: !!quizId,
    staleTime: 30 * 1000,
  });
}
