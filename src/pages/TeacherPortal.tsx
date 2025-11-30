import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard';
import QuizManagement from '@/components/teacher/QuizManagement';
import { QuizAssignment } from '@/components/teacher/QuizAssignment';
import Reports from '@/components/teacher/Reports';
import MaterialManagement from '@/components/teacher/MaterialManagement';
import Settings from '@/components/teacher/Settings';
import { StudentList } from '@/components/teacher/StudentList';
import { useIsMobile } from '@/hooks/use-mobile';

export default function TeacherPortal() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false); // Auto-close sidebar on page change in mobile
    }
  }, [currentPage, isMobile]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <TeacherDashboard />;
      case 'students':
        return <StudentList />;
      case 'quizzes':
        return <QuizManagement />;
      case 'assignment':
        return <QuizAssignment />;
      case 'materials':
        return <MaterialManagement />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <TeacherDashboard />;
    }
  };

  return (
    <TeacherLayout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {renderPage()}
    </TeacherLayout>
  );
}
