console.log('App.tsx loaded');

import { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import AdminPortal from '@/pages/AdminPortal';
import TeacherPortal from '@/pages/TeacherPortal';
import StudentPortal from '@/pages/StudentPortal';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'; // Import routing components
import ForcePasswordChange from '@/pages/ForcePasswordChange';

const queryClient = new QueryClient();

function AppContent() {
  const { user, role, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your account...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we configure your profile.</p>
        </div>
      </div>
    );
  }

  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Setup Taking Too Long</h2>
          <p className="text-gray-600 mb-4">Something seems to be stuck. Let's try refreshing.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // If there's no user, they should see the login form.
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  
  // If the user needs to change their password, lock them into that page.
  if (user.user_metadata?.requires_password_change) {
    return (
      <Routes>
        <Route path="/force-password-change" element={<ForcePasswordChange />} />
        <Route path="*" element={<Navigate to="/force-password-change" replace />} />
      </Routes>
    );
  }

  // If user is logged in and password is fine, route them based on their role.
  return (
    <Routes>
      <Route path="/admin/*" element={role === 'admin' ? <AdminPortal /> : <Navigate to="/" replace />} />
      <Route path="/teacher/*" element={role === 'teacher' ? <TeacherPortal /> : <Navigate to="/" replace />} />
      <Route path="/student/*" element={role === 'student' ? <StudentPortal /> : <Navigate to="/" replace />} />
      <Route path="/student/quiz/:quizId" element={role === 'student' ? <StudentPortal /> : <Navigate to="/" replace />} />
      <Route path="/" element={role ? <Navigate to={`/${role}`} replace /> : <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
