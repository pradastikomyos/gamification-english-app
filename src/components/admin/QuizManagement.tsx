import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Plus, FileText, Clock, Edit, Trash2, Loader2, User, BookOpen, Send } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { QuestionManager } from '../teacher/QuestionManager';

// Interface untuk objek Kuis dari perspektif Admin
interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
  teacher_name: string | null; // Nama guru yang membuat
  questionCount: number;
}

// State untuk form kuis
interface QuizFormState {
  title: string;
  description: string;
}

interface Class {
  id: string;
  name: string;
  student_count?: number;
}

export default function AdminQuizManagement() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // State untuk form dan aksi
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizFormState>({ title: '', description: '' });
  const [managingQuiz, setManagingQuiz] = useState<Quiz | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [quizToAssign, setQuizToAssign] = useState<Quiz | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchQuizzes();
    fetchAllClasses();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      // Try to use admin RPC first
      const { data: adminData, error: adminError } = await supabase.rpc('get_all_quizzes_admin');
      
      if (!adminError && adminData) {
        const quizzesWithData = adminData.map((quiz: any): Quiz => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          created_at: quiz.created_at,
          teacher_name: quiz.teacher_name || 'N/A',
          questionCount: parseInt(quiz.question_count) || 0,
        }));
        setQuizzes(quizzesWithData);
        return;
      }

      // Fallback to the existing method
      // First, get all quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`id, title, description, created_at, created_by`);

      if (quizzesError) throw quizzesError;

      // Then get questions count for each quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('quiz_id');

      if (questionsError) throw questionsError;

      // Get teachers data
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('id, name');

      if (teachersError) throw teachersError;

      // Create a map for quick teacher lookup
      const teachersMap = new Map(teachersData.map(teacher => [teacher.id, teacher.name]));

      // Create a map for questions count
      const questionsCountMap = new Map();
      questionsData.forEach(question => {
        const count = questionsCountMap.get(question.quiz_id) || 0;
        questionsCountMap.set(question.quiz_id, count + 1);
      });

      const quizzesWithData = quizzesData.map((quiz: any): Quiz => ({
        ...quiz,
        teacher_name: quiz.created_by ? teachersMap.get(quiz.created_by) || 'Unknown Teacher' : 'N/A',
        questionCount: questionsCountMap.get(quiz.id) || 0,
      }));

      setQuizzes(quizzesWithData);
    } catch (error: any) {
      toast({
        title: 'Error Fetching Quizzes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, students:students(count)');

      if (error) throw error;

      const classesWithCounts = (data || []).map((cls: any) => ({
        ...cls,
        student_count: cls.students?.[0]?.count || 0,
      }));
      setAllClasses(classesWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error Fetching Classes',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setQuizForm({ title: '', description: '' });
  };

  // --- Handler CRUD menggunakan RPC ---
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { title, description } = quizForm;
      const { data, error } = await supabase.rpc('create_quiz', {
        p_title: title,
        p_description: description,
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Quiz "${data.title}" created.` });
      setIsCreateDialogOpen(false);
      fetchQuizzes(); // Refresh list
    } catch (error: any) {
      toast({ title: 'Creation Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuiz) return;
    try {
      const { title, description } = quizForm;
      const { data, error } = await supabase.rpc('update_quiz', {
        p_quiz_id: currentQuiz.id,
        p_title: title,
        p_description: description,
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Quiz "${data.title}" updated.` });
      setIsEditDialogOpen(false);
      fetchQuizzes(); // Refresh list
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    const quizTitle = quizToDelete.title; // Store title before deletion
    
    try {
      const { data, error } = await supabase.rpc('delete_quiz', { p_quiz_id: quizToDelete.id });
      if (error) throw error;

      // Immediately update local state to reflect deletion
      setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizToDelete.id));
      
      toast({ title: 'Success', description: `Quiz "${quizTitle}" has been deleted.` });
      setIsDeleteConfirmOpen(false);
      setQuizToDelete(null);
      
      // Refresh list to ensure consistency
      await fetchQuizzes();
    } catch (error: any) {
      console.error('Delete quiz error:', error);
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
      setIsDeleteConfirmOpen(false);
      setQuizToDelete(null);
    }
  };

  const handleAssignQuiz = async () => {
    if (!quizToAssign || selectedClasses.length === 0) {
      toast({ title: 'Error', description: 'Please select a quiz and at least one class.', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.rpc('assign_quiz_to_classes_admin', {
        p_quiz_id: quizToAssign.id,
        p_class_ids: selectedClasses,
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Quiz "${quizToAssign.title}" assigned to ${selectedClasses.length} class(es).` });
      setIsAssignDialogOpen(false);
      setQuizToAssign(null);
      setSelectedClasses([]);
    } catch (error: any) {
      toast({ title: 'Assignment Failed', description: error.message, variant: 'destructive' });
    }
  };

  // --- Pembuka Dialog ---
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setQuizForm({ title: quiz.title, description: quiz.description });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setIsDeleteConfirmOpen(true);
  };

  const openAssignDialog = (quiz: Quiz) => {
    setQuizToAssign(quiz);
    setSelectedClasses([]);
    setIsAssignDialogOpen(true);
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Quizzes...</p>
      </div>
    );
  }

  if (managingQuiz) {
    return (
      <QuestionManager
        quizId={managingQuiz.id}
        quizTitle={managingQuiz.title}
        onBack={() => setManagingQuiz(null)}
        isAdmin={true}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quiz Management</h1>
            <p className="text-muted-foreground">Create, edit, and delete quizzes for all users.</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-lg mt-8">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Quizzes Found</h2>
            <p className="mt-2 mb-6 text-muted-foreground">Get started by creating the first quiz.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-5 w-5" />
              Create a Quiz
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription className="h-10 line-clamp-2">{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                     <User className="h-4 w-4" />
                     <span>{quiz.teacher_name}</span>
                  </div>
                   <div className="flex items-center text-sm text-muted-foreground gap-2 mt-2">
                     <FileText className="h-4 w-4" />
                     <span>{quiz.questionCount} Questions</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 flex-wrap">
                  <Button variant="default" size="sm" onClick={() => openAssignDialog(quiz)}><Send className="mr-2 h-4 w-4"/>Assign</Button>
                  <Button variant="secondary" size="sm" onClick={() => setManagingQuiz(quiz)}><BookOpen className="mr-2 h-4 w-4"/>Manage Questions</Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(quiz)}><Edit className="mr-2 h-4 w-4"/>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(quiz)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Quiz</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditQuiz} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update Quiz</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the quiz "{quizToDelete?.title}" and all of its associated questions.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteQuiz}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Assign Quiz Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Quiz: {quizToAssign?.title}</DialogTitle>
              <DialogDescription>Select the classes to assign this quiz to.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClasses.includes(cls.id)}
                      onCheckedChange={(checked) => {
                        setSelectedClasses(prev => 
                          checked ? [...prev, cls.id] : prev.filter(id => id !== cls.id)
                        );
                      }}
                    />
                    <Label htmlFor={`class-${cls.id}`} className="flex-1 cursor-pointer">
                      {cls.name} ({cls.student_count || 0} students)
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleAssignQuiz}>Assign to {selectedClasses.length} Class(es)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}
