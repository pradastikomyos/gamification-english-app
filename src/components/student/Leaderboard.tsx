import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Target,
  Users,
  BarChart3,
  List,
  TrendingUp
} from 'lucide-react';
import { useLeaderboard } from '@/hooks/student/useLeaderboard';
import { studentQueryKeys } from '@/hooks/student/queryKeys';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaderboardStudent {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  class_name?: string;
  rank: number;
  isCurrentUser: boolean;
}

interface TeacherStudentView {
    id: string;
    name: string;
    email: string;
    class?: { name: string };
}

interface LeaderboardStats {
  totalStudents: number;
  currentUserRank: number;
  averagePoints: number;
  topScore: number;
}

export function Leaderboard() {
  const { profileId, role: userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'class' | 'school'>('school');

  const { data, isLoading: loading, error } = useLeaderboard(profileId, userRole, view);

  const leaderboardData = (data?.leaderboardData || []) as LeaderboardStudent[];
  const teacherViewData = (data?.teacherViewData || []) as TeacherStudentView[];
  const stats = data?.stats || {
    totalStudents: 0,
    currentUserRank: 0,
    averagePoints: 0,
    topScore: 0,
  };

  useEffect(() => {
    if (!authLoading && profileId && userRole) {
      const channel = supabase
        .channel('leaderboard_updates')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'students'
          },
          (payload) => {
            console.log('Student leaderboard data updated!', payload);
            queryClient.invalidateQueries({
              queryKey: studentQueryKeys.leaderboard(profileId, view, userRole),
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, profileId, userRole, view, queryClient]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast({
      title: 'Error',
      description: error.message || 'Failed to fetch data.',
      variant: 'destructive',
    });
  }, [error, toast]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <Trophy className="h-4 w-4 text-gray-400" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProgressToNextLevel = (points: number, level: number) => {
    const pointsForCurrentLevel = (level - 1) * 100;
    const pointsForNextLevel = level * 100;
    const progressInCurrentLevel = points - pointsForCurrentLevel;
    const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
    
    return Math.min(100, (progressInCurrentLevel / pointsNeededForNextLevel) * 100);
  };

  const isLoading = authLoading || loading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (userRole === 'teacher' || userRole === 'admin') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Student List
            </CardTitle>
            <CardDescription>A read-only list of all students.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherViewData.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.class?.name || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole === 'student') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
            <p className="text-gray-600">See how you rank against your classmates</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'class' ? 'default' : 'outline'}
              onClick={() => setView('class')}
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              My Class
            </Button>
            <Button
              variant={view === 'school' ? 'default' : 'outline'}
              onClick={() => setView('school')}
              size="sm"
            >
              <Trophy className="h-4 w-4 mr-2" />
              School
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Rank</p>
                  <p className="text-xl font-bold">
                    #{stats.currentUserRank}
                    <span className="text-sm text-gray-500">/{stats.totalStudents}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-xl font-bold">{stats.averagePoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Crown className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Score</p>
                  <p className="text-xl font-bold">{stats.topScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-xl font-bold">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {view === 'class' ? 'Class Rankings' : 'School Rankings'}
            </CardTitle>
            <CardDescription>
              {view === 'class' 
                ? 'Top performers in your class' 
                : 'Top performers across all classes'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {console.log('About to render leaderboard. Length:', leaderboardData.length, 'Data:', leaderboardData)}
              {leaderboardData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No students found in the leaderboard.</p>
                </div>
              ) : (
                leaderboardData.map((student, index) => {
                  console.log(`Rendering student ${index}:`, student);
                  return (
                  <div
                    key={student.id}
                    className={`p-4 rounded-lg border transition-all ${
                      student.isCurrentUser
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank & Icon */}
                        <div className="flex items-center gap-2">
                          {getRankIcon(student.rank)}
                          <Badge className={getRankBadgeColor(student.rank)}>
                            #{student.rank}
                          </Badge>
                        </div>

                        {/* Avatar & Info */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {student.name}
                              {student.isCurrentUser && (
                                <span className="ml-2 text-sm text-blue-600">(You)</span>
                              )}
                            </p>
                            {student.class_name && (
                              <p className="text-sm text-gray-600">{student.class_name}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        {/* Level Progress */}
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-medium">Level {student.level}</p>
                          <div className="w-16 mt-1">
                            <Progress 
                              value={getProgressToNextLevel(student.total_points, student.level)} 
                              className="h-2"
                            />
                          </div>
                        </div>

                        {/* Streak */}
                        <div className="flex items-center gap-1 min-w-[60px]">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold">{student.current_streak}</span>
                        </div>

                        {/* Points */}
                        <div className="text-right min-w-[80px]">
                          <p className="text-lg font-bold text-blue-600">
                            {student.total_points}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Motivation Card */}
        {stats.currentUserRank > 1 && (
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Keep Going!</h3>
                  <p className="text-white/90">
                    You're #{stats.currentUserRank} out of {stats.totalStudents} students. 
                    {stats.currentUserRank <= 3 
                      ? " You're in the top 3! Amazing work!" 
                      : ` Just ${(leaderboardData[stats.currentUserRank - 2] as LeaderboardStudent)?.total_points - (leaderboardData.find(s => (s as LeaderboardStudent).isCurrentUser) as LeaderboardStudent)?.total_points || 0} more points to move up!`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null; // Should not be reached, but good practice
}
