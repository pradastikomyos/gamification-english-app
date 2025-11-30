import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  Star, 
  Flame, 
  TrendingUp, 
  Award,
  Wallet,
  Target,
  Crown
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  class_id: string;
}

interface ClassRanking {
  rank: number;
  total_students: number;
  potential_reward: number;
}

interface RewardsProps {
  onNavigateToLeaderboard?: () => void;
  onNavigateToAchievements?: () => void;
}

export function Rewards({ onNavigateToLeaderboard, onNavigateToAchievements }: RewardsProps = {}) {
  const { profileId } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [classRanking, setClassRanking] = useState<ClassRanking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileId) {
      fetchRewardData();
    }
  }, [profileId]);

  const fetchRewardData = async () => {
    try {
      setLoading(true);

      // Fetch student data
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', profileId)
        .single();

      if (student) {
        setStudentData(student);

        // Get class ranking
        if (student.class_id) {
          const { data: classmates } = await supabase
            .from('students')
            .select('total_points')
            .eq('class_id', student.class_id)
            .order('total_points', { ascending: false });

          if (classmates) {
            const rank = classmates.findIndex(s => s.total_points <= student.total_points) + 1;
            const rewardAmounts = { 1: 100000, 2: 50000, 3: 25000 };
            const potentialReward = rewardAmounts[rank as keyof typeof rewardAmounts] || 0;

            setClassRanking({
              rank,
              total_students: classmates.length,
              potential_reward: potentialReward
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reward data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getNextMilestone = (points: number) => {
    const milestones = [500, 1000, 2500, 5000, 10000];
    return milestones.find(m => m > points) || null;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-8 w-8 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-8 w-8 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-8 w-8 text-amber-600" />;
    return <Trophy className="h-6 w-6 text-gray-400" />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-amber-400 to-amber-600';
    return 'from-blue-400 to-blue-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone(studentData?.total_points || 0);
  const milestoneProgress = nextMilestone 
    ? ((studentData?.total_points || 0) / nextMilestone) * 100 
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Rewards 💰</h1>
        <p className="text-sm sm:text-base text-gray-600">Raih point tertinggi untuk mendapatkan rewards</p>
      </div>

      {/* Current Rank Card */}
      {classRanking && (
        <Card className={`bg-gradient-to-r ${getRankColor(classRanking.rank)} text-white shadow-xl mx-4 sm:mx-0`}>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6 text-center sm:text-left">
                {getRankIcon(classRanking.rank)}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Rank #{classRanking.rank}</h2>
                  <p className="text-white/90 text-sm sm:text-base">of {classRanking.total_students} students</p>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">
                    {studentData?.total_points} total points
                  </p>
                </div>
              </div>
              {classRanking.potential_reward > 0 && (
                <div className="text-center sm:text-right">
                  <p className="text-white/90 text-xs sm:text-sm">Potential Reward</p>
                  <p className="text-3xl sm:text-4xl font-bold">
                    {classRanking.potential_reward === 100000 ? '100K' :
                     classRanking.potential_reward === 50000 ? '50K' : '25K'}
                  </p>
                  <p className="text-white/80 text-xs">
                    {formatCurrency(classRanking.potential_reward)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* E-wallet Visual Display */}
      <Card className="bg-white shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Reward Tiers
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Raih point tertinggi untuk mendapatkan rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* DANA Logo and Rewards */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src="/rewards/Logo DANA - zonalogo.com.png" 
                alt="DANA" 
                className="h-16 w-auto"
              />
            </div>
            
            {/* Reward Amounts - Enhanced Visual Hierarchy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
              {/* Rank 1 - 100K - LARGEST and most prominent */}
              <div className="text-center p-8 bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-200 rounded-2xl border-4 border-yellow-300 shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-pulse">
                <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3 animate-bounce" />
                <p className="text-lg font-bold text-gray-700 mb-2">🥇 RANK 1</p>
                <p className="text-8xl font-black text-green-600 mb-2 drop-shadow-lg animate-pulse">100K</p>
                <p className="text-sm font-semibold text-gray-600 bg-white/50 px-3 py-1 rounded-full">Rp 100.000</p>
                <p className="text-xs text-yellow-700 mt-2 font-medium animate-pulse">JUARA KELAS!</p>
              </div>

              {/* Rank 2 - 50K */}
              <div className="text-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102">
                <Trophy className="h-10 w-10 text-gray-500 mx-auto mb-2 hover:animate-pulse" />
                <p className="text-base font-semibold text-gray-600 mb-1">🥈 RANK 2</p>
                <p className="text-5xl font-bold text-green-600 mb-1">50K</p>
                <p className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Rp 50.000</p>
              </div>

              {/* Rank 3 - 25K */}
              <div className="text-center p-6 bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl border-2 border-amber-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102">
                <Trophy className="h-10 w-10 text-amber-600 mx-auto mb-2 hover:animate-pulse" />
                <p className="text-base font-semibold text-gray-600 mb-1">🥉 RANK 3</p>
                <p className="text-4xl font-bold text-green-600 mb-1">25K</p>
                <p className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Rp 25.000</p>
              </div>
            </div>

            {/* GoPay Logo */}
            <div className="flex justify-center mt-6">
              <img 
                src="/rewards/Logo GoPay -  zonalogo.com.png" 
                alt="GoPay" 
                className="h-16 w-auto"
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Tingkatkan ranking untuk rewards lebih besar! 🚀
            </h3>
            <p className="text-gray-600 mb-4">
              Kerjakan lebih banyak quiz dan raih poin untuk naik peringkat
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onNavigateToLeaderboard}
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onNavigateToAchievements}
              >
                <Award className="h-4 w-4 mr-2" />
                Check Achievements
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextMilestone} points</span>
                <span>{studentData?.total_points} / {nextMilestone}</span>
              </div>
              <Progress value={milestoneProgress} className="h-3" />
              <p className="text-sm text-gray-600">
                {nextMilestone - (studentData?.total_points || 0)} points to go!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mx-4 sm:mx-0">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2 hover:animate-spin transition-transform" />
            <p className="text-2xl font-bold text-gray-800">{studentData?.total_points || 0}</p>
            <p className="text-sm text-gray-600">Total Points</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 text-center">
            <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2 hover:animate-pulse transition-transform" />
            <p className="text-2xl font-bold text-gray-800">{studentData?.current_streak || 0}</p>
            <p className="text-sm text-gray-600">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2 hover:animate-bounce transition-transform" />
            <p className="text-2xl font-bold text-gray-800">Level {studentData?.level || 1}</p>
            <p className="text-sm text-gray-600">Current Level</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}