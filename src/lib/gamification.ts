export interface Badge {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string; // e.g., path to an image or a class name for an icon font
}

export interface DifficultyPoints {
  easy: number;
  medium: number;
  hard: number;
}

export interface QuizScoreBreakdown {
  easyQuestions: number;
  mediumQuestions: number;
  hardQuestions: number;
  easyPoints: number;
  mediumPoints: number;
  hardPoints: number;
  timeBonus: number;
  totalPoints: number;
}

export interface TimeBonusTier {
  percentage: number;
  bonus: number;
  label: string;
}

export const DIFFICULTY_POINTS: DifficultyPoints = {
  easy: 2,
  medium: 3,
  hard: 5,
};

export const TIME_BONUS_TIERS: TimeBonusTier[] = [
  { percentage: 25, bonus: 30, label: "Lightning Fast!" },
  { percentage: 50, bonus: 20, label: "Quick Thinker!" },
  { percentage: 75, bonus: 10, label: "Steady Pace!" },
];

export const BADGE_LEVELS: Badge[] = [
  { level: 1, name: "Orange Star 1", minPoints: 0, maxPoints: 100, icon: "⭐" },
  { level: 2, name: "Orange Star 2", minPoints: 101, maxPoints: 200, icon: "⭐⭐" },
  { level: 3, name: "Orange Star 3", minPoints: 201, maxPoints: 300, icon: "⭐⭐⭐" },
  { level: 4, name: "Orange Star 4", minPoints: 301, maxPoints: 400, icon: "⭐⭐⭐⭐" },
  { level: 5, name: "Orange Star 5", minPoints: 401, maxPoints: 500, icon: "⭐⭐⭐⭐⭐" },
];

export function getBadgeByPoints(points: number): Badge | null {
  for (const badge of BADGE_LEVELS) {
    if (points >= badge.minPoints && points <= badge.maxPoints) {
      return badge;
    }
  }
  return null; // No badge found for the given points
}

// Example usage in a React component (conceptual)
/*
import React from 'react';
import { getBadgeByPoints, Badge } from './gamification';

interface UserBadgeDisplayProps {
  userPoints: number;
}

const UserBadgeDisplay: React.FC<UserBadgeDisplayProps> = ({ userPoints }) => {
  const badge = getBadgeByPoints(userPoints);

  if (!badge) {
    return <p>No badge yet. Keep earning points!</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-orange-500 text-2xl">{badge.icon}</span>
      <p className="font-semibold">{badge.name}</p>
      <p className="text-sm text-gray-600">({userPoints} points)</p>
    </div>
  );
};

export default UserBadgeDisplay;
*/

export function calculateTimeBonus(timeTaken: number, timeLimit: number): number {
  if (timeLimit <= 0) {
    return 0;
  }

  const percentageTime = (timeTaken / timeLimit) * 100;

  if (percentageTime <= 25) {
    return 30; // Fastest tier
  } else if (percentageTime <= 50) {
    return 20; // Medium tier
  } else if (percentageTime <= 75) {
    return 10; // Slowest tier
  }

  return 0; // No bonus
}

export function calculateQuizScore(
  answers: Array<{ difficulty: 'easy' | 'medium' | 'hard', isCorrect: boolean }>,
  timeTaken: number,
  timeLimit: number
): QuizScoreBreakdown {
  let easyQuestions = 0;
  let mediumQuestions = 0;
  let hardQuestions = 0;
  let easyPoints = 0;
  let mediumPoints = 0;
  let hardPoints = 0;

  answers.forEach(answer => {
    if (answer.isCorrect) {
      switch (answer.difficulty) {
        case 'easy':
          easyQuestions++;
          easyPoints += DIFFICULTY_POINTS.easy;
          break;
        case 'medium':
          mediumQuestions++;
          mediumPoints += DIFFICULTY_POINTS.medium;
          break;
        case 'hard':
          hardQuestions++;
          hardPoints += DIFFICULTY_POINTS.hard;
          break;
      }
    }
  });

  const timeBonus = calculateTimeBonus(timeTaken, timeLimit);
  const totalPoints = easyPoints + mediumPoints + hardPoints + timeBonus;

  return {
    easyQuestions,
    mediumQuestions,
    hardQuestions,
    easyPoints,
    mediumPoints,
    hardPoints,
    timeBonus,
    totalPoints,
  };
}

export function getTimeBonusTier(timeTaken: number, timeLimit: number): TimeBonusTier | null {
  if (timeLimit <= 0) return null;
  
  const percentageTime = (timeTaken / timeLimit) * 100;
  
  for (const tier of TIME_BONUS_TIERS) {
    if (percentageTime <= tier.percentage) {
      return tier;
    }
  }
  
  return null;
}
