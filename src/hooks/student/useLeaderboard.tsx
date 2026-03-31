import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { studentQueryKeys } from './queryKeys';

export interface LeaderboardStudent {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  class_name?: string;
  rank: number;
  isCurrentUser: boolean;
}

export interface TeacherStudentView {
  id: string;
  name: string;
  email: string;
  class?: { name: string } | null;
}

export interface LeaderboardStats {
  totalStudents: number;
  currentUserRank: number;
  averagePoints: number;
  topScore: number;
}

export interface LeaderboardData {
  leaderboardData: LeaderboardStudent[];
  teacherViewData: TeacherStudentView[];
  stats: LeaderboardStats;
}

const EMPTY_DATA: LeaderboardData = {
  leaderboardData: [],
  teacherViewData: [],
  stats: {
    totalStudents: 0,
    currentUserRank: 0,
    averagePoints: 0,
    topScore: 0,
  },
};

async function fetchTeacherData(): Promise<TeacherStudentView[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, email, class:classes(name)')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((student: any) => ({
    ...student,
    class: Array.isArray(student.class) ? student.class[0] : student.class,
  }));
}

async function fetchStudentData(profileId: string, view: 'class' | 'school'): Promise<LeaderboardStudent[]> {
  let studentsData: any[] = [];

  if (view === 'class') {
    const { data: currentUser, error: userError } = await supabase
      .from('students')
      .select('class_id')
      .eq('id', profileId)
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!currentUser?.class_id) {
      return [];
    }

    const { data, error } = await supabase.rpc('get_class_leaderboard', {
      p_class_id: currentUser.class_id,
    });

    if (error) {
      throw new Error(error.message);
    }

    studentsData = data || [];
  } else {
    const { data, error } = await supabase.rpc('get_school_leaderboard');

    if (error) {
      throw new Error(error.message);
    }

    studentsData = data || [];
  }

  return studentsData.map((student, index) => ({
    ...student,
    rank: index + 1,
    isCurrentUser: student.id === profileId,
  }));
}

function calculateStats(students: LeaderboardStudent[]): LeaderboardStats {
  const totalStudents = students.length;
  const currentUserRank = students.find((student) => student.isCurrentUser)?.rank || 0;
  const averagePoints = totalStudents > 0
    ? Math.round(students.reduce((sum, student) => sum + student.total_points, 0) / totalStudents)
    : 0;
  const topScore = totalStudents > 0 ? students[0].total_points : 0;

  return {
    totalStudents,
    currentUserRank,
    averagePoints,
    topScore,
  };
}

async function fetchLeaderboard(
  profileId: string,
  role: string,
  view: 'class' | 'school'
): Promise<LeaderboardData> {
  if (role === 'teacher' || role === 'admin') {
    const teacherViewData = await fetchTeacherData();
    return {
      ...EMPTY_DATA,
      teacherViewData,
    };
  }

  const leaderboardData = await fetchStudentData(profileId, view);

  return {
    leaderboardData,
    teacherViewData: [],
    stats: calculateStats(leaderboardData),
  };
}

export function useLeaderboard(
  profileId: string | null,
  role: string | null,
  view: 'class' | 'school'
) {
  return useQuery<LeaderboardData, Error>({
    queryKey: studentQueryKeys.leaderboard(profileId || 'anonymous', view, role || 'unknown'),
    queryFn: async () => fetchLeaderboard(profileId as string, role as string, view),
    enabled: !!role && (role !== 'student' || !!profileId),
    staleTime: 30 * 1000,
  });
}
