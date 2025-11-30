import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentTour } from '@/hooks/useStudentTour';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  PlayCircle, 
  Trophy, 
  Star, 
  Flame, 
  TrendingUp, 
  Award,
  Target,
  Clock,
  BarChart3,
  BookOpen,
  ClipboardList,
  Users, // Added for total classmates stat
  Hash // Added for rank stat
} from 'lucide-react';
import { QuizReview } from './QuizReview'; // Import the new component

interface StudentData {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  classes?: { name: string };
}

interface DashboardStats {
  studentData: StudentData | null;
  recentQuizzes: any[];
  achievements: any[];
  availableQuizzes: any[];
  assignedQuizzes: any[];
  classRank: number;
  totalClassmates: number;
}

interface StudentDashboardProps {
  onStartQuiz: (quizId: string) => void;
  onReviewQuiz: (quizId: string) => void; // Add this prop
}

export function StudentDashboard({ onStartQuiz, onReviewQuiz }: StudentDashboardProps) {
  const { user, profileId } = useAuth();
  const { toast } = useToast();
  const { initializeTour } = useStudentTour();
  const [stats, setStats] = useState<DashboardStats>({
    studentData: null,
    recentQuizzes: [],
    achievements: [],
    availableQuizzes: [],
    assignedQuizzes: [],
    classRank: 0,
    totalClassmates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reviewingQuiz, setReviewingQuiz] = useState(null); // Add this state

  useEffect(() => {
    if (profileId) {
      fetchDashboardData();

      // Set up real-time subscription for student data updates
      const channel = supabase
        .channel(`student_dashboard:${profileId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'students',
            filter: `id=eq.${profileId}`
          },
          (payload) => {
            console.log('Student data updated!', payload);
            // Re-fetch dashboard data
            fetchDashboardData();
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'quiz_attempts',
            filter: `student_id=eq.${profileId}`
          },
          (payload) => {
            console.log('Quiz progress updated!', payload);
            // Re-fetch dashboard data
            fetchDashboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profileId]);

  // Initialize tour after dashboard data is loaded
  useEffect(() => {
    if (!loading && stats.studentData) {
      initializeTour();
    }
  }, [loading, stats.studentData, initializeTour]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch student data
      const { data: studentData } = await supabase
        .from('students')
        .select('*, classes:class_id(name)')
        .eq('id', profileId)
        .single();

      // Fetch recent quiz attempts
      const { data: recentQuizzes } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes:quiz_id(title, difficulty)
        `)
        .eq('student_id', profileId)
        .order('completed_at', { ascending: false })
        .limit(5);

      // Fetch available quizzes (only open quizzes that haven't been completed)
      const { data: availableQuizzes } = await supabase
        .from('class_quizzes')
        .select(`
          *,
          quizzes:quiz_id!inner(*)
        `)
        .eq('class_id', studentData?.class_id)
        .eq('quizzes.status', 'open')
        .order('assigned_at', { ascending: false });

      // Filter out completed quizzes from available quizzes
      let filteredAvailableQuizzes = [];
      if (availableQuizzes) {
        const availableQuizIds = availableQuizzes.map(q => q.quiz_id);
        const { data: completedAvailableQuizzes } = await supabase
          .from('quiz_attempts')
          .select('quiz_id')
          .eq('student_id', profileId)
          .in('quiz_id', availableQuizIds);

        const completedAvailableQuizIds = completedAvailableQuizzes?.map(c => c.quiz_id) || [];
        filteredAvailableQuizzes = availableQuizzes
          .filter(quiz => !completedAvailableQuizIds.includes(quiz.quiz_id))
          .slice(0, 3); // Limit to 3 after filtering
      }

      // Fetch assigned quizzes with completion status
      const assignedQuizzesQuery = await supabase
        .from('class_quizzes')
        .select(`
          id,
          quiz_id,
          assigned_at,
          due_date,
          quiz:quizzes!inner(
            id,
            title,
            description,
            difficulty,
            time_limit
          )
        `)
        .eq('class_id', studentData?.class_id)
        .order('assigned_at', { ascending: false })
        .limit(3);

      const assignedQuizzes = assignedQuizzesQuery.data || [];

      // Check completion status for assigned quizzes
      const assignedQuizIds = assignedQuizzes.map(q => q.quiz_id);
      const { data: completedQuizzes } = await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('student_id', profileId)
        .in('quiz_id', assignedQuizIds);

      const completedQuizIds = completedQuizzes?.map(c => c.quiz_id) || [];
      const enrichedAssignedQuizzes = assignedQuizzes.map(quiz => ({
        ...quiz,
        completed: completedQuizIds.includes(quiz.quiz_id)
      }));

      // Fetch achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements:achievement_id(*)
        `)
        .eq('student_id', profileId)
        .order('earned_at', { ascending: false })
        .limit(3);

      // Get class ranking
      if (studentData?.class_id) {
        const { data: classmates } = await supabase
          .from('students')
          .select('total_points')
          .eq('class_id', studentData.class_id)
          .order('total_points', { ascending: false });

        const rank = classmates?.findIndex(s => s.total_points <= studentData.total_points) + 1 || 0;
        setStats({
          studentData,
          recentQuizzes: recentQuizzes || [],
          achievements: achievements || [],
          availableQuizzes: filteredAvailableQuizzes || [],
          assignedQuizzes: enrichedAssignedQuizzes || [],
          classRank: rank,
          totalClassmates: classmates?.length || 0,
        });
      } else {
        setStats({
          studentData,
          recentQuizzes: recentQuizzes || [],
          achievements: achievements || [],
          availableQuizzes: filteredAvailableQuizzes || [],
          assignedQuizzes: [],
          classRank: 0,
          totalClassmates: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextLevelPoints = (currentLevel: number) => {
    return currentLevel * 100;
  };

  const getLevelProgress = (points: number, level: number) => {
    const currentLevelPoints = (level - 1) * 100;
    const nextLevelPoints = level * 100;
    const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    color = "text-blue-600" 
  }: {
    title: string;
    value: number | string;
    icon: any;
    description: string;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const handleReviewQuiz = (quizId: string) => {
    setReviewingQuiz(quizId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (reviewingQuiz) {
    return <QuizReview quizId={reviewingQuiz} onBack={() => setReviewingQuiz(null)} />;
  }

  const { studentData } = stats;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {studentData?.name}! 🎓
        </h1>
        <p className="text-gray-600 mt-2">
          Ready to continue your English learning journey?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <div data-tour="total-points">
          <StatCard
            title="Total Points"
            value={studentData?.total_points || 0}
            icon={Star}
            description="Points earned across all quizzes"
            color="text-yellow-600"
          />
        </div>
        <div data-tour="current-level">
          <StatCard
            title="Current Level"
            value={`Level ${studentData?.level || 1}`}
            icon={Award}
            description={`Progress to Level ${(studentData?.level || 1) + 1}`}
            color="text-purple-600"
          />
        </div>
        <div data-tour="streak-days">
          <StatCard
            title="Streak Days"
            value={studentData?.current_streak || 0}
            icon={Flame}
            description="Consecutive days of learning"
            color="text-orange-600"
          />
        </div>
        <div data-tour="class-rank">
          <StatCard
            title="Class Rank"
            value={stats.classRank > 0 ? `#${stats.classRank} of ${stats.totalClassmates}` : 'N/A'}
            icon={Hash}
            description={studentData?.classes?.name ? `In ${studentData.classes.name}` : 'Not in a class'}
            color="text-blue-600"
          />
        </div>
      </div>

      {/* Level & Progress Section (Optional, can be removed if stats cards are sufficient) */}
      {/* Keeping it for now as it provides a visual progress bar */}
      <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white" data-tour="level-progress">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Level {studentData?.level}</h2>
                <p className="text-blue-100">{studentData?.total_points} total points</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-300" />
                <span className="text-lg font-bold">{studentData?.current_streak} day streak</span>
              </div>
              {stats.classRank > 0 && (
                <p className="text-blue-100">
                  Rank #{stats.classRank} of {stats.totalClassmates}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to Level {(studentData?.level || 1) + 1}</span>
              <span>
                {studentData?.total_points || 0} / {getNextLevelPoints(studentData?.level || 1)} points
              </span>
            </div>
            <Progress 
              value={getLevelProgress(studentData?.total_points || 0, studentData?.level || 1)} 
              className="h-3 bg-white/20"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Quizzes */}
          <Card data-tour="assigned-quizzes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-600" />
                Assigned Quizzes
              </CardTitle>
              <CardDescription>
                Quizzes assigned by your teacher
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.assignedQuizzes.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <ClipboardList className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p>No assigned quizzes yet</p>
                  <p className="text-sm">Your teacher will assign quizzes for you to complete</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.assignedQuizzes.map((assignment) => {
                    const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
                    const daysUntilDue = assignment.due_date 
                      ? Math.ceil((new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <div
                        key={assignment.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                          assignment.completed 
                            ? 'bg-green-50 border-green-200' 
                            : isOverdue 
                            ? 'bg-red-50 border-red-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            assignment.completed 
                              ? 'bg-green-100' 
                              : isOverdue 
                              ? 'bg-red-100'
                              : 'bg-purple-100'
                          }`}>
                            {assignment.completed ? (
                              <Trophy className="h-5 w-5 text-green-600" />
                            ) : (
                              <ClipboardList className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-purple-600'}`} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{assignment.quiz.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Badge className={`text-xs ${
                                assignment.completed 
                                  ? 'bg-green-100 text-green-800' 
                                  : isOverdue 
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {assignment.completed ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                              </Badge>
                              {assignment.due_date && !assignment.completed && (
                                <span className={`text-xs ${isOverdue ? 'text-red-600' : ''}`}>
                                  {isOverdue 
                                    ? `${Math.abs(daysUntilDue)} days overdue`
                                    : daysUntilDue === 0 
                                    ? 'Due today!'
                                    : `${daysUntilDue} days left`
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => assignment.completed ? handleReviewQuiz(assignment.quiz_id) : onStartQuiz(assignment.quiz_id)}
                        >
                          {assignment.completed ? "Review Results" : "Start Quiz"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-green-600" />
                Available Quizzes
              </CardTitle>
              <CardDescription>
                Take these quizzes to earn points and level up!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.availableQuizzes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No quizzes available yet</p>
                  <p className="text-sm">Check back later for new challenges!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {stats.availableQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <PlayCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{quiz.quizzes?.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor((quiz.quizzes?.time_limit || 0) / 60)}min
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => onStartQuiz(quiz.quiz_id)}
                      >
                        Start Quiz
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentQuizzes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PlayCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No quiz attempts yet</p>
                  <p className="text-sm">Start your first quiz to see your progress!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentQuizzes.map((quiz, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{quiz.quizzes?.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(quiz.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {quiz.score}/{quiz.total_questions}
                        </p>
                        <p className="text-sm text-gray-600">
                          {Math.round((quiz.score / quiz.total_questions) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-yellow-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.achievements.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Award className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No achievements yet</p>
                  <p className="text-xs">Complete quizzes to earn badges!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg"
                    >
                      <span className="text-2xl">{achievement.achievements?.badge_icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.achievements?.name}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
