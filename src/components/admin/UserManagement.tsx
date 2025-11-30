import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentManagement } from './StudentManagement';
import TeacherManagement from './TeacherManagement';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCcw } from 'lucide-react';
import { AddUserDialog } from './AddUserDialog';
import { supabase } from '@/lib/supabase';
import type { Teacher } from './TeacherManagement';
import type { Student } from './StudentManagement';
import { useClasses } from '@/hooks/useClasses';

// Fetch function to get all teachers
const fetchTeachers = async (): Promise<Teacher[]> => {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_teachers_admin');
    if (!rpcError && rpcData) {
      return rpcData;
    }
    const { data, error } = await supabase
      .from('teachers')
      .select('id, user_id, name, email, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  } catch (err: any) {
    throw new Error(err.message || 'Failed to fetch teachers');
  }
};

// Fetch function to get all students
const fetchStudents = async (): Promise<Student[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('student_profile_id:id, user_auth_id:user_id, name, email, student_id, class_id, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return (data as any) || [];
  } catch (err: any) {
    throw new Error(err.message || 'Failed to fetch students');
  }
};

const UserManagement: React.FC = () => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: students,
    isLoading: isLoadingStudents,
    error: errorStudents,
  } = useQuery<Student[], Error>({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });

  const {
    data: teachers,
    isLoading: isLoadingTeachers,
    error: errorTeachers,
  } = useQuery<Teacher[], Error>({
    queryKey: ['teachers'],
    queryFn: fetchTeachers,
  });

  const { 
    data: classes, 
    isLoading: isLoadingClasses 
  } = useClasses();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['students'] });
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
    queryClient.invalidateQueries({ queryKey: ['classes'] });
  };

  const handleAddUserClick = () => {
    setIsAddUserOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddUserClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Tabs defaultValue="students">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students">
            Siswa <span className="ml-1 font-bold">{isLoadingStudents ? '...' : students?.length ?? 0}</span>
          </TabsTrigger>
          <TabsTrigger value="teachers">
            Guru <span className="ml-1 font-bold">{isLoadingTeachers ? '...' : teachers?.length ?? 0}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <StudentManagement
            students={students}
            isLoading={isLoadingStudents}
            error={errorStudents}
          />
        </TabsContent>
        <TabsContent value="teachers">
          <TeacherManagement
            teachers={teachers}
            isLoading={isLoadingTeachers}
            error={errorTeachers}
          />
        </TabsContent>
      </Tabs>
      {isAddUserOpen && (
        <AddUserDialog
          isOpen={isAddUserOpen}
          onOpenChange={setIsAddUserOpen}
          classes={classes}
          isLoadingClasses={isLoadingClasses}
        />
      )}
    </>
  );
};

export default UserManagement;
