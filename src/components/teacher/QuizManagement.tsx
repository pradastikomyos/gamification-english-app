import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Plus, FileText, Clock, Award, Edit, Trash2, Sparkles, Loader2, Settings } from 'lucide-react';
import { QuestionManager } from './QuestionManager';
// import { QuizGenerator } from './QuizGenerator';

// Interface untuk objek Kuis
interface Quiz {
  id: string;
  title: string;
  description: string;
  time_limit: number;
  points_per_question: number;
  created_by?: string;
  created_at: string;
  questionCount: number;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  pointBreakdown: { easy: number; medium: number; hard: number };
}

// State untuk form kuis
interface QuizFormState {
  title: string;
  description: string;
  time_limit: number;
}

export default function QuizManagement() {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // State untuk dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    // const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // State untuk form dan aksi
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizFormState>({
    title: '',
    description: '',
    time_limit: 600,
  });

  // Ambil kuis saat komponen dimuat jika profileId tersedia
  useEffect(() => {
    if (profileId) {
      fetchQuizzes();
    }
  }, [profileId]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const validProfileId = user?.id;

      console.log('Using valid profileId:', validProfileId);

      // Use the corrected function that filters by teacher_id (user_id)
      const { data, error } = await supabase
        .rpc('get_quizzes_for_teacher', { teacher_id_param: validProfileId });

      if (error) throw error;

      // Get questions for each quiz separately with proper error handling
      const quizzesWithQuestions = await Promise.all(
        data.map(async (quiz: any) => {
          try {
            const { data: questions, error: questionsError } = await supabase
              .from('questions')
              .select('id, points, difficulty')
              .eq('quiz_id', quiz.id);

            if (questionsError) {
              console.error('Error fetching questions for quiz', quiz.id, questionsError);
              return { ...quiz, questions: [] };
            }

            console.log(`Questions for quiz ${quiz.id}:`, questions);
            return { ...quiz, questions: questions || [] };
          } catch (err) {
            console.error('Exception fetching questions for quiz', quiz.id, err);
            return { ...quiz, questions: [] };
          }
        })
      );
      
      console.log('Fetched quizzes data:', quizzesWithQuestions);
      console.log('First quiz data:', quizzesWithQuestions[0]);
      console.log('First quiz questions:', quizzesWithQuestions[0]?.questions);

      const quizzesWithCalculatedData = quizzesWithQuestions.map((quiz: any): Quiz => {
        const questions = quiz.questions || [];
        const questionCount = questions.length;
        const totalPoints = questions.reduce((sum: number, q: { points: number | null }) => sum + (q.points || 0), 0);

        const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
        const pointBreakdown = { easy: 0, medium: 0, hard: 0 };

        questions.forEach((q: { difficulty: 'easy' | 'medium' | 'hard'; points: number | null }) => {
          if (q.difficulty) {
            difficultyBreakdown[q.difficulty]++;
            pointBreakdown[q.difficulty] += q.points || 0;
          }
        });
        
        return {
          ...quiz,
          questionCount: questionCount,
          totalPoints: totalPoints,
          difficulty: 'mixed', // Bisa dikembangkan untuk kalkulasi otomatis
          difficultyBreakdown,
          pointBreakdown,
        };
      });

      setQuizzes(quizzesWithCalculatedData);
    } catch (error: any) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: 'Error Fetching Quizzes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuizForm({
      title: '',
      description: '',
      time_limit: 600,
    });
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { title, description, time_limit } = quizForm;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get teacher ID from teachers table
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacherData) {
        throw new Error('Teacher profile not found. Please contact administrator.');
      }

      // Create quiz with proper teacher references
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          time_limit,
          teacher_id: user.id, // Use auth.uid() as teacher_id (for RLS)
          created_by: teacherData.id, // Use teachers.id for foreign key
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        console.error('Create error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create quiz - no data returned');
      }

      toast({ 
        title: 'Success', 
        description: `Quiz "${title}" created successfully!` 
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchQuizzes();
    } catch (error: any) {
      console.error('Create quiz error:', error);
      toast({ 
        title: 'Creation Failed', 
        description: error.message || 'Failed to create quiz', 
        variant: 'destructive' 
      });
    }
  };

  const handleEditQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuiz) return;
    try {
      const { title, description, time_limit } = quizForm;
      
      // Get current user to ensure we're the teacher
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Update quiz directly with proper RLS
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          title, 
          description, 
          time_limit,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentQuiz.id)
        .eq('teacher_id', user.id) // Extra security check
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from update - quiz not found or access denied');
      }

      toast({ 
        title: 'Success', 
        description: `Quiz "${data.title}" updated successfully!` 
      });
      
      setIsEditDialogOpen(false);
      setCurrentQuiz(null);
      resetForm();
      fetchQuizzes();
    } catch (error: any) {
      console.error('Quiz update failed:', error);
      toast({ 
        title: 'Update Failed', 
        description: error.message || 'Failed to update quiz', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) {
      toast({ title: 'Error', description: 'No quiz selected for deletion.', variant: 'destructive' });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Delete quiz directly with proper RLS
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizToDelete.id)
        .eq('teacher_id', user.id); // Extra security check

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast({ 
        title: 'Success', 
        description: `Quiz "${quizToDelete.title}" deleted successfully!` 
      });
      
      // Optimistic UI update
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizToDelete.id));

    } catch (error: any) {
      console.error("Deletion failed:", error);
      toast({ 
        title: 'Deletion Failed', 
        description: error.message || 'Failed to delete quiz', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setQuizToDelete(null);
    }
  };

  // --- Pembuka Dialog ---
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description,
      time_limit: quiz.time_limit,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setIsDeleteConfirmOpen(true);
  };

  // --- Helper Functions ---
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): string => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      case 'mixed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading your quizzes...</p>
      </div>
    );
  }

  if (selectedQuizId) {
    return (
      <QuestionManager 
        quizId={selectedQuizId!} 
        onBack={() => setSelectedQuizId(null)}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">My Quizzes</h1>
            <p className="mt-1 text-muted-foreground">
              Create, manage, and track your quizzes all in one place.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Quiz
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {quizzes.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg mt-8">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Quizzes Yet</h2>
            <p className="mt-2 mb-6 text-muted-foreground">
              It looks like you haven't created any quizzes. Get started now!
            </p>
            <Button onClick={openCreateDialog} className="h-11 rounded-md px-8">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Quiz
            </Button>
          </div>
        ) : (
          // Quiz Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden bg-card">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold truncate" title={quiz.title}>{quiz.title}</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className={`${getDifficultyColor(quiz.difficulty)} text-white border-0`}>{quiz.difficulty}</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Difficulty Level</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription className="h-10 text-sm line-clamp-2">{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-2">
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Number of Questions"><FileText className="h-3 w-3" /> {quiz.questionCount} Qs</div>
                    <div className="flex items-center gap-1" title="Time Limit"><Clock className="h-3 w-3" /> {formatTime(quiz.time_limit)}</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-pointer" title="Total Points & Breakdown">
                          <Award className="h-3 w-3" /> {quiz.totalPoints} Pts
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-bold mb-1">Points Breakdown:</p>
                          {quiz.pointBreakdown.easy > 0 && <div><span className="text-green-500 font-semibold">Easy:</span> {quiz.pointBreakdown.easy} pts ({quiz.difficultyBreakdown.easy} Qs)</div>}
                          {quiz.pointBreakdown.medium > 0 && <div><span className="text-yellow-500 font-semibold">Medium:</span> {quiz.pointBreakdown.medium} pts ({quiz.difficultyBreakdown.medium} Qs)</div>}
                          {quiz.pointBreakdown.hard > 0 && <div><span className="text-red-500 font-semibold">Hard:</span> {quiz.pointBreakdown.hard} pts ({quiz.difficultyBreakdown.hard} Qs)</div>}
                          {quiz.totalPoints === 0 && <p className="text-muted-foreground">No points assigned yet.</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-4 mt-auto bg-muted/30 px-4 py-2">
                  <div className="flex items-center space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="h-9 rounded-md px-3 !bg-black !text-white !border !border-black hover:!bg-gray-900 focus:!ring-2 focus:!ring-black focus:!ring-offset-2 shadow-lg" onClick={() => setSelectedQuizId(quiz.id)}>
                          Kelola Soal
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Kelola soal untuk kuis ini</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="h-10 w-10 hover:bg-accent hover:text-accent-foreground" onClick={() => openEditDialog(quiz)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Edit Quiz Details</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="h-10 w-10 hover:bg-accent hover:text-accent-foreground" onClick={() => openDeleteDialog(quiz)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete Quiz</p></TooltipContent>
                    </Tooltip>
                  </div>
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
              <DialogDescription>Fill in the details for your new quiz.</DialogDescription>
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
              <div>
                <Label htmlFor="time_limit">Time Limit (seconds)</Label>
                <Input id="time_limit" type="number" value={quizForm.time_limit} onChange={(e) => setQuizForm({ ...quizForm, time_limit: parseInt(e.target.value, 10) })} required />
              </div>

              <DialogFooter>
                <Button type="button" className="hover:bg-accent hover:text-accent-foreground" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Quiz</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Quiz</DialogTitle>
              <DialogDescription>Update the details for "{currentQuiz?.title}".</DialogDescription>
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
              <div>
                <Label htmlFor="edit-time_limit">Time Limit (seconds)</Label>
                <Input id="edit-time_limit" type="number" value={quizForm.time_limit} onChange={(e) => setQuizForm({ ...quizForm, time_limit: parseInt(e.target.value, 10) })} required />
              </div>

              <DialogFooter>
                <Button type="button" className="hover:bg-accent hover:text-accent-foreground" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
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
                This action cannot be undone. This will permanently delete the quiz and all associated questions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setQuizToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteQuiz}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
