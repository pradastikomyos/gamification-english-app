import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCredentialsDialog } from './UserCredentialsDialog'; // Import the new dialog

const userSchema = z.object({
  name: z.string().min(2, { message: "Nama harus diisi minimal 2 karakter." }),
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
  role: z.enum(['student', 'teacher'], { required_error: "Peran harus dipilih." }),
  class_id: z.string().uuid({ message: "Kelas harus dipilih." }).optional(),
  student_id: z.string().optional(),
}).refine(data => {
    if (data.role === 'student' && (!data.class_id || !data.student_id)) {
        return false;
    }
    return true;
}, {
    message: "Siswa harus memiliki kelas dan NIS.",
    path: ["class_id"],
});

type UserFormData = z.infer<typeof userSchema>;

export const AddUserDialog = ({ isOpen, onOpenChange, classes, isLoadingClasses }) => {
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState({ name: '', role: '', username: '', password: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'student',
      class_id: undefined,
      student_id: '',
    },
  });

  const selectedRole = form.watch('role');

  const createMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const rpcName = userData.role === 'student' ? 'create-student' : 'create-teacher';
      const params = userData.role === 'student' 
        ? { name: userData.name, email: userData.email, student_id: userData.student_id, class_id: userData.class_id }
        : { name: userData.name, email: userData.email };

      const { data, error } = await supabase.functions.invoke(rpcName, {
        body: params,
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error.message || data.error);
      
      return { ...data, role: userData.role, name: userData.name };
    },
    onSuccess: (data) => {
      const queryKey = data.role === 'student' ? ['students'] : ['teachers'];
      queryClient.invalidateQueries({ queryKey });
      
      setCredentials({
        name: data.name,
        role: data.role,
        username: data.student?.email || data.teacher?.email,
        password: data.temporaryPassword || data.temporary_password,
      });
      setShowCredentialsDialog(true);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (values: UserFormData) => {
    createMutation.mutate(values);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Masukkan data pengguna. Username dan password akan dibuat otomatis.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama lengkap" {...field} />
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
                      <Input placeholder="Masukkan email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peran</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih peran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Siswa</SelectItem>
                        <SelectItem value="teacher">Guru</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedRole === 'student' && (
                <>
                  <FormField
                    control={form.control}
                    name="class_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelas</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingClasses ? (
                              <SelectItem value="loading" disabled>Memuat kelas...</SelectItem>
                            ) : (
                              classes?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="student_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIS</FormLabel>
                        <FormControl>
                          <Input placeholder="Nomor Induk Siswa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menambahkan...' : 'Tambah Pengguna'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showCredentialsDialog && (
        <UserCredentialsDialog
          isOpen={showCredentialsDialog}
          onOpenChange={setShowCredentialsDialog}
          onCloseParent={() => onOpenChange(false)}
          name={credentials.name}
          role={credentials.role}
          username={credentials.username}
          password={credentials.password}
        />
      )}
    </>
  );
};
