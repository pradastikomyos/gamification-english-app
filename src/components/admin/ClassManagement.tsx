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
import { useClasses } from '@/hooks/useClasses';

// Zod schema for form validation
const classSchema = z.object({
  name: z.string().min(2, { message: 'Class name must be at least 2 characters.' }),
  teacher_id: z.string().uuid({ message: 'You must select a teacher.' }).nullable().optional(),
});

type ClassFormData = z.infer<typeof classSchema>;

interface Class {
  id: string;
  name: string;
  teacher_id: string | null;
  created_at: string;
  teacher_name: string;
}

interface Teacher {
  id: string;
  name: string;
}

// API Functions
const fetchTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase.from('teachers').select('id, name');
  if (error) throw new Error(error.message);
  return data || [];
};

const createClass = async (classData: ClassFormData) => {
  const { data, error } = await supabase.rpc('admin_create_class', {
    p_name: classData.name,
    p_teacher_id: classData.teacher_id || null,
  });
  if (error) throw new Error(error.message);
  return data;
};

const updateClass = async (classData: ClassFormData & { id: string }) => {
  const { error } = await supabase.rpc('admin_update_class', {
    p_class_id: classData.id,
    p_name: classData.name,
    p_teacher_id: classData.teacher_id || null,
  });
  if (error) throw new Error(error.message);
};

const deleteClass = async (classId: string) => {
  const { error } = await supabase.rpc('admin_delete_class', { p_class_id: classId });
  if (error) throw new Error(error.message);
};

export function ClassManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: '', teacher_id: null },
  });

  const { data: classes, isLoading, error } = useClasses();

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: fetchTeachers,
  });

  useEffect(() => {
    if (classToEdit) {
      form.reset({
        name: classToEdit.name,
        teacher_id: classToEdit.teacher_id || null,
      });
      setIsDialogOpen(true);
    } else {
      form.reset({ name: '', teacher_id: null });
    }
  }, [classToEdit, form]);

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsDialogOpen(false);
      setClassToEdit(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  };

  const createMutation = useMutation({
    ...mutationOptions,
    mutationFn: createClass,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Class created successfully.' });
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    ...mutationOptions,
    mutationFn: updateClass,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Class updated successfully.' });
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Class deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setClassToDelete(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setClassToDelete(null);
    },
  });

  const onFormSubmit = (values: ClassFormData) => {
    if (classToEdit) {
      updateMutation.mutate({ ...values, id: classToEdit.id });
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoading) return <div>Loading classes...</div>;
  if (error) return <div>Error fetching classes: {error.message}</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Class Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setClassToEdit(null); setIsDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{classToEdit ? 'Edit Class' : 'Add New Class'}</DialogTitle>
              <DialogDescription>
                {classToEdit ? 'Update the class details below.' : 'Create a new class.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Grade 10-A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Teacher (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers?.filter(t => t.id).map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {classToEdit ? 'Save Changes' : 'Create Class'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-6">
          {classes && classes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{teachers?.find(t => t.id === c.teacher_id)?.name || 'Unassigned'}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setClassToEdit(c)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setClassToDelete(c)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">No classes found. Click "Add New Class" to get started.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!classToDelete} onOpenChange={(isOpen) => !isOpen && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class "{classToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => classToDelete && deleteMutation.mutate(classToDelete.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ClassManagement;
