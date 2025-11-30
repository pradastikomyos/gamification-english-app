import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentTour } from '@/hooks/useStudentTour';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, BookOpen, PlayCircle } from 'lucide-react';

export const FirstTimeWelcome: React.FC = () => {
  const { user, role } = useAuth();
  const { isFirstTimeStudent, restartTour } = useStudentTour();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show welcome message for first-time students
    if (role === 'student' && isFirstTimeStudent) {
      // Small delay to ensure the dashboard is loaded
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [role, isFirstTimeStudent]);

  const handleStartTour = () => {
    setIsVisible(false);
    // Small delay before starting tour to allow welcome card to disappear
    setTimeout(() => {
      restartTour();
    }, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Mark tour as completed when dismissed
    localStorage.setItem('studentTourCompleted', 'true');
    if (user?.id) {
      localStorage.setItem(`studentTour_${user.id}`, 'true');
    }
  };

  if (!isVisible || role !== 'student') {
    return null;
  }

  return (
    <div className="mb-6">
      <Alert className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg text-purple-900 dark:text-purple-100 mb-2">
                  🎉 Selamat datang! Pertama kali di Website Gamifikasi Anna 曼达廷?
                </h4>
                <AlertDescription className="text-purple-700 dark:text-purple-200 mb-4 leading-relaxed">
                  Yuk, kenalan dulu dengan semua fitur dashboard kamu! 
                  Tour interaktif ini akan memandu kamu memahami cara 
                  menggunakan Web Gamifikasi Anna 曼达廷 dengan maksimal.
                </AlertDescription>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleStartTour}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                    size="sm"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Mulai Tour
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDismiss}
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/50"
                  >
                    Nanti aja
                  </Button>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-3 flex items-center">
                  💡 Kamu bisa mengulang tour kapan saja dari ikon bantuan di pojok kanan atas
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-purple-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 -mt-1 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
};
