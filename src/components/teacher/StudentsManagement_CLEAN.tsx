import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';

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

interface Class {
  id: string;
  name: string;
}

export function StudentsManagement() {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    classId: '',
    password: '',
  });

  useEffect(() => {
    if (profileId) {
      fetchClasses();
      fetchStudents();
    }
  }, [profileId]);

  const fetchClasses = async () => {
    try {
      console.log('📚 Fetching classes for teacher:', profileId);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', profileId)
        .order('name');

      if (error) throw error;
      
      console.log('📚 Classes found:', data);
      
      // If no classes, create a default class
      if (!data || data.length === 0) {
        console.log('🏫 No classes found, creating default class...');
        await createDefaultClass();
        return;
      }
      
      setClasses(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch classes',
        variant: 'destructive',
      });
    }
  };

  const createDefaultClass = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: 'Kelas XII RPL A',
          teacher_id: profileId
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Default class created:', data);
      setClasses([data]);
      
      toast({
        title: 'Info',
        description: 'Default class "Kelas XII RPL A" has been created for you',
      });
    } catch (error: any) {
      console.error('❌ Error creating default class:', error);
      toast({
        title: 'Error',
        description: 'Failed to create default class',
        variant: 'destructive',
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching students for teacher ID:', profileId);
      
      // First fetch classes for this teacher
      const { data: teacherClasses, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', profileId);

      console.log('👨‍🏫 Teacher classes:', teacherClasses);
      if (classError) {
        console.error('❌ Class fetch error:', classError);
        throw classError;
      }

      if (!teacherClasses || teacherClasses.length === 0) {
        console.log('⚠️ No classes found for teacher');
        setStudents([]);
        return;
      }

      // Then fetch students in these classes
      const classIds = teacherClasses.map(c => c.id);
      console.log('🔍 Searching students in class IDs:', classIds);
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id(name)
        `)
        .in('class_id', classIds)
        .order('name');

      console.log('👥 Students found:', data);
      if (error) {
        console.error('❌ Students fetch error:', error);
        throw error;
      }
      
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const email = generateEmail(formData.name);
      
      console.log('➕ Creating student with data:', { 
        name: formData.name, 
        email, 
        studentId: formData.studentId,
        classId: formData.classId 
      });
      
      // Validate required fields
      if (!formData.name || !formData.studentId) {
        throw new Error('Name and Student ID are required');
      }
      
      // For now, create student without auth user (simplified approach)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          name: formData.name,
          email,
          student_id: formData.studentId,
          class_id: formData.classId || null,
          total_points: 0,
          level: 1,
          current_streak: 0
        })
        .select()
        .single();

      console.log('✅ Student creation result:', { student, error: studentError });

      if (studentError) {
        console.error('❌ Student creation error:', studentError);
        throw new Error(`Failed to create student: ${studentError.message}`);
      }

      toast({
        title: 'Success',
        description: `Student ${formData.name} added successfully!`,
      });

      setIsAddDialogOpen(false);
      setFormData({ name: '', studentId: '', classId: '', password: '' });
      await fetchStudents(); // Wait for refresh
    } catch (error: any) {
      console.error('❌ Add student error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add student',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug function to check database
  const debugDatabase = async () => {
    console.log('🔍 DEBUG: Checking database...');
    console.log('Current profileId:', profileId);
    
    // Check all classes
    const { data: allClasses } = await supabase
      .from('classes')
      .select('*');
    console.log('📚 All classes in database:', allClasses);
    
    // Check all students
    const { data: allStudents } = await supabase
      .from('students')
      .select('*');
    console.log('👥 All students in database:', allStudents);
    
    // Check teachers table
    const { data: allTeachers } = await supabase
      .from('teachers')
      .select('*');
    console.log('👨‍🏫 All teachers in database:', allTeachers);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600">Manage your students and track their progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={debugDatabase}>
            🔍 Debug DB
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter student's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="Enter student ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    required
                  />
                </div>
                {formData.name && (
                  <div className="text-sm text-gray-600">
                    Email will be: {generateEmail(formData.name)}
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Add Student
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students Overview
          </CardTitle>
          <CardDescription>
            Total students: {students.length} | Classes: {classes.length} | Profile ID: {profileId?.slice(0,8)}...
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No students found. Click "Add Student" to get started!
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
