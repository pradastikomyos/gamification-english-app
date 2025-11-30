import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import {
  Trophy,
  Target,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  Zap,
  Flame,
  Gem
} from 'lucide-react';

interface QuizAttemptWithQuiz {
  id: string;
  quiz_id: string;
  final_score: number;
  base_score: number;
  bonus_points: number;
  time_taken_seconds: number | null;
  completed_at: string;
  answers: Record<string, string>;
  quizzes: {
    title: string;
    total_questions: number;
  }; // Reverted to object
}

interface QuizResultFormatted {
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

// Fix: handle quizzes as array if returned as array
function getQuizMeta(quiz: any) {
  if (Array.isArray(quiz)) {
    return quiz[0] || { title: 'Unknown Quiz', total_questions: 0 };
  }
  return quiz || { title: 'Unknown Quiz', total_questions: 0 };
}

export function QuizResults() {
  const { profileId } = useAuth();
  const [results, setResults] = useState<QuizResultFormatted[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    totalPointsEarned: 0,
    difficultyStats: {
      easy: { total: 0, correct: 0, percentage: 0 },
      medium: { total: 0, correct: 0, percentage: 0 },
      hard: { total: 0, correct: 0, percentage: 0 }
    }
  });

  useEffect(() => {
    if (profileId) {
      fetchResults();

      const channel = supabase
        .channel(`quiz_results:${profileId}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'quiz_attempts',
            filter: `student_id=eq.${profileId}`
          },
          (payload) => {
            console.log('New quiz result received!', payload);
            // Re-fetch results to update the view
            fetchResults();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profileId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // The profileId from useAuth is the student's ID, so we use it directly.
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          quiz_id,
          final_score,
          base_score,
          bonus_points,
          time_taken_seconds,
          completed_at,
          answers,
          quizzes!inner(title, total_questions)
        `)
        .eq('student_id', profileId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Calculate detailed breakdown for each result
      const formattedResults = await Promise.all((data as any)?.map(async (result: any) => {
        const quizMeta = getQuizMeta(result.quizzes);
        // Get questions for this quiz to calculate detailed breakdown
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, difficulty, correct_answer, points')
          .eq('quiz_id', result.quiz_id);

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          return {
            ...result,
            quiz_title: quizMeta.title,
            total_questions: quizMeta.total_questions,
            correct_answers: 0,
            score_percentage: 0,
            difficulty_breakdown: {
              easy: { correct: 0, total: 0, points: 0 },
              medium: { correct: 0, total: 0, points: 0 },
              hard: { correct: 0, total: 0, points: 0 }
            }
          } as QuizResultFormatted;
        }

        // Calculate breakdown based on actual answers
        const answers = result.answers as Record<string, string>;
        let easyCorrect = 0, easyTotal = 0, easyPoints = 0;
        let mediumCorrect = 0, mediumTotal = 0, mediumPoints = 0;
        let hardCorrect = 0, hardTotal = 0, hardPoints = 0;
        let totalCorrect = 0;

        questions?.forEach(question => {
          const studentAnswer = answers[question.id];
          const isCorrect = studentAnswer === question.correct_answer;
          
          if (isCorrect) totalCorrect++;

          switch (question.difficulty) {
            case 'easy':
              easyTotal++;
              if (isCorrect) {
                easyCorrect++;
                easyPoints += question.points || 2;
              }
              break;
            case 'medium':
              mediumTotal++;
              if (isCorrect) {
                mediumCorrect++;
                mediumPoints += question.points || 3;
              }
              break;
            case 'hard':
              hardTotal++;
              if (isCorrect) {
                hardCorrect++;
                hardPoints += question.points || 5;
              }
              break;
          }
        });

        return {
          ...result,
          quiz_title: quizMeta.title,
          total_questions: quizMeta.total_questions,
          correct_answers: totalCorrect,
          score_percentage: quizMeta.total_questions ? Math.round((totalCorrect / quizMeta.total_questions) * 100) : 0,
          difficulty_breakdown: {
            easy: { correct: easyCorrect, total: easyTotal, points: easyPoints },
            medium: { correct: mediumCorrect, total: mediumTotal, points: mediumPoints },
            hard: { correct: hardCorrect, total: hardTotal, points: hardPoints }
          }
        } as QuizResultFormatted;
      }) || []);

      setResults(formattedResults);
      calculateStats(formattedResults);
    } catch (error: any) {
      console.error('Error fetching quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (results: QuizResultFormatted[]) => {
    if (results.length === 0) {
      setStats({ 
        totalQuizzes: 0, 
        averageScore: 0, 
        bestScore: 0, 
        totalTimeSpent: 0,
        totalPointsEarned: 0,
        difficultyStats: {
          easy: { total: 0, correct: 0, percentage: 0 },
          medium: { total: 0, correct: 0, percentage: 0 },
          hard: { total: 0, correct: 0, percentage: 0 }
        }
      });
      return;
    }

    const totalQuizzes = results.length;
    
    // Calculate average score based on correct answers percentage
    const totalCorrectAnswers = results.reduce((sum, r) => sum + (r.correct_answers || 0), 0);
    const totalQuestionsAnswered = results.reduce((sum, r) => sum + (r.total_questions || 0), 0);
    const averageScore = totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0;
    
    // Calculate best score
    const bestScore = Math.max(...results.map(r => r.score_percentage || 0));
    
    const totalTimeSpent = results.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0);
    const totalPointsEarned = results.reduce((sum, r) => sum + (r.final_score || 0), 0);

    // Calculate difficulty stats
    let easyTotal = 0, easyCorrect = 0;
    let mediumTotal = 0, mediumCorrect = 0;
    let hardTotal = 0, hardCorrect = 0;

    results.forEach(result => {
      if (result.difficulty_breakdown) {
        easyTotal += result.difficulty_breakdown.easy.total;
        easyCorrect += result.difficulty_breakdown.easy.correct;
        mediumTotal += result.difficulty_breakdown.medium.total;
        mediumCorrect += result.difficulty_breakdown.medium.correct;
        hardTotal += result.difficulty_breakdown.hard.total;
        hardCorrect += result.difficulty_breakdown.hard.correct;
      }
    });

    const difficultyStats = {
      easy: { 
        total: easyTotal, 
        correct: easyCorrect, 
        percentage: easyTotal > 0 ? Math.round((easyCorrect / easyTotal) * 100) : 0 
      },
      medium: { 
        total: mediumTotal, 
        correct: mediumCorrect, 
        percentage: mediumTotal > 0 ? Math.round((mediumCorrect / mediumTotal) * 100) : 0 
      },
      hard: { 
        total: hardTotal, 
        correct: hardCorrect, 
        percentage: hardTotal > 0 ? Math.round((hardCorrect / hardTotal) * 100) : 0 
      }
    };

    setStats({ totalQuizzes, averageScore, bestScore, totalTimeSpent, totalPointsEarned, difficultyStats });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quiz Results & Gamification</h1>
        <p className="text-gray-600">Track your learning progress and earning achievements</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestScore}%</div>
            <p className="text-xs text-muted-foreground">Personal best</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPointsEarned}</div>
            <p className="text-xs text-muted-foreground">Total points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">Learning time</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance by Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Performance by Difficulty</CardTitle>
          <CardDescription>Your success rate across different difficulty levels</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Easy */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-800">Easy Questions</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">2 points each</Badge>
            </div>
            <div className="text-2xl font-bold">{stats.difficultyStats.easy.correct}/{stats.difficultyStats.easy.total}</div>
            <div className="text-sm text-gray-600">Correct: {stats.difficultyStats.easy.correct}/{stats.difficultyStats.easy.total}</div>
            <Progress value={stats.difficultyStats.easy.percentage} className="w-full mt-2" />
            <div className="text-sm text-gray-600 mt-1">{stats.difficultyStats.easy.percentage}%</div>
          </div>

          {/* Medium */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-yellow-800">Medium Questions</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">3 points each</Badge>
            </div>
            <div className="text-2xl font-bold">{stats.difficultyStats.medium.correct}/{stats.difficultyStats.medium.total}</div>
            <div className="text-sm text-gray-600">Correct: {stats.difficultyStats.medium.correct}/{stats.difficultyStats.medium.total}</div>
            <Progress value={stats.difficultyStats.medium.percentage} className="w-full mt-2" />
            <div className="text-sm text-gray-600 mt-1">{stats.difficultyStats.medium.percentage}%</div>
          </div>

          {/* Hard */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Gem className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-800">Hard Questions</span>
              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">5 points each</Badge>
            </div>
            <div className="text-2xl font-bold">{stats.difficultyStats.hard.correct}/{stats.difficultyStats.hard.total}</div>
            <div className="text-sm text-gray-600">Correct: {stats.difficultyStats.hard.correct}/{stats.difficultyStats.hard.total}</div>
            <Progress value={stats.difficultyStats.hard.percentage} className="w-full mt-2" />
            <div className="text-sm text-gray-600 mt-1">{stats.difficultyStats.hard.percentage}%</div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Results List */}
      {results.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Complete your first quiz to see results here!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Results</h2>
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{result.quiz_title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          {new Date(result.completed_at).toLocaleDateString()}
                        </span>
                        {result.time_taken_seconds !== null && (
                          <>
                            <Clock className="h-4 w-4 text-gray-500 ml-2" />
                            <span className="text-sm text-gray-500">
                              {formatTime(result.time_taken_seconds)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getScoreBadgeVariant(result.score_percentage || 0)} className="text-lg px-3 py-1 mb-1">
                        {result.score_percentage || 0}%
                      </Badge>
                      <p className="text-sm text-gray-500">
                        {result.final_score || 0} points earned
                      </p>
                    </div>
                  </div>
                  {/* Detailed breakdown */}
                  <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
                    <div>
                      <span className="font-semibold text-green-800">Easy:</span> {result.difficulty_breakdown?.easy.correct}/{result.difficulty_breakdown?.easy.total}
                    </div>
                    <div>
                       <span className="font-semibold text-yellow-800">Medium:</span> {result.difficulty_breakdown?.medium.correct}/{result.difficulty_breakdown?.medium.total}
                    </div>
                    <div>
                       <span className="font-semibold text-red-800">Hard:</span> {result.difficulty_breakdown?.hard.correct}/{result.difficulty_breakdown?.hard.total}
                    </div>
                  </div>
                   <div className="mt-4">
                    <p className={getScoreColor(result.score_percentage || 0)}>
                      Overall: {result.score_percentage || 0}% ({result.correct_answers || 0}/{result.total_questions || 0} correct)
                    </p>
                    <Progress value={result.score_percentage || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
