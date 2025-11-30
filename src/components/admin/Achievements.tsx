import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BADGE_LEVELS, getBadgeByPoints } from '@/lib/gamification';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface StudentRow {
  id: string;
  name: string;
  class_name?: string;
  total_points: number;
  badge: string;
  achievements_count: number;
}

const Achievements: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch all students with class
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name, total_points, class_id, classes:class_id(name)');
      // Fetch all user_achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('student_id');
      // Count achievements per student
      const achievementMap: Record<string, number> = {};
      (userAchievements || []).forEach(ua => {
        achievementMap[ua.student_id] = (achievementMap[ua.student_id] || 0) + 1;
      });
      // Compose rows
      const rows: StudentRow[] = (studentsData || []).map(s => {
        const badgeObj = getBadgeByPoints(s.total_points || 0);
        let class_name = '';
        if (Array.isArray(s.classes) && s.classes.length > 0) {
          class_name = s.classes[0].name;
        } else if (s.classes && typeof s.classes.name === 'string') {
          class_name = s.classes.name;
        }
        return {
          id: s.id,
          name: s.name,
          class_name,
          total_points: s.total_points || 0,
          badge: badgeObj ? badgeObj.name : '-',
          achievements_count: achievementMap[s.id] || 0,
        };
      });
      setStudents(rows);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pencapaian Siswa</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pencapaian Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Nama</th>
                    <th className="px-4 py-2 border">Kelas</th>
                    <th className="px-4 py-2 border">Total Poin</th>
                    <th className="px-4 py-2 border">Badge</th>
                    <th className="px-4 py-2 border">Jumlah Pencapaian</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-4">Belum ada data siswa</td></tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 border font-medium">{s.name}</td>
                        <td className="px-4 py-2 border">{s.class_name || '-'}</td>
                        <td className="px-4 py-2 border text-right">{s.total_points}</td>
                        <td className="px-4 py-2 border">{s.badge}</td>
                        <td className="px-4 py-2 border text-right">{s.achievements_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Achievements;
