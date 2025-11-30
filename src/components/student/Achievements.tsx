import React, { useEffect, useState } from 'react';
import { Badge, BADGE_LEVELS, getBadgeByPoints } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';

interface UserPoints {
  total_points: number;
}

export function Achievements() {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [nextBadge, setNextBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserPoints() {
      if (!user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('students')
          .select('total_points')
          .eq('user_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          const points = data.total_points || 0;
          setUserPoints(points);
          const badge = getBadgeByPoints(points);
          setCurrentBadge(badge);

          if (badge) {
            const nextLevelIndex = BADGE_LEVELS.findIndex(b => b.level === badge.level) + 1;
            if (nextLevelIndex < BADGE_LEVELS.length) {
              setNextBadge(BADGE_LEVELS[nextLevelIndex]);
            } else {
              setNextBadge(null); // User has reached the highest badge
            }
          } else {
            // If no badge yet, set the first badge as the next target
            setNextBadge(BADGE_LEVELS[0]);
          }
        } else {
          setUserPoints(0); // User has no points yet
          setCurrentBadge(null);
          setNextBadge(BADGE_LEVELS[0]); // First badge is the target
        }
      } catch (err: any) {
        console.error("Error fetching user points:", err.message);
        setError("Failed to load achievements. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserPoints();
  }, [user]);

  if (loading) {
    return <div className="text-center py-8">Loading achievements...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  const progressValue = userPoints !== null && nextBadge
    ? ((userPoints - (currentBadge?.minPoints || 0)) / (nextBadge.maxPoints - (currentBadge?.minPoints || 0))) * 100
    : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Your Achievements</h1>

      <Card className="bg-white shadow-lg rounded-lg p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-500" /> Current Badge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentBadge ? (
            <div className="flex items-center gap-4">
              <span className="text-orange-500 text-5xl">{currentBadge.icon}</span>
              <div>
                <p className="text-xl font-bold text-gray-900">{currentBadge.name}</p>
                <p className="text-gray-600">
                  You have {userPoints} points.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">You haven't earned any badges yet. Keep learning!</p>
          )}
        </CardContent>
      </Card>

      {nextBadge && (
        <Card className="bg-white shadow-lg rounded-lg p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="h-7 w-7 text-blue-500" /> Next Badge Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-orange-500 text-5xl">{nextBadge.icon}</span>
              <div>
                <p className="text-xl font-bold text-gray-900">{nextBadge.name}</p>
                <p className="text-gray-600">
                  Reach {nextBadge.minPoints} points to earn this badge!
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Progress to next badge:</p>
              <Progress value={progressValue} className="w-full h-3 bg-gray-200" />
              <p className="text-sm text-gray-600">
                {userPoints !== null ? userPoints : 0} / {nextBadge.minPoints} points
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-lg rounded-lg p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-purple-500" /> All Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGE_LEVELS.map((badge) => (
            <div
              key={badge.level}
              className={`flex flex-col items-center p-4 rounded-lg border ${
                userPoints !== null && userPoints >= badge.minPoints
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span className="text-orange-500 text-4xl mb-2">{badge.icon}</span>
              <p className="font-semibold text-lg text-gray-800">{badge.name}</p>
              <p className="text-sm text-gray-600">
                {badge.minPoints} - {badge.maxPoints} points
              </p>
              {userPoints !== null && userPoints >= badge.minPoints && (
                <span className="mt-2 text-green-600 text-sm font-medium">Earned!</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}