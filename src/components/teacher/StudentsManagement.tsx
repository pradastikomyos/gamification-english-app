import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Search, Users } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  student_id: string;
  class_id: string | null;
  total_points: number;
  level: number;
  current_streak: number;
  last_login: string | null;
  classes?: { name: string };
}

export function StudentsManagement() {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profileId) {
      fetchStudents();
    }
  }, [profileId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // First fetch classes for this teacher to get their IDs
      const { data: teacherClasses, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', profileId);

      if (classError) throw classError;

      if (!teacherClasses || teacherClasses.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Then fetch students belonging to those classes
      const classIds = teacherClasses.map(c => c.id);
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id(name)
        `)
        .in('class_id', classIds)
        .order('name');

      if (studentError) throw studentError;
      setStudents(studentData || []);

    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">A view-only list of students in your classes.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students Overview
          </CardTitle>
          <CardDescription>
            Total students: {students.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {students.length === 0 ? 'No students found in your classes.' : 'No students match your search.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        {student.classes ? (
                          <Badge variant="secondary">{student.classes.name}</Badge>
                        ) : (
                          <span className="text-gray-400">No class</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {student.level}</Badge>
                      </TableCell>
                      <TableCell>{student.total_points}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          🔥 {student.current_streak}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
