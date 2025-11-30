import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface QuizReviewProps {
  quizId: string;
  onBack: () => void;
}

interface ReviewResultBreakdownItem {
  question_id: string;
  question_text: string;
  options: Record<string, string>;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string | null;
}

interface ReviewData {
  quiz_title: string;
  final_score: number;
  base_score: number;
  bonus_points: number;
  time_taken_seconds: number;
  submitted_at: string;
  results_breakdown: ReviewResultBreakdownItem[];
}

export function QuizReview({ quizId, onBack }: QuizReviewProps) {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      fetchReviewData();
    }
  }, [quizId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_quiz_review_details', {
        p_quiz_id: quizId,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        throw new Error('Data ulasan untuk kuis ini tidak ditemukan. Mungkin Anda belum mengerjakannya.');
      }

      setReviewData(data[0]);

    } catch (error: any) {
      console.error('Error fetching review data:', error);
      setError(error.message || 'Terjadi kesalahan tidak diketahui');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Memuat ulasan...</div>;
  if (error) return (
    <div className="p-4 max-w-4xl mx-auto">
       <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Gagal Memuat Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  );
  if (!reviewData) return <div className="p-4 text-center">Data ulasan tidak tersedia.</div>;

  const correctAnswersCount = reviewData.results_breakdown.filter(a => a.is_correct).length;
  const totalQuestions = reviewData.results_breakdown.length;
  const scorePercentage = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Dashboard
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Ulasan: {reviewData.quiz_title}</CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Calendar className="h-4 w-4"/> 
            Selesai pada {new Date(reviewData.submitted_at).toLocaleString('id-ID')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Skor Final</p>
                <p className="text-2xl font-bold text-blue-600">{reviewData.final_score}</p>
                <p className="text-xs text-gray-500">Dasar: {reviewData.base_score} + Bonus: {reviewData.bonus_points}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Waktu Pengerjaan</p>
                <p className="text-2xl font-bold">{reviewData.time_taken_seconds} detik</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Jawaban Benar</p>
                <p className="text-2xl font-bold">{correctAnswersCount} / {totalQuestions}</p>
                <p className="text-xs text-gray-500">({scorePercentage.toFixed(0)}%)</p>
            </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {reviewData.results_breakdown.map((answer, index) => (
          <Card key={answer.question_id}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                {answer.is_correct ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5 text-red-500" />
                )}
                Pertanyaan {index + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold mb-4 text-base">{answer.question_text}</p>
              <div className="space-y-2">
                {Object.entries(answer.options).map(([key, value]) => {
                  const isSelected = key === answer.student_answer;
                  const isCorrect = key === answer.correct_answer;
                  
                  let optionStyle = 'border-gray-200';
                  if (isCorrect) {
                    optionStyle = 'border-green-500 bg-green-50';
                  }
                  if (isSelected && !isCorrect) {
                    optionStyle = 'border-red-500 bg-red-50';
                  }

                  return (
                    <div key={key} className={`flex items-center p-3 rounded-lg border ${optionStyle}`}>
                      <span className="font-semibold mr-3">{key}.</span>
                      <span className="flex-1">{value}</span>
                      {isSelected && (
                        <Badge variant={isCorrect ? 'default' : 'destructive'} className="ml-auto">
                          Jawaban Anda
                        </Badge>
                      )}
                      {!isSelected && isCorrect && (
                        <Badge variant="secondary" className="ml-auto">
                          Jawaban Benar
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              {answer.explanation && (
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                  <p className="font-semibold">Penjelasan</p>
                  <p>{answer.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
