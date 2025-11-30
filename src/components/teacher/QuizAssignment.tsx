import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Send, Users, Clock, Award, Target, CheckCircle, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { QuizFileUploadDialog } from './QuizFileUploadDialog';

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  points_per_question: number;
  questionCount?: number;
  status: 'open' | 'closed';
  created_by: string; // Add created_by to Quiz interface
}

interface Class {
  id: string;
  name: string;
  student_count?: number;
}

interface Assignment {
  id: string;
  quiz_id: string;
  class_id: string;
  assigned_at: string;
  due_date?: string;
  quiz: Quiz;
  class: Class;
}

export function QuizAssignment() {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [dueDays, setDueDays] = useState<string>('7');
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [quizToChangeStatus, setQuizToChangeStatus] = useState<Quiz | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  useEffect(() => {
    if (profileId) {
      fetchData();
    }
  }, [profileId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchQuizzes(), fetchClasses(), fetchAssignments()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, questions(count), class_quizzes(count)') // Select status and count of assignments
      .eq('created_by', profileId);

    if (error) throw error;

    const quizzesWithCounts = (data || []).map((quiz: any) => ({
      ...quiz,
      questionCount: quiz.questions?.[0]?.count || 0,
      status: quiz.status || 'open', // Default to 'open' if not set
    }));

    setQuizzes(quizzesWithCounts);
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        students:students(count)
      `)
      .eq('teacher_id', profileId);

    if (error) throw error;

    const classesWithCounts = (data || []).map(cls => ({
      ...cls,
      student_count: cls.students?.[0]?.count || 0
    }));

    setClasses(classesWithCounts);
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('class_quizzes')
      .select(`
        *,
        quiz:quizzes(*),
        class:classes(id, name)
      `)
      .eq('quiz.created_by', profileId); // Re-add server-side filter

    if (error) throw error;
    setAssignments(data as Assignment[] || []);
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    const { error } = await supabase
      .from('class_quizzes')
      .delete()
      .eq('id', assignmentToDelete.id);

    if (error) {
      toast({
        title: 'Error Deleting Assignment',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Assignment Deleted',
        description: `The assignment for "${assignmentToDelete.quiz.title}" has been deleted.`,
      });
      setAssignments(assignments.filter(a => a.id !== assignmentToDelete.id));
    }

    setIsDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  const handleAssignQuiz = async () => {
    if (!selectedQuiz || selectedClasses.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a quiz and at least one class',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(dueDays));

      const newAssignments = [];
      const alreadyAssignedClasses: string[] = [];

      for (const classId of selectedClasses) {
        // Check if assignment already exists
        const { data: existingAssignment, error: checkError } = await supabase
          .from('class_quizzes')
          .select('id')
          .eq('quiz_id', selectedQuiz.id)
          .eq('class_id', classId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw checkError;
        }

        if (existingAssignment) {
          alreadyAssignedClasses.push(classes.find(c => c.id === classId)?.name || 'Unknown Class');
        } else {
          newAssignments.push({
            quiz_id: selectedQuiz.id,
            class_id: classId,
            due_date: dueDate.toISOString(),
            assigned_at: new Date().toISOString(),
          });
        }
      }

      if (alreadyAssignedClasses.length > 0) {
        toast({
          title: 'Info',
          description: `Quiz already assigned to: ${alreadyAssignedClasses.join(', ')}`,
          variant: 'default',
        });
      }

      if (newAssignments.length > 0) {
        console.log('Attempting to insert new assignments:', newAssignments);

        const { error: insertError } = await supabase
          .from('class_quizzes')
          .insert(newAssignments);

        if (insertError) {
          console.error('Supabase insert error:', insertError);
          throw insertError;
        }

        toast({
          title: '🎯 Quiz Assigned Successfully!',
          description: `"${selectedQuiz.title}" has been assigned to ${newAssignments.length} new class(es)`,
        });
      } else if (alreadyAssignedClasses.length > 0) {
        // If all selected classes were already assigned, still show a success-like message
        toast({
          title: 'No New Assignments',
          description: 'All selected classes were already assigned.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'No Classes Selected',
          description: 'Please select at least one class to assign the quiz.',
          variant: 'destructive',
        });
      }

      setIsAssignDialogOpen(false);
      setSelectedQuiz(null);
      setSelectedClasses([]);
      fetchAssignments();
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign quiz',
        variant: 'destructive',
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getAssignmentStatus = (assignment: Assignment): 'active' | 'expired' | 'completed' => {
    if (!assignment.due_date) return 'active';
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    
    if (now > dueDate) return 'expired';
    return 'active';
  };

  const getStatusColor = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment);
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQuizStatusColor = (status: 'open' | 'closed') => {
    return status === 'open' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  };

  const handleChangeQuizStatus = async (quizId: string, newStatus: 'open' | 'closed') => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ status: newStatus })
        .eq('id', quizId);

      if (error) throw error;

      // Update local state immediately
      setQuizzes(prevQuizzes => 
        prevQuizzes.map(quiz => 
          quiz.id === quizId ? { ...quiz, status: newStatus } : quiz
        )
      );
      
      setAssignments(prevAssignments =>
        prevAssignments.map(assignment =>
          assignment.quiz.id === quizId 
            ? { ...assignment, quiz: { ...assignment.quiz, status: newStatus } }
            : assignment
        )
      );

      toast({
        title: 'Quiz Status Updated',
        description: `Quiz status changed to "${newStatus}"`,
      });
      setIsStatusChangeDialogOpen(false);
      setQuizToChangeStatus(null);
      
      // Refresh data to ensure consistency
      await Promise.all([fetchQuizzes(), fetchAssignments()]);
    } catch (error: any) {
      console.error('Error updating quiz status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quiz status',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading quiz assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Assignment</h1>
          <p className="text-gray-600">Assign quizzes to your classes</p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Assign Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Quiz to Classes</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Select Quiz */}
              <div>
                <label className="text-sm font-medium">Select Quiz</label>
                <Select
                  value={selectedQuiz?.id || ''}
                  onValueChange={(value) => {
                    const quiz = quizzes.find(q => q.id === value);
                    setSelectedQuiz(quiz || null);
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a quiz to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.filter(q => q.questionCount > 0).map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{quiz.title}</span>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge className={getDifficultyColor(quiz.difficulty)}>
                              {quiz.difficulty}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {quiz.questionCount} questions
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Classes */}
              <div>
                <label className="text-sm font-medium">Select Classes</label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={cls.id}
                        checked={selectedClasses.includes(cls.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedClasses([...selectedClasses, cls.id]);
                          } else {
                            setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                          }
                        }}
                      />
                      <label htmlFor={cls.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span>{cls.name}</span>
                          <span className="text-xs text-gray-500">
                            {cls.student_count} students
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Select value={dueDays} onValueChange={setDueDays}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day from now</SelectItem>
                    <SelectItem value="3">3 days from now</SelectItem>
                    <SelectItem value="7">1 week from now</SelectItem>
                    <SelectItem value="14">2 weeks from now</SelectItem>
                    <SelectItem value="30">1 month from now</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignQuiz}>
                  Assign Quiz
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Assignments */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Current Assignments</h2>
        {assignments.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-600 mb-4">Start by assigning your first quiz to a class!</p>
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Assign Quiz
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{assignment.quiz.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Assigned to: {assignment.class.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(assignment)}>
                        {getAssignmentStatus(assignment) === 'active' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {getAssignmentStatus(assignment) === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {getAssignmentStatus(assignment) === 'expired' && <XCircle className="h-3 w-3 mr-1" />}
                        {getAssignmentStatus(assignment)}
                      </Badge>
                      <Dialog open={isStatusChangeDialogOpen && quizToChangeStatus?.id === assignment.quiz.id} onOpenChange={setIsStatusChangeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuizToChangeStatus(assignment.quiz)}
                          >
                            <Badge className={getQuizStatusColor(assignment.quiz.status)}>
                              {assignment.quiz.status}
                            </Badge>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xs">
                          <DialogHeader>
                            <DialogTitle>Change Quiz Status</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Select
                              value={quizToChangeStatus?.status || 'open'}
                              onValueChange={(value: 'open' | 'closed') => {
                                if (quizToChangeStatus) {
                                  handleChangeQuizStatus(quizToChangeStatus.id, value);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isDeleteDialogOpen && assignmentToDelete?.id === assignment.id} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setAssignmentToDelete(assignment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xs">
                          <DialogHeader>
                            <DialogTitle>Delete Assignment?</DialogTitle>
                            <CardDescription>
                              Are you sure you want to delete the assignment "{assignment.quiz.title}" for class "{assignment.class.name}"? This action cannot be undone.
                            </CardDescription>
                          </DialogHeader>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteAssignment}>Delete</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-end text-sm">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(assignment.quiz.time_limit)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          <span>{assignment.quiz.points_per_question}pts</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Assigned:</span>
                        <span>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                      </div>
                      {assignment.due_date && (
                        <div className="flex justify-between">
                          <span>Due:</span>
                          <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
