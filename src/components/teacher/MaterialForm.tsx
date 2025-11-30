import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const materialFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  type: z.enum(['video', 'audio', 'pdf', 'ppt', 'article'], { required_error: 'Please select a material type.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: 'Please select a difficulty level.' }),
  estimated_time: z.coerce.number().int().positive({ message: 'Must be a positive number.' }),
  url: z.string().optional(),
  content: z.string().optional(),
  file: z.instanceof(File).optional(),
  storage_path: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'video' && (!data.url || !z.string().url().safeParse(data.url).success)) {
    ctx.addIssue({ code: 'custom', path: ['url'], message: 'A valid URL is required for video materials.' });
  }
  if (data.type === 'audio' && (!data.url || !z.string().url().regex(/^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/view\?usp=sharing$/).safeParse(data.url).success)) {
    ctx.addIssue({ code: 'custom', path: ['url'], message: 'A valid Google Drive shareable link is required for audio materials.' });
  }
  if (data.type === 'article' && (!data.content || data.content.length < 20)) {
    ctx.addIssue({ code: 'custom', path: ['content'], message: 'Article content must be at least 20 characters long.' });
  }
  if (!data.id && ['pdf', 'ppt', 'audio'].includes(data.type) && !data.file) {
    ctx.addIssue({ code: 'custom', path: ['file'], message: 'A file is required for this material type.' });
  }
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  initialData?: MaterialFormValues | null;
}

export function MaterialForm({ open, onOpenChange, onSave, initialData }: MaterialFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      category: '',
      url: '',
      content: '',
      estimated_time: 0,
    },
  });

  const materialType = form.watch('type');

  useEffect(() => {
    if (open) {
        form.reset(initialData || {
            title: '',
            description: '',
            category: '',
            url: '',
            content: '',
            estimated_time: 0,
            type: undefined,
            difficulty: undefined,
        });
    }
  }, [initialData, open, form]);

  const onSubmit = async (values: MaterialFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      let storage_path = values.storage_path || null;
      let url = values.url || null;

      if (values.file && ['pdf', 'ppt', 'audio'].includes(values.type)) {
        const file = values.file;
        const filePath = `${user.id}/${values.type}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('study-materials').upload(filePath, file);
        if (uploadError) throw uploadError;
        storage_path = filePath;
        url = null; 
      } else if (values.type === 'video') {
        storage_path = null;
      }

      const materialData = {
        id: initialData?.id,
        teacher_id: user.id,
        title: values.title,
        description: values.description,
        type: values.type,
        category: values.category,
        difficulty: values.difficulty,
        estimated_time: values.estimated_time,
        url: url,
        storage_path: storage_path,
        content: values.type === 'article' ? values.content : null,
      };

      const { error } = await supabase.from('study_materials').upsert(materialData);

      if (error) throw error;

      toast({ title: 'Success', description: `Material ${initialData ? 'updated' : 'created'} successfully.` });
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add New'} Material</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Introduction to Tenses" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the material..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="ppt">PPT</SelectItem>

                          <SelectItem value="article">Article/Interactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grammar, Vocabulary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a level" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Time (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            {(materialType === 'video' || materialType === 'audio') && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube/Vimeo URL</FormLabel>
                    <FormControl>
                      <Input placeholder={materialType === 'video' ? "https://www.youtube.com/watch?v=..." : "https://drive.google.com/file/d/.../view?usp=sharing"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {materialType === 'article' && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write the article content here... Supports Markdown." {...field} rows={10} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {['pdf', 'ppt', 'audio'].includes(materialType || '') && (
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Update' : 'Create'} Material
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

