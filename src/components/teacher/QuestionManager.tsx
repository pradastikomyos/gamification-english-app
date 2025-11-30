import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Plus, FileText, CheckCircle, XCircle, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CreateQuestionForm from './CreateQuestionForm';
import ImageZoom from '@/components/ui/image-zoom';

// Interfaces
interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  media_url?: string;
  points: number;
  created_at: string;
}

interface QuizDetails {
  title: string;
  description: string;
}

interface QuestionManagerProps {
  quizId: string;
  quizTitle?: string;
  onClose?: () => void;
  onBack?: () => void;
  isAdmin?: boolean;
}

export function QuestionManager({ quizId, quizTitle, onClose, onBack, isAdmin = false }: QuestionManagerProps) {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateQuestionDialogOpen, setIsCreateQuestionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    points: 0,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching questions for quiz:', quizId);
      
      // First, verify we can access this quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id, teacher_id')
        .eq('id', quizId)
        .single();

      if (quizError) {
        console.error('❌ Quiz verification error:', quizError);
        throw quizError;
      }

      console.log('Quiz data:', quizData);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user ID:', user?.id);
      console.log('Quiz teacher_id:', quizData.teacher_id);

      if (!user || quizData.teacher_id !== user.id) {
        throw new Error('Access denied: You can only view questions for your own quizzes');
      }

      // Now fetch questions with a direct query (no RLS for this specific case)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Questions fetch error:', error);
        throw error;
      }

      console.log('📝 Raw questions data:', data);
      console.log('📝 Questions count:', data?.length || 0);
      
      // Transform data to match our interface
      const transformedQuestions = (data || []).map((q: any) => ({
        ...q,
        options: q.options || {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d
        }
      }));

      console.log('📝 Transformed questions:', transformedQuestions);
      setQuestions(transformedQuestions);
    } catch (error: any) {
      console.error('❌ Fetch questions error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionForm({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: '',
      points: 0,
      difficulty: 'medium',
    });
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion) return;
    
    try {
      console.log('✏️ Updating question:', currentQuestion.id, questionForm);
      
      // Build the new 'options' JSON object from the form state
      const optionsObject = {
        'A': questionForm.option_a,
        'B': questionForm.option_b,
        'C': questionForm.option_c,
        'D': questionForm.option_d,
      };

      const query = isAdmin
        ? supabase.rpc('update_question_admin', {
            p_question_id: currentQuestion.id,
            p_question_text: questionForm.question_text,
            p_options: optionsObject,
            p_correct_answer: questionForm.correct_answer,
            p_explanation: questionForm.explanation,
            p_points: questionForm.points,
            p_difficulty: questionForm.difficulty,
            p_media_url: currentQuestion.media_url, // media_url is not editable in this form, so pass the existing one
          })
        : supabase
            .from('questions')
            .update({
              question_text: questionForm.question_text,
              options: optionsObject,
              correct_answer: questionForm.correct_answer,
              explanation: questionForm.explanation,
              points: questionForm.points,
              difficulty: questionForm.difficulty,
            })
            .eq('id', currentQuestion.id)
            .select()
            .single();

      const { data, error } = await query;
 
      if (error) throw error;
      
      console.log('✅ Question updated successfully:', data);
      
      toast({
        title: 'Success',
        description: 'Soal berhasil diperbarui!',
      });
 
      setIsEditDialogOpen(false);
      setCurrentQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      console.error('❌ Update question error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update question',
        variant: 'destructive',
      });
    }
  };
 
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    
    try {
      console.log('🗑️ Deleting question:', questionToDelete.id);
      
      const query = isAdmin
        ? supabase.rpc('delete_question_admin', { p_question_id: questionToDelete.id })
        : supabase.from('questions').delete().eq('id', questionToDelete.id);

      const { error } = await query;
 
      if (error) throw error;
      
      console.log('✅ Question deleted successfully');
      
      toast({
        title: 'Success',
        description: 'Soal berhasil dihapus!',
      });
 
      setIsDeleteConfirmOpen(false);
      setQuestionToDelete(null);
      fetchQuestions();
    } catch (error: any) {
      console.error('❌ Delete question error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete question',
        variant: 'destructive',
      });
    }
  };
 
  const openEditDialog = (question: Question) => {
    setCurrentQuestion(question);
    // Populate form from the 'options' object for consistency
    setQuestionForm({
      question_text: question.question_text,
      option_a: question.options?.A || '',
      option_b: question.options?.B || '',
      option_c: question.options?.C || '',
      option_d: question.options?.D || '',
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      points: question.points,
      difficulty: question.difficulty,
    });
    setIsEditDialogOpen(true);
  };
 
  const openDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setIsDeleteConfirmOpen(true);
  };
 
  const getDifficultyColor = (answer: string, correct: string) => {
    return answer === correct ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50 border-gray-200';
  };

  const renderMedia = (url: string | null) => {
    if (!url) return null;

    // YouTube video
    const youtubeRegex = /(?:https?):\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      return (
        <div className="relative my-2" style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded YouTube video"
            className="absolute top-0 left-0 w-full h-full rounded-md"
          ></iframe>
        </div>
      );
    }

    // Image - using ImageZoom component
    const isImage = /\.(jpeg|jpg|gif|png)$/i.test(url) || url.startsWith('placeholder-');
    if (isImage) {
      return (
        <div className="my-2">
          <ImageZoom
            src={url}
            alt="Question media"
            className="max-w-xs max-h-48 object-contain rounded-md border"
            title="Gambar Soal"
          />
        </div>
      );
    }

    // Audio
    const isAudio = /\.(mp3|wav|ogg)$/i.test(url);
    if (isAudio) {
      return <audio controls src={url} className="w-full my-2">Your browser does not support the audio element.</audio>;
    }

    return null;
  };
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Management</h2>
          <p className="text-muted-foreground">
            Kelola soal untuk quiz: <span className="font-semibold">{quizTitle}</span>
          </p>
        </div>        <div className="flex gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← Back to Quizzes
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          <Dialog open={isCreateQuestionDialogOpen} onOpenChange={setIsCreateQuestionDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateQuestionDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Soal
              </Button>
            </DialogTrigger>
            <CreateQuestionForm
              quizId={quizId}
              isOpen={isCreateQuestionDialogOpen}
              onClose={() => setIsCreateQuestionDialogOpen(false)}
              onQuestionCreated={fetchQuestions}
              isAdmin={isAdmin}
            />
          </Dialog>
          
          <Button variant="outline" onClick={onClose}>
            Kembali ke Quiz
          </Button>
        </div>
      </div>
 
      {loading ? (
        <div className="text-center py-8">Loading questions...</div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada soal</h3>
            <p className="text-muted-foreground mb-4">
              Mulai buat soal pertama untuk quiz ini. Gunakan template yang sudah disediakan!
            </p>
            <Button onClick={() => setIsCreateQuestionDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Soal Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Soal #{index + 1}</Badge>
                    <Badge variant="outline">{question.points} poin</Badge>
                    <Badge variant="outline" className="capitalize">{question.difficulty}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{question.question_text}</h3>
                  
                  {question.media_url && renderMedia(question.media_url)}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.options && Object.keys(question.options).length > 0 && Object.values(question.options).some(v => v) ? (
                      Object.entries(question.options).map(([key, value]) => (
                        <div key={key} className={`p-2 rounded border ${getDifficultyColor(key, question.correct_answer)}`}>
                          <span className="font-medium">{key}. </span>{value}
                          {question.correct_answer === key && <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground italic p-2 bg-gray-50 rounded-md">
                        Pilihan jawaban tidak tersedia untuk soal ini. Silakan klik tombol 'Edit' untuk menambahkan pilihan jawaban.
                      </div>
                    )}
                  </div>
                  
                  {question.explanation && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <span className="font-medium text-blue-900">Penjelasan: </span>
                      <span className="text-blue-800">{question.explanation}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(question)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(question)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
 
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Soal</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditQuestion} className="space-y-4">
            <div>
              <Label htmlFor="edit_question_text">Pertanyaan *</Label>
              <Textarea
                id="edit_question_text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Tulis pertanyaan di sini..."
                required
                rows={3}
              />
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_option_a">Pilihan A *</Label>
                <Input
                  id="edit_option_a"
                  value={questionForm.option_a}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                  placeholder="Pilihan A"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_option_b">Pilihan B *</Label>
                <Input
                  id="edit_option_b"
                  value={questionForm.option_b}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                  placeholder="Pilihan B"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_option_c">Pilihan C *</Label>
                <Input
                  id="edit_option_c"
                  value={questionForm.option_c}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                  placeholder="Pilihan C"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_option_d">Pilihan D *</Label>
                <Input
                  id="edit_option_d"
                  value={questionForm.option_d}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                  placeholder="Pilihan D"
                  required
                />
              </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_correct_answer">Jawaban Benar *</Label>
                <Select value={questionForm.correct_answer} onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setQuestionForm({ ...questionForm, correct_answer: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jawaban benar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_points">Poin</Label>
                <Input
                  id="edit_points"
                  type="number"
                  min="1"
                  max="100"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>
 
            <div>
              <Label htmlFor="edit_explanation">Penjelasan (Opsional)</Label>
              <Textarea
                id="edit_explanation"
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Jelaskan mengapa jawaban ini benar..."
                rows={2}
              />
            </div>
 
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
