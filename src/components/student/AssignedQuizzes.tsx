import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
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
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  XCircle,
  BookOpen,
  Target,
  Trophy,
  Timer
} from 'lucide-react';

interface AssignedQuiz {
  assignment_id: string;
  quiz_id: string;
  class_id: string;
  assigned_at: string;
  due_date?: string;
  quiz: {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    time_limit: number;
    points_per_question: number;
    status: 'open' | 'closed';
  };  completion?: {
    id: string;
    score: number;
    completed_at: string;

  };
}

interface AssignedQuizzesProps {
  onStartQuiz: (quizId: string) => void;
  onReviewQuiz: (quizId: string) => void;
}

export function AssignedQuizzes({ onStartQuiz, onReviewQuiz }: AssignedQuizzesProps) {
  const { profileId } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<AssignedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  useEffect(() => {
    if (profileId) {
      fetchAssignedQuizzes();
    }
  }, [profileId]);

  const fetchAssignedQuizzes = async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      // 1. Get student's class_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('class_id')
        .eq('id', profileId)
        .single();

      if (studentError || !studentData?.class_id) {
        setAssignments([]);
        return;
      }
      
      const { class_id: classId } = studentData;

      // 2. Get all quizzes assigned to the student's class
      const { data: classQuizzesData, error: classQuizzesError } = await supabase
        .from('class_quizzes')
        .select('assignment_id:id, quiz_id, class_id, assigned_at, due_date, quiz:quizzes!inner(*)')
        .eq('class_id', classId);

      if (classQuizzesError || !classQuizzesData) {
        setAssignments([]);
        return;
      }

      // 3. Filter for valid assignments where 'quiz' is a single object, not an array or null.
      const validAssignments = classQuizzesData.filter(
        (a) => a.quiz != null && !Array.isArray(a.quiz)
      );

      if (validAssignments.length === 0) {
        setAssignments([]);
        return;
      }

      const assignedQuizIds = validAssignments.map(a => a.quiz_id);

      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, quiz_id, score:final_score, completed_at')
        .eq('student_id', profileId)
        .in('quiz_id', assignedQuizIds);

      if (attemptsError) {
        console.error('Error fetching quiz attempts:', attemptsError);
      }

      // 4. Merge data safely, using a double cast via 'unknown' as recommended by the TS error.
      const mergedAssignments: AssignedQuiz[] = validAssignments.map(assignment => {
        const completion = attemptsData?.find(c => c.quiz_id === assignment.quiz_id);
        
        return {
          assignment_id: assignment.assignment_id,
          quiz_id: assignment.quiz_id,
          class_id: assignment.class_id,
          assigned_at: assignment.assigned_at,
          due_date: assignment.due_date,
          // The filter at step 3 ensures `quiz` is a valid object. The double cast tells TypeScript to trust our runtime check.
          quiz: assignment.quiz as unknown as AssignedQuiz['quiz'],
          completion: completion || undefined,
        };
      });

      setAssignments(mergedAssignments);

    } catch (error: any) {
      console.error('An unexpected error occurred:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatus = (assignment: AssignedQuiz): 'pending' | 'completed' | 'overdue' => {
    if (assignment.completion) return 'completed';
    
    if (assignment.due_date) {
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      if (now > dueDate) return 'overdue';
    }
    
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const getFilteredAssignments = () => {
    switch (filter) {
      case 'pending':
        return assignments.filter(a => getAssignmentStatus(a) === 'pending');
      case 'completed':
        return assignments.filter(a => getAssignmentStatus(a) === 'completed');
      default:
        return assignments;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading assigned quizzes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assigned Quizzes</h2>
          <p className="text-gray-600">Quizzes assigned by your teacher</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({assignments.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({assignments.filter(a => getAssignmentStatus(a) === 'pending').length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({assignments.filter(a => getAssignmentStatus(a) === 'completed').length})
          </Button>
        </div>
      </div>

      {/* Assignments List */}
      {getFilteredAssignments().length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No Assigned Quizzes' : `No ${filter} Quizzes`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Your teacher hasn\'t assigned any quizzes yet.'
              : `You don't have any ${filter} quizzes.`
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {getFilteredAssignments().map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const daysUntilDue = assignment.due_date ? getDaysUntilDue(assignment.due_date) : null;
            
            return (
              <Card key={assignment.assignment_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl">{assignment.quiz.title}</CardTitle>
                        <Badge className={getStatusColor(status)}>
                          {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {status === 'overdue' && <XCircle className="h-3 w-3 mr-1" />}
                          {status}
                        </Badge>
                        {/* Badge status quiz */}
                        <Badge className={assignment.quiz.status === 'closed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {assignment.quiz.status === 'closed' ? 'Closed' : 'Open'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {assignment.quiz.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Time: {formatTime(assignment.quiz.time_limit)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Points: {assignment.quiz.points_per_question} each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">
                        Assigned: {formatDate(assignment.assigned_at)}
                      </span>
                    </div>
                  </div>

                  {assignment.due_date && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Due: {formatDate(assignment.due_date)}
                          {daysUntilDue !== null && (
                            <span className="ml-2">
                              {daysUntilDue > 0 
                                ? `(${daysUntilDue} days left)`
                                : daysUntilDue === 0 
                                ? '(Due today!)'
                                : `(${Math.abs(daysUntilDue)} days overdue)`
                              }
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {assignment.completion ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Completed!</p>                          <p className="text-sm text-green-600">
                            Score: {Math.round(assignment.completion.score)}% • 
                            {formatDate(assignment.completion.completed_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReviewQuiz(assignment.quiz.id)}
                      >
                        Review Results
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {assignment.quiz.status === 'closed' ? (
                          <span className="text-red-600 font-semibold">Quiz Closed</span>
                        ) : (
                          'Ready to start this quiz?'
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!assignment.quiz || !assignment.quiz.id || assignment.quiz.status === 'closed'}
                            onClick={() => {
                              if (!assignment.quiz || !assignment.quiz.id) {
                                console.error("Invalid quiz data for assignment:", assignment);
                                toast({
                                  title: "Error",
                                  description: "Cannot start quiz due to invalid data.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Kerjakan Kuis
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Mulai Kuis</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin mengerjakan kuis ini? Setelah dimulai, Anda harus menyelesaikannya.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onStartQuiz(assignment.quiz.id)}>
                              Kerjakan Kuis
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
