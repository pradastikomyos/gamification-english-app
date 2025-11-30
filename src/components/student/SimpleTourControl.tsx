import React from 'react';
import { Button } from '@/components/ui/button';
import { useStudentTour } from '@/hooks/useStudentTour';
import { HelpCircle, RotateCcw } from 'lucide-react';

interface SimpleTourControlProps {
  onNavigateToDashboard?: () => void;
}

export const SimpleTourControl: React.FC<SimpleTourControlProps> = ({ 
  onNavigateToDashboard
}) => {
  const { restartTour, resetTourStatus, isStudent } = useStudentTour();

  if (!isStudent) {
    return null;
  }

  const handleStartTour = () => {
    console.log('🚀 Simple tour control clicked');
    
    // Check if we need to navigate to dashboard first
    const isDashboardActive = document.querySelector('[data-tour="total-points"]') !== null;
    
    if (!isDashboardActive && onNavigateToDashboard) {
      console.log('📍 Navigating to dashboard first...');
      onNavigateToDashboard();
      // Wait for navigation and then start tour
      setTimeout(() => {
        restartTour();
      }, 1000);
    } else if (!isDashboardActive) {
      alert('Untuk memulai tour, silakan pergi ke halaman Dashboard terlebih dahulu.');
    } else {
      restartTour();
    }
  };

  const handleResetTour = () => {
    console.log('🔄 Reset tour clicked');
    resetTourStatus();
    alert('Tour status telah direset. Klik "Mulai Tour" untuk memulai lagi.');
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleStartTour}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        Mulai Tour
      </Button>
      
      {process.env.NODE_ENV === 'development' && (
        <Button
          onClick={handleResetTour}
          variant="outline"
          className="border-purple-200 text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-md"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      )}
    </div>
  );
};
