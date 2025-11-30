import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Zod schema for form validation
const studentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  student_id: z.string().min(3, { message: 'Student ID must be at least 3 characters.' }),
  class_id: z.string().uuid({ message: 'You must select a class.' }),
});

type StudentFormData = z.infer<typeof studentSchema>;

// Define the type for a student based on your database schema
export interface Student {
  student_profile_id: string; // Renamed from id to match RPC response
  user_auth_id: string | null; // Can be null for students without auth users
  name: string;
  email: string;
  student_id: string;
  class_id: string | null; // Add class_id to the Student interface
  created_at: string;
}

// Legacy interface for backward compatibility
interface StudentLegacy {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  student_id: string;
  created_at: string;
}



// Function to call the create RPC
const createStudent = async (studentData: StudentFormData) => {
  const { data, error } = await supabase.functions.invoke('create-student', {
    body: {
      name: studentData.name,
      email: studentData.email,
      student_id: studentData.student_id,
      class_id: studentData.class_id,
    },
  });

  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error);

  return data;
};

// Function to call the update RPC
const updateStudent = async (studentData: StudentFormData & { id: string }) => {
  const { error } = await supabase.rpc('update_student_details', {
    p_profile_id: studentData.id,
    p_name: studentData.name,
    p_email: studentData.email,
    p_student_id: studentData.student_id,
  });
  if (error) throw new Error(error.message);
};

// Function to call the reset password function
const resetStudentPassword = async (email: string) => {
  const { data, error } = await supabase.functions.invoke('reset-student-password', {
    body: { email },
  });

  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error.message);

  return data;
};

interface StudentManagementProps {
  students: Student[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function StudentManagement({ students, isLoading, error }: StudentManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: '', email: '', student_id: '', class_id: '' },
  });

  // Fetch classes when the component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('id, name');
      if (error) {
        toast({ title: 'Error fetching classes', description: error.message, variant: 'destructive' });
      } else {
        setClasses(data);
      }
    };
    fetchClasses();
  }, [toast]);

  // Effect to reset form when edit dialog opens
  useEffect(() => {
    if (studentToEdit) {
      form.reset({
        name: studentToEdit.name,
        email: studentToEdit.email,
        student_id: studentToEdit.student_id,
      });
    } else {
      form.reset({ name: '', email: '', student_id: '', class_id: '' });
    }
  }, [studentToEdit, form]);



  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: (data) => {
      toast({
        title: 'Student Created!',
        description: `Student ${data.student.name} has been created. Password is shown in the table.`,
      });
      // Store the temporary password in the local state
      setTempPasswords(prev => ({ ...prev, [data.student.email]: data.temporaryPassword }));
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateStudent,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Student details have been updated.' });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setStudentToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (studentProfileId: string) => {
      const { error } = await supabase.rpc('admin_delete_student', { p_student_profile_id: studentProfileId });
      if (error) throw error;
      return studentProfileId; // Return the id of the deleted student
    },
    onSuccess: (deletedStudentId) => {
      toast({ title: 'Success', description: 'Student has been deleted.' });
      // Manually update the cache for an instant UI response
      queryClient.setQueryData(['students'], (oldData: Student[] | undefined) => {
        return oldData ? oldData.filter(student => student.student_profile_id !== deletedStudentId) : [];
      });
      setStudentToDelete(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: `Failed to delete student: ${error.message}`, variant: 'destructive' });
      setStudentToDelete(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetStudentPassword,
    onSuccess: (data) => {
      toast({
        title: 'Password Reset Initiated',
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to initiate password reset: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onFormSubmit = (values: StudentFormData) => {
    if (studentToEdit) {
      updateMutation.mutate({ ...values, id: studentToEdit.student_profile_id });
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoading) return <div>Loading students...</div>;
  if (error) return <div>Error fetching students: {error.message}</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Student Management</h2>
        <Dialog open={isAddDialogOpen || !!studentToEdit} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsAddDialogOpen(false);
            setStudentToEdit(null);
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{studentToEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
              <DialogDescription>
                {studentToEdit ? 'Update the student details below.' : 'Create a new student account. A temporary password will be generated.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="jane.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. STU001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {studentToEdit ? 'Save Changes' : 'Create Student'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-6">
          {students && students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.student_profile_id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell> {/* Using email as username for now */}
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{classes.find(c => c.id === student.class_id)?.name || 'N/A'}</TableCell>
                    <TableCell>Aktif</TableCell> {/* Placeholder for status */}
                    <TableCell className="font-mono">{tempPasswords[student.email] || '********'}</TableCell>
                    <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setStudentToEdit(student)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => resetPasswordMutation.mutate(student.email)}
                            disabled={resetPasswordMutation.isPending}
                          >
                            {resetPasswordMutation.isPending ? 'Sending...' : 'Reset Password'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStudentToDelete(student)} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">No students found. Click "Add New Student" to get started.</p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setStudentToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {studentToDelete?.name}'s account
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (studentToDelete) {
                deleteMutation.mutate(studentToDelete.student_profile_id);
              }
            }} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
