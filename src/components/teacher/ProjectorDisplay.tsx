import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  Crown, 
  Medal,
  Star,
  Flame,
  Sparkles,
  X
} from 'lucide-react';

interface StudentRanking {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  rank: number;
  reward_amount?: number;
}

interface ProjectorDisplayProps {
  classId?: string;
  onClose: () => void;
}

export function ProjectorDisplay({ classId, onClose }: ProjectorDisplayProps) {
  const { profileId } = useAuth();
  const [students, setStudents] = useState<StudentRanking[]>([]);
  const [className, setClassName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [celebrationMode, setCelebrationMode] = useState(false);

  useEffect(() => {
    fetchLeaderboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLeaderboardData, 30000);
    return () => clearInterval(interval);
  }, [classId]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      // Get teacher's class if no classId provided
      let targetClassId = classId;
      if (!targetClassId) {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('class_id, classes(name)')
          .eq('id', profileId)
          .single();
        
        if (teacherData) {
          targetClassId = teacherData.class_id;
          setClassName(teacherData.classes?.name || 'Unknown Class');
        }
      } else {
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', targetClassId)
          .single();
        
        if (classData) {
          setClassName(classData.name);
        }
      }

      if (targetClassId) {
        // Fetch class leaderboard
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, name, total_points, level, current_streak')
          .eq('class_id', targetClassId)
          .order('total_points', { ascending: false })
          .limit(10);

        if (studentsData) {
          const rewardAmounts = { 1: 100000, 2: 50000, 3: 25000 };
          const rankedStudents = studentsData.map((student, index) => ({
            ...student,
            rank: index + 1,
            reward_amount: rewardAmounts[(index + 1) as keyof typeof rewardAmounts] || 0
          }));

          setStudents(rankedStudents);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-12 w-12 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-10 w-10 text-gray-400" />;
    if (rank === 3) return <Medal className="h-10 w-10 text-amber-500" />;
    return <Trophy className="h-8 w-8 text-blue-400" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white text-xl px-4 py-2';
    if (rank === 2) return 'bg-gray-400 text-white text-lg px-3 py-1';
    if (rank === 3) return 'bg-amber-500 text-white text-lg px-3 py-1';
    return 'bg-blue-500 text-white px-2 py-1';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return '100K';
    if (amount >= 50000) return '50K';
    if (amount >= 25000) return '25K';
    return '';
  };

  const triggerCelebration = () => {
    setCelebrationMode(true);
    setTimeout(() => setCelebrationMode(false), 5000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-2xl">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 z-50 overflow-auto">
      {/* Close Button */}
      <Button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white"
        size="lg"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Celebration Overlay */}
      {celebrationMode && (
        <div className="absolute inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Sparkles className="h-32 w-32 text-yellow-400 animate-bounce" />
          </div>
        </div>
      )}

      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-2 sm:mb-4 drop-shadow-lg">
            🏆 CLASS LEADERBOARD 🏆
          </h1>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-300 mb-1 sm:mb-2">{className}</h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/80">Anna 曼达廷 Champions</p>
          
          {/* Reward Info */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 lg:gap-8 mt-4 sm:mt-6">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-yellow-400 drop-shadow-lg">100K</div>
              <div className="text-base sm:text-lg lg:text-xl text-white">🥇 1st Place</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-300">50K</div>
              <div className="text-base sm:text-lg lg:text-xl text-white">🥈 2nd Place</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-400">25K</div>
              <div className="text-base sm:text-lg lg:text-xl text-white">🥉 3rd Place</div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 max-w-6xl mx-auto">
          {/* 2nd Place */}
          {students[1] && (
            <div className="text-center">
              <div className="bg-gradient-to-b from-gray-300 to-gray-500 rounded-2xl p-6 h-48 flex flex-col justify-end relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 border-4 border-gray-400">
                    {getInitials(students[1].name)}
                  </div>
                </div>
                <Medal className="h-12 w-12 text-white mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-white mb-1">{students[1].name}</h3>
                <p className="text-xl text-white/90">{students[1].total_points} pts</p>
                <div className="text-4xl font-black text-green-400 mt-2">50K</div>
              </div>
              <div className="bg-gray-400 text-white text-2xl font-bold py-4 rounded-b-lg">
                #2
              </div>
            </div>
          )}

          {/* 1st Place - Tallest */}
          {students[0] && (
            <div className="text-center">
              <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-2xl p-8 h-64 flex flex-col justify-end relative">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-yellow-600 border-4 border-yellow-400">
                    {getInitials(students[0].name)}
                  </div>
                </div>
                <Crown className="h-16 w-16 text-white mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-white mb-2">{students[0].name}</h3>
                <p className="text-2xl text-white/90">{students[0].total_points} pts</p>
                <div className="text-6xl font-black text-green-400 mt-3 drop-shadow-lg">100K</div>
              </div>
              <div className="bg-yellow-500 text-white text-3xl font-bold py-6 rounded-b-lg">
                👑 CHAMPION 👑
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {students[2] && (
            <div className="text-center">
              <div className="bg-gradient-to-b from-amber-400 to-amber-600 rounded-2xl p-6 h-48 flex flex-col justify-end relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-amber-600 border-4 border-amber-400">
                    {getInitials(students[2].name)}
                  </div>
                </div>
                <Medal className="h-12 w-12 text-white mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-white mb-1">{students[2].name}</h3>
                <p className="text-xl text-white/90">{students[2].total_points} pts</p>
                <div className="text-4xl font-black text-green-400 mt-2">25K</div>
              </div>
              <div className="bg-amber-500 text-white text-2xl font-bold py-4 rounded-b-lg">
                #3
              </div>
            </div>
          )}
        </div>

        {/* Rest of Leaderboard */}
        {students.length > 3 && (
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-white text-center mb-6">Other Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.slice(3).map((student) => (
                <Card key={student.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={getRankBadgeColor(student.rank)}>
                          #{student.rank}
                        </Badge>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold text-white">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">{student.name}</h4>
                          <p className="text-white/80">Level {student.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-300">{student.total_points}</p>
                        <p className="text-white/80 text-sm">points</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Flame className="h-4 w-4 text-orange-400" />
                          <span className="text-white/80 text-sm">{student.current_streak}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
          <Button
            onClick={triggerCelebration}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
          >
            🎉 Celebrate Winners!
          </Button>
          <Button
            onClick={fetchLeaderboardData}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 text-lg"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-white/60 text-lg">
            Keep learning, keep growing! 📚✨
          </p>
        </div>
      </div>
    </div>
  );
}