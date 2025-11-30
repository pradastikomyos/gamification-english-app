import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, BookOpen, UserCheck, Target, Medal, Clock } from 'lucide-react';

interface StudentScore {
  student_id: string;
  student_name: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  submitted_at: string;
}

interface LeaderboardStudent {
  student_id: string;
  student_name: string;
  total_score: number;
  class_name: string;
}

interface QuizOption {
  quiz_id: string;
  quiz_title: string;
  total_questions: number;
  total_attempts: number;
  avg_score: number;
}

interface QuizLeaderboardStudent {
  student_id: string;
  student_name: string;
  class_name: string;
  final_score: number;
  base_score: number;
  bonus_points: number;
  time_taken_seconds: number;
  completed_at: string;
  rank: number;
}

const Reports: React.FC = () => {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New states for quiz-specific leaderboard
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [quizLeaderboard, setQuizLeaderboard] = useState<QuizLeaderboardStudent[]>([]);
  const [quizLeaderboardLoading, setQuizLeaderboardLoading] = useState(false);

  useEffect(() => {
    if (profileId) {
      fetchReportsData();
    }
  }, [profileId]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Get current user ID (not teacher record ID)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get teacher record ID from user_id
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;
      if (!teacherData) throw new Error('Teacher record not found');

      const [scoresRes, leaderboardRes, quizOptionsRes] = await Promise.all([
        supabase.rpc('get_quiz_submissions_for_teacher', { p_teacher_id: teacherData.id }),
        supabase.rpc('get_leaderboard_for_teacher', { p_teacher_id: teacherData.id }),
        supabase.rpc('get_teacher_quizzes_for_leaderboard', { p_teacher_id: teacherData.id })
      ]);

      if (scoresRes.error) throw scoresRes.error;
      setStudentScores(scoresRes.data || []);

      if (leaderboardRes.error) throw leaderboardRes.error;
      setLeaderboard(leaderboardRes.data || []);

      if (quizOptionsRes.error) throw quizOptionsRes.error;
      console.log('Quiz options loaded:', quizOptionsRes.data);
      setQuizOptions(quizOptionsRes.data || []);

      // Auto select first quiz if available
      if (quizOptionsRes.data && quizOptionsRes.data.length > 0) {
        const firstQuizId = quizOptionsRes.data[0].quiz_id;
        console.log('Auto-selecting first quiz:', firstQuizId);
        setSelectedQuizId(firstQuizId);
        await fetchQuizLeaderboard(teacherData.id, firstQuizId);
      }

    } catch (error: any) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reports data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizLeaderboard = async (teacherId: string, quizId: string) => {
    setQuizLeaderboardLoading(true);
    try {
      console.log('Fetching quiz leaderboard for:', { teacherId, quizId });
      
      const { data, error } = await supabase.rpc('get_quiz_leaderboard_for_teacher', { 
        p_teacher_id: teacherId, 
        p_quiz_id: quizId 
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      console.log('Quiz leaderboard data received:', data);
      setQuizLeaderboard(data || []);
    } catch (error: any) {
      console.error('Error fetching quiz leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch quiz leaderboard.',
        variant: 'destructive',
      });
    } finally {
      setQuizLeaderboardLoading(false);
    }
  };

  const handleQuizSelect = async (quizId: string) => {
    setSelectedQuizId(quizId);
    
    // Get teacher ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherData) {
      await fetchQuizLeaderboard(teacherData.id, quizId);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="w-4 h-4 text-center text-sm font-bold text-gray-500">{rank}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Leaderboard Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Overall Top Students
            </CardTitle>
             <CardDescription>Overall leaderboard of students with the highest total points.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading leaderboard...</p>
            ) : leaderboard.length === 0 ? (
              <p>No data available to display leaderboard.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((student, index) => (
                      <TableRow key={student.student_id} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getRankIcon(index + 1)}
                            <span>{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {student.total_score}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz-Specific Leaderboard Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Quiz Leaderboard
            </CardTitle>
            <CardDescription>Performance ranking for specific quiz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quiz Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Quiz:</label>
              <Select value={selectedQuizId} onValueChange={handleQuizSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a quiz to view leaderboard" />
                </SelectTrigger>
                <SelectContent>
                  {quizOptions.map((quiz) => (
                    <SelectItem key={quiz.quiz_id} value={quiz.quiz_id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{quiz.quiz_title}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {quiz.total_attempts} attempts
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Avg: {quiz.avg_score || 0}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quiz Leaderboard Table */}
            {loading ? (
              <p className="text-center py-4">Loading initial data...</p>
            ) : quizOptions.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No quizzes available for leaderboard.</p>
            ) : quizLeaderboardLoading ? (
              <p className="text-center py-4">Loading quiz leaderboard...</p>
            ) : selectedQuizId && quizLeaderboard.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No submissions found for this quiz.</p>
            ) : quizLeaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Bonus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizLeaderboard.map((student) => (
                      <TableRow key={student.student_id} className={student.rank <= 3 ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {getRankIcon(student.rank)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{Number(student.final_score)}</span>
                            {Number(student.bonus_points) > 0 && (
                              <span className="text-xs text-green-600">
                                +{Number(student.bonus_points)} bonus
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatTime(student.time_taken_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={Number(student.bonus_points) > 0 ? "default" : "secondary"} className="text-xs">
                            {Number(student.bonus_points) > 0 ? `+${Number(student.bonus_points)}` : '0'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Student Scores Card - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-500" />
            All Quiz Submissions
          </CardTitle>
          <CardDescription>Detailed scores for each quiz submitted by your students.</CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? (
            <p>Loading scores...</p>
          ) : studentScores.length === 0 ? (
            <p>No student submissions found for your assigned quizzes.</p>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Quiz Title</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentScores.map((score) => (
                    <TableRow key={`${score.student_id}-${score.quiz_id}-${score.submitted_at}`}>
                      <TableCell className="font-medium">{score.student_name}</TableCell>
                      <TableCell>{score.quiz_title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-semibold">
                          {Number(score.score)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {score.submitted_at ? 
                          new Date(score.submitted_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
