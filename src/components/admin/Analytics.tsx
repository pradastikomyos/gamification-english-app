import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen, Award, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  class_name?: string;
}

interface Activity {
  students?: { name: string };
  quizzes?: { title: string };
  completed_at: string;
  score: number;
  total_questions: number;
}

const Analytics: React.FC = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [topStudents, setTopStudents] = useState<Student[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Total students
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      setTotalStudents(studentsCount || 0);
      // Total classes
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });
      setTotalClasses(classesCount || 0);
      // Average score
      const { data: progress } = await supabase
        .from('user_progress')
        .select('score, total_questions')
        .not('score', 'is', null)
        .not('total_questions', 'is', null);
      if (progress && progress.length > 0) {
        const total = progress.reduce((acc, cur) => acc + (cur.score / (cur.total_questions || 1)), 0);
        setAvgScore(Math.round((total / progress.length) * 100));
      } else {
        setAvgScore(null);
      }
      // Top 5 students
      const { data: top } = await supabase
        .from('students')
        .select('id, name, total_points, level, current_streak, class_id, classes:class_id(name)')
        .order('total_points', { ascending: false })
        .limit(5);
      setTopStudents(
        (top || []).map(s => {
          let class_name = '';
          if (Array.isArray(s.classes) && s.classes.length > 0) {
            class_name = s.classes[0].name;
          } else if (s.classes && typeof s.classes.name === 'string') {
            class_name = s.classes.name;
          }
          return { ...s, class_name };
        })
      );
      // Recent activity
      const { data: activity } = await supabase
        .from('user_progress')
        .select('*, students:student_id(name), quizzes:quiz_id(title)')
        .order('completed_at', { ascending: false })
        .limit(10);
      setRecentActivity(activity || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analitik Pencapaian</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" />Total Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Jumlah seluruh siswa aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-600" />Total Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">Jumlah kelas terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-green-600" />Rata-rata Nilai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore !== null ? `${avgScore}%` : '-'}</div>
            <p className="text-xs text-muted-foreground">Rata-rata skor penyelesaian kuis</p>
          </CardContent>
        </Card>
      </div>
      {/* Top Students */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-600" />Top 5 Siswa</CardTitle>
          <CardDescription>Siswa dengan poin tertinggi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Belum ada data siswa</p>
            ) : (
              topStudents.map((student, idx) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold text-yellow-800">{idx + 1}</div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.class_name || 'Tanpa kelas'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{student.total_points} pts</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Level {student.level}</span>
                      <span>🔥 {student.current_streak}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-green-600" />Aktivitas Terbaru</CardTitle>
          <CardDescription>Penyelesaian kuis terakhir oleh siswa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Belum ada aktivitas</p>
            ) : (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-l-4 border-green-400 bg-green-50 rounded-r-lg">
                  <div>
                    <p className="font-medium">{activity.students?.name}</p>
                    <p className="text-sm text-gray-600">Selesai "{activity.quizzes?.title}"</p>
                    <p className="text-xs text-gray-500">{new Date(activity.completed_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{activity.score}/{activity.total_questions}</p>
                    <p className="text-sm text-gray-600">{activity.total_questions ? Math.round((activity.score / activity.total_questions) * 100) : 0}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
