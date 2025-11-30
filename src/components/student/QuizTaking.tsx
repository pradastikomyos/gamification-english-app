import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';
import ImageZoom from '@/components/ui/image-zoom';
import { DIFFICULTY_POINTS, calculateQuizScore, getTimeBonusTier } from '@/lib/gamification';

// Define types for our data
interface Question {
  id: string;
  question_text: string;
  media_url: string | null;
  options: Record<string, string>;
  difficulty: 'easy' | 'medium' | 'hard';
  correct_answer: string;
  explanation: string | null;
}

interface Quiz {
    title: string;
    description: string;
}

interface QuizTakingProps {
  quizId: string;
  onFinishQuiz: () => void;
}

interface ResultBreakdownItem {
  question_id: string;
  question_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

const QuizTaking = ({ quizId, onFinishQuiz }: QuizTakingProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [quizResult, setQuizResult] = useState<{ final_score: number; base_score: number; bonus_points: number; results_breakdown: ResultBreakdownItem[] } | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId) {
        setError('Quiz ID is missing.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_quiz_details_for_student', {
          p_quiz_id: quizId
        });

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Quiz not found or has no questions.');

        const quizDetails = data[0];
        setQuiz({ title: quizDetails.quiz_title, description: quizDetails.quiz_description });
        setQuestions(quizDetails.questions || []);
        setTimeRemaining(quizDetails.time_limit_seconds || null);
        setTimeLimit(quizDetails.time_limit_seconds || null);
        setStartTime(new Date());

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining === null || quizResult) return; // Stop timer if quiz is finished

    if (timeRemaining <= 0) {
      if (!isLoading) {
        handleSubmit();
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeRemaining(prev => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeRemaining, isLoading, quizResult]); // Add quizResult dependency

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isLoading || quizResult) return; // Prevent multiple submissions
    setIsLoading(true);
    setError(null);
    
    // Stop the timer by setting endTime
    const submitEndTime = new Date();
    setEndTime(submitEndTime);
    
    try {
      const timeTaken = startTime ? Math.round((submitEndTime.getTime() - startTime.getTime()) / 1000) : 0;

      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_quiz_id: quizId,
        p_student_answers: selectedAnswers,
        p_time_taken_seconds: timeTaken,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setQuizResult(data[0]);
      } else {
        // Fallback if RPC returns nothing
        onFinishQuiz();
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

    if (quizResult) {
    // Use actual time taken from when quiz was submitted, not current time
    const actualTimeTaken = endTime && startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    
    // Calculate detailed score breakdown using gamification logic with actual time
    const answers = quizResult.results_breakdown.map(item => ({
      difficulty: item.difficulty,
      isCorrect: item.is_correct
    }));
    
    const scoreDetails = calculateQuizScore(answers, actualTimeTaken, timeLimit || 300); // Use actual time limit from database
    const timeBonusTier = getTimeBonusTier(actualTimeTaken, timeLimit || 300);

    return (
      <Card className="m-4 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Kuis Selesai!
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Berikut adalah hasil Anda untuk "{quiz?.title}".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Total Points Display - Use database score as primary, frontend calculation as reference */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Total Poin</h2>
            <p className="text-6xl font-extrabold text-blue-600">{quizResult.final_score.toFixed(0)}</p>
            <p className="text-sm text-gray-500 mt-2">Poin yang Anda peroleh</p>
            {Math.abs(quizResult.final_score - scoreDetails.totalPoints) > 0.5 && (
              <p className="text-xs text-yellow-600 mt-1">
                (Perhitungan frontend: {scoreDetails.totalPoints} - ada perbedaan dengan database)
              </p>
            )}
          </div>

          {/* Score Breakdown by Difficulty */}
          <div>
            <h3 className="text-xl font-bold mb-4">Rincian Skor per Tingkat Kesulitan</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-md">
                <span className="font-semibold text-green-800">Easy (+{DIFFICULTY_POINTS.easy} poin)</span>
                <span className="text-sm text-green-600">Benar {scoreDetails.easyQuestions} soal</span>
                <span className="font-bold text-green-700">{scoreDetails.easyPoints} Poin</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <span className="font-semibold text-yellow-800">Medium (+{DIFFICULTY_POINTS.medium} poin)</span>
                <span className="text-sm text-yellow-600">Benar {scoreDetails.mediumQuestions} soal</span>
                <span className="font-bold text-yellow-700">{scoreDetails.mediumPoints} Poin</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-md">
                <span className="font-semibold text-red-800">Hard (+{DIFFICULTY_POINTS.hard} poin)</span>
                <span className="text-sm text-red-600">Benar {scoreDetails.hardQuestions} soal</span>
                <span className="font-bold text-red-700">{scoreDetails.hardPoints} Poin</span>
              </div>
            </div>
          </div>

          {/* Time Bonus Section */}
          {scoreDetails.timeBonus > 0 && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Clock className="h-6 w-6 text-purple-600" />
                Bonus Waktu
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-purple-800">
                    {timeBonusTier?.label} ({timeBonusTier?.percentage}% waktu tersisa)
                  </p>
                  <p className="text-sm text-purple-600">Waktu penyelesaian: {Math.floor(actualTimeTaken / 60)}:{(actualTimeTaken % 60).toString().padStart(2, '0')}</p>
                </div>
                <span className="font-bold text-purple-700 text-2xl">+{scoreDetails.timeBonus} Poin</span>
              </div>
            </div>
          )}

          {/* Original Score Summary for comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">Skor Dasar</p>
              <p className="text-3xl font-bold">{quizResult.base_score.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bonus Waktu</p>
              <p className="text-3xl font-bold text-green-500">+{quizResult.bonus_points.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">Skor Final Database</p>
              <p className="text-3xl font-bold text-blue-600">{quizResult.final_score.toFixed(0)}</p>
            </div>
          </div>

          {/* Answer Review */}
          <div>
            <h3 className="text-xl font-bold mb-4">Tinjauan Jawaban</h3>
            <div className="space-y-4">
              {quizResult.results_breakdown.map((item, index) => (
                <div key={item.question_id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold flex-1">{index + 1}. {item.question_text}</p>
                    {item.is_correct ? (
                      <CheckCircle className="h-6 w-6 text-green-500 ml-4" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 ml-4" />
                    )}
                  </div>
                  <div className="text-sm mt-2 pl-4 border-l-2 ml-2">
                    <p className={item.is_correct ? 'text-gray-500' : 'text-red-600'}>
                      Jawaban Anda: {item.student_answer ? `"${questions.find(q => q.id === item.question_id)?.options[item.student_answer] || item.student_answer}"` : "Tidak dijawab"}
                    </p>
                    {!item.is_correct && (
                      <p className="text-green-600">
                        Jawaban Benar: "{questions.find(q => q.id === item.question_id)?.options[item.correct_answer] || item.correct_answer}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={onFinishQuiz} className="mt-6 w-full max-w-xs mx-auto flex">
            Kembali ke Daftar Kuis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <div className="p-4">Loading quiz...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!quiz || questions.length === 0) return <div className="p-4">Quiz not found or has no questions.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderMedia = (url: string) => {
    // YouTube video
    const youtubeRegex = /(?:https?):\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      return (
        <div className="relative my-4" style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded YouTube video"
            className="absolute top-0 left-0 w-full h-full rounded-md"
          ></iframe>
        </div>
      );
    }

    // Image - using ImageZoom component
    const isImage = /\.(jpeg|jpg|gif|png)$/i.test(url) || url.startsWith('placeholder-');
    if (isImage) {
      return (
        <div className="flex justify-center my-4">
          <ImageZoom
            src={url}
            alt="Question media"
            className="max-w-sm rounded-md border"
            title="Gambar Soal"
          />
        </div>
      );
    }

    // Audio
    const isAudio = /\.(mp3|wav|ogg)$/i.test(url);
    if (isAudio) {
      return <audio controls src={url} className="w-full my-4">Your browser does not support the audio element.</audio>;
    }

    return null;
  };

    return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            {timeRemaining !== null && (
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm font-medium text-gray-600">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Time Remaining: {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-500">
                  {(() => {
                    const quizTimeLimit = timeLimit || 300; // Use actual time limit
                    const elapsed = startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0;
                    const percentageUsed = (elapsed / quizTimeLimit) * 100;
                    
                    if (percentageUsed <= 25) return "🚀 Lightning Fast (+30 bonus)";
                    if (percentageUsed <= 50) return "⚡ Quick Thinker (+20 bonus)";
                    if (percentageUsed <= 75) return "⏱️ Steady Pace (+10 bonus)";
                    return "🕐 Take your time";
                  })()}
                </div>
              </div>
            )}
            <p className="text-sm text-center mt-1">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="my-4">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xl font-semibold">{currentQuestion.question_text}</p>
              <span
                className={`capitalize px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  {
                    easy: 'bg-green-100 text-green-800 border-green-300',
                    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    hard: 'bg-red-100 text-red-800 border-red-300',
                  }[currentQuestion.difficulty] || 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
              >
                {currentQuestion.difficulty}
              </span>
            </div>
            {currentQuestion.media_url && renderMedia(currentQuestion.media_url)}
          </div>
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            className="mt-4 space-y-3"
          >
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <div key={key} className="flex items-center p-3 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 transition-colors">
                <RadioGroupItem value={key} id={`${currentQuestion.id}-${key}`} />
                <Label htmlFor={`${currentQuestion.id}-${key}`} className="ml-3 text-base flex-1 cursor-pointer">
                  <span className="font-bold mr-2">{key}.</span> {value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
          Previous
        </Button>
        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={!selectedAnswers[currentQuestion.id] || isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestion.id]}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizTaking;
