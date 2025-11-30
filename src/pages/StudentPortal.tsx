import { useState, useEffect } from 'react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { AssignedQuizzes } from '@/components/student/AssignedQuizzes';
import { QuizResults } from '@/components/student/QuizResults';
import QuizTaking from '@/components/student/QuizTaking';
import { Leaderboard } from '@/components/student/Leaderboard';
import { StudyMaterials } from '@/components/student/StudyMaterials';
import { MaterialViewer } from '@/components/student/MaterialViewer';
import { Achievements } from '@/components/student/Achievements';
import { Rewards } from '@/components/student/Rewards';
import Profile from '@/components/student/Profile';
import { FirstTimeWelcome } from '@/components/student/FirstTimeWelcome';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuizReview } from '@/components/student/QuizReview';
import { useNavigate, useParams } from 'react-router-dom';

export default function StudentPortal() {
  const { quizId: quizIdParam } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [reviewingQuizId, setReviewingQuizId] = useState<string | null>(null);
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar
  const [quizIdError, setQuizIdError] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }

    if (quizIdParam) {
      if (quizIdParam === 'undefined' || quizIdParam === null || quizIdParam === '') {
        setQuizIdError('Quiz ID tidak valid.');
        setSelectedQuizId(null);
        setTakingQuiz(false);
        navigate('/student/dashboard', { replace: true });
      } else {
        setSelectedQuizId(quizIdParam);
        setTakingQuiz(true);
        setCurrentPage('quizTaking');
        setQuizIdError(null);
      }
    } else {
      if (takingQuiz) {
        setSelectedQuizId(null);
        setTakingQuiz(false);
      }
    }
  }, [isMobile, quizIdParam, navigate, takingQuiz]);

  const handleStartQuiz = (quizId: string) => {
    if (!quizId || quizId === 'undefined') {
      toast({
        title: 'Quiz ID tidak valid',
        description: 'Quiz tidak dapat dimulai karena ID tidak ditemukan.',
        variant: 'destructive',
      });
      return;
    }
    navigate(`/student/quiz/${quizId}`);
  };

  const handleFinishQuiz = () => {
    navigate('/student/assigned');
    setCurrentPage('assigned');
    toast({
      title: "Quiz Submitted!",
      description: "Your answers have been recorded. Check your results in the assigned quizzes list.",
    });
  };

  const handleReviewQuiz = (quizId: string) => {
    setReviewingQuizId(quizId);
  };

  const handleStartMaterial = (materialId: string) => {
    setViewingMaterialId(materialId);
  };

  const handleBackFromMaterial = () => {
    setViewingMaterialId(null);
  };

  const handleBackFromReview = () => {
    setReviewingQuizId(null);
  };

  if (viewingMaterialId) {
    return (
      <StudentLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTakingQuiz={false}
      >
        <MaterialViewer materialId={viewingMaterialId} onBack={handleBackFromMaterial} />
      </StudentLayout>
    );
  }

  if (reviewingQuizId) {
    return (
      <StudentLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTakingQuiz={false}
      >
        <QuizReview quizId={reviewingQuizId} onBack={handleBackFromReview} />
      </StudentLayout>
    );
  }

  if (takingQuiz && selectedQuizId) {
    return (
      <StudentLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTakingQuiz={true}
      >
        <QuizTaking quizId={selectedQuizId} onFinishQuiz={handleFinishQuiz} />
      </StudentLayout>
    );
  }
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <StudentDashboard onStartQuiz={handleStartQuiz} onReviewQuiz={handleReviewQuiz} />;
      case 'assigned':
        return <AssignedQuizzes onStartQuiz={handleStartQuiz} onReviewQuiz={handleReviewQuiz} />;
      case 'quizTaking':
        return <QuizTaking quizId={selectedQuizId!} onFinishQuiz={handleFinishQuiz} />;
      case 'results':
        return <QuizResults />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'materials':
        return <StudyMaterials onStartMaterial={handleStartMaterial} />;
      case 'achievements':
        return <Achievements />;
      case 'rewards':
        return <Rewards 
          onNavigateToLeaderboard={() => setCurrentPage('leaderboard')}
          onNavigateToAchievements={() => setCurrentPage('achievements')}
        />;
      case 'profile':
        return <Profile onNavigateToDashboard={() => setCurrentPage('dashboard')} />;
      default:
        return <StudentDashboard onStartQuiz={handleStartQuiz} onReviewQuiz={handleReviewQuiz} />;
    }
  };

  if (quizIdError) {
    return (
      <StudentLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTakingQuiz={false}
      >
        <div style={{ color: 'red', fontSize: 24, margin: '2rem' }}>Error: {quizIdError}</div>
      </StudentLayout>
    );
  }

  return (
    <>
      <StudentLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTakingQuiz={takingQuiz}
      >
        {renderPage()}
      </StudentLayout>
      <FirstTimeWelcome />
    </>
  );
}
