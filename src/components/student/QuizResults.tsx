import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useQuizResults } from '@/hooks/student/useQuizResults';
import { studentQueryKeys } from '@/hooks/student/queryKeys';
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

export function QuizResults() {
  const { profileId } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading: loading } = useQuizResults(profileId);

  const results = (data?.results || []) as QuizResultFormatted[];
  const stats = data?.stats || {
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

  useEffect(() => {
    if (profileId) {
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
            queryClient.invalidateQueries({ queryKey: studentQueryKeys.quizResults(profileId) });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profileId, queryClient]);

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
