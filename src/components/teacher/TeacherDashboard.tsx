
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Users, FileText, TrendingUp, Award, BookOpen, Clock, Monitor } from 'lucide-react';
import { ProjectorDisplay } from './ProjectorDisplay';

interface DashboardStats {
  totalStudents: number;
  totalQuizzes: number;
  totalClasses: number;
  recentActivity: any[];
  topPerformers: any[];
}

export function TeacherDashboard() {
  const { profileId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalQuizzes: 0,
    totalClasses: 0,
    recentActivity: [],
    topPerformers: [],
  });
  const [loading, setLoading] = useState(true);
  const [showProjector, setShowProjector] = useState(false);

  useEffect(() => {
    if (profileId) {
      fetchDashboardData();
    }
  }, [profileId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', profileId);

      const classIds = classes?.map(c => c.id) || [];

      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds);

      // Fetch quizzes count
      const { count: quizzesCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profileId);

      // Fetch top performers
      const { data: topPerformers } = await supabase
        .from('students')
        .select('name, total_points, level, current_streak, classes:class_id(name)')
        .in('class_id', classIds)
        .order('total_points', { ascending: false })
        .limit(5);

      // Fetch recent quiz completions
      const { data: recentActivity } = await supabase
        .from('user_progress')
        .select(`
          *,
          students:student_id(name),
          quizzes:quiz_id(title)
        `)
        .in('student_id', 
          (await supabase
            .from('students')
            .select('id')
            .in('class_id', classIds)
          ).data?.map(s => s.id) || []
        )
        .order('completed_at', { ascending: false })
        .limit(10);

      setStats({
        totalStudents: studentsCount || 0,
        totalQuizzes: quizzesCount || 0,
        totalClasses: classes?.length || 0,
        recentActivity: recentActivity || [],
        topPerformers: topPerformers || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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

  if (showProjector) {
    return <ProjectorDisplay onClose={() => setShowProjector(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your teaching activities.</p>
        </div>
        <Button
          onClick={() => setShowProjector(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3"
          size="lg"
        >
          <Monitor className="h-5 w-5 mr-2" />
          Launch Projector Display
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          description="Active students in your classes"
          color="text-blue-600"
        />
        <StatCard
          title="Total Quizzes"
          value={stats.totalQuizzes}
          icon={FileText}
          description="Quizzes you've created"
          color="text-green-600"
        />
        <StatCard
          title="Classes"
          value={stats.totalClasses}
          icon={BookOpen}
          description="Classes you're teaching"
          color="text-purple-600"
        />
        <StatCard
          title="Avg. Completion"
          value="85%"
          icon={TrendingUp}
          description="Average quiz completion rate"
          color="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Students with highest points in your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topPerformers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No student data available yet
                </p>
              ) : (
                stats.topPerformers.map((student, index) => (
                  <div key={student.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold text-yellow-800">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.classes?.name || 'No class'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{student.total_points} pts</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline">Level {student.level}</Badge>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest quiz completions from your students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No recent activity
                </p>
              ) : (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-l-4 border-green-400 bg-green-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">{activity.students?.name}</p>
                      <p className="text-sm text-gray-600">
                        Completed "{activity.quizzes?.title}"
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {activity.score}/{activity.total_questions}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.round((activity.score / activity.total_questions) * 100)}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
