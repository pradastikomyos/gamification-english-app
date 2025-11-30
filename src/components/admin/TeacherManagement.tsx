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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Zod schema for form validation
const teacherSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

// Type for a teacher from the database
export interface Teacher {
  id: string;
  user_id: string; // Important for delete operation
  name: string;
  email: string;
  created_at: string;
}



// Function to call the create RPC
const createTeacher = async (teacherData: TeacherFormData) => {
  const { data, error } = await supabase.rpc('create_teacher_user', {
    p_name: teacherData.name,
    p_email: teacherData.email,
  });
  if (error) throw new Error(error.message);
  return data[0];
};

// Function to call the update RPC
const updateTeacher = async (teacherData: TeacherFormData & { id: string }) => {
  const { error } = await supabase.rpc('update_teacher_details', {
    p_profile_id: teacherData.id,
    p_name: teacherData.name,
    p_email: teacherData.email,
  });
  if (error) throw new Error(error.message);
};

interface TeacherManagementProps {
  teachers: Teacher[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const TeacherManagement: React.FC<TeacherManagementProps> = ({ teachers, isLoading, error }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: '', email: '' },
  });

  // Effect to reset form when edit dialog opens
  useEffect(() => {
    if (teacherToEdit) {
      form.reset({
        name: teacherToEdit.name,
        email: teacherToEdit.email,
      });
    } else {
      form.reset({ name: '', email: '' });
    }
  }, [teacherToEdit, form]);

  const createMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: (data) => {
      toast({
        title: 'Teacher Created!',
        description: `Account for ${data.name} created. Password: ${data.temporary_password}`,
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTeacher,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Teacher details have been updated.' });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setTeacherToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('delete_teacher_user', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Teacher has been deleted.' });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setTeacherToDelete(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setTeacherToDelete(null);
    },
  });

  const onFormSubmit = (values: TeacherFormData) => {
    if (teacherToEdit) {
      updateMutation.mutate({ ...values, id: teacherToEdit.id });
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoading) return <div>Loading teachers...</div>;
  if (error) return <div>Error fetching teachers: {error.message}</div>;

  return (
    <AlertDialog>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Teacher Management</h2>
        <Dialog open={isAddDialogOpen || !!teacherToEdit} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsAddDialogOpen(false);
            setTeacherToEdit(null);
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{teacherToEdit ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
              <DialogDescription>
                {teacherToEdit ? 'Update the teacher details below.' : 'Create a new teacher account. A temporary password will be generated.'}
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
                        <Input placeholder="e.g. John Doe" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="teacher@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (teacherToEdit ? 'Save Changes' : 'Create Teacher')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead><span className="sr-only">Aksi</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers && teachers.length > 0 ? (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}><TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell> {/* Using email as username for now */}
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>N/A</TableCell> {/* Teachers don't have a direct class association */}
                  <TableCell>Aktif</TableCell> {/* Placeholder for status */}
                  <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => setTeacherToEdit(teacher)}>
                          Edit
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={(e) => {
                              e.preventDefault();
                              setTeacherToDelete(teacher);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No teachers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {teacherToDelete && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account for <strong>{teacherToDelete.name}</strong> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeacherToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(teacherToDelete.user_id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete teacher'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
};

export default TeacherManagement;
