import React from 'react';
import { Button } from '@/components/ui/button';
import { useStudentTour } from '@/hooks/useStudentTour';
import { HelpCircle, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TourControlProps {
  variant?: 'icon' | 'button';
  className?: string;
  onNavigateToDashboard?: () => void; // New prop for navigation
}

export const TourControl: React.FC<TourControlProps> = ({ 
  variant = 'icon', 
  className = '',
  onNavigateToDashboard
}) => {
  const { restartTour, resetTourStatus, isStudent } = useStudentTour();

  console.log('🎮 TourControl rendered:', { variant, isStudent });

  // Only show for students
  if (!isStudent) {
    console.log('❌ User is not a student, hiding tour control');
    return null;
  }

  const handleRestartTour = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚀 Tour restart button clicked');
    
    // Check if we need to navigate to dashboard first
    const isDashboardActive = document.querySelector('[data-tour="total-points"]') !== null;
    
    if (!isDashboardActive && onNavigateToDashboard) {
      console.log('📍 Navigating to dashboard first...');
      onNavigateToDashboard();
      // Wait for navigation and then start tour
      setTimeout(() => {
        restartTour();
      }, 500);
    } else if (!isDashboardActive) {
      alert('Untuk memulai tour, silakan pergi ke halaman Dashboard terlebih dahulu.');
    } else {
      restartTour();
    }
  };

  const handleResetAndRestart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Reset and restart button clicked');
    resetTourStatus();
    setTimeout(() => {
      handleRestartTour(e);
    }, 100);
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <div className={`flex gap-2 ${className}`}>
            <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRestartTour}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mulai Tour Dashboard</p>
            </TooltipContent>
          </Tooltip>
          
          {process.env.NODE_ENV === 'development' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAndRestart}
                  className="text-gray-500 hover:text-blue-600"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset & Restart Tour (Dev)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleRestartTour}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
      >
        <HelpCircle className="h-4 w-4" />
        Mulai Tour
      </Button>
      
      {process.env.NODE_ENV === 'development' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetAndRestart}
          className="flex items-center gap-2 border-purple-200 text-purple-600 hover:bg-purple-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Tour
        </Button>
      )}
    </div>
  );
};
