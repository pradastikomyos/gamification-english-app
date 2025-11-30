import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const passwordChangeSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export default function ForcePasswordChange() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: PasswordChangeValues) => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not found. Please log in again.');

      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
      if (updateError) throw updateError;

      const { error: metaDataError } = await supabase.auth.updateUser({
        data: { requires_password_change: false },
      });
      if (metaDataError) throw metaDataError;

      toast({ title: 'Success', description: 'Password updated successfully. Redirecting...' });
      
      // Redirect based on role after a short delay
      setTimeout(() => {
        const userRole = user.user_metadata.role;
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/student'); // Default redirect
        }
      }, 1500);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl">Change Your Password</CardTitle>
          <CardDescription>For security reasons, you must change your temporary password before proceeding.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
