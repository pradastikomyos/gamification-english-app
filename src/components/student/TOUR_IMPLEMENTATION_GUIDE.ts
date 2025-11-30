/**
 * STUDENT TOUR IMPLEMENTATION GUIDE
 * 
 * This implementation provides a comprehensive onboarding tour for student users only.
 * 
 * ## Key Features:
 * 1. ✅ Role Detection - Only shows for students
 * 2. ✅ First-time Detection - Only shows for new users
 * 3. ✅ Beautiful Design - Custom styled tooltips with gradients
 * 4. ✅ Indonesian Language - All text in Bahasa Indonesia
 * 5. ✅ Data Persistence - Uses localStorage to track completion
 * 6. ✅ Manual Controls - Tour can be restarted anytime
 * 7. ✅ Responsive Design - Works on mobile and desktop
 * 8. ✅ Smooth Animations - Custom CSS animations and transitions
 * 
 * ## Tour Steps:
 * 1. Welcome message
 * 2. Total Points explanation
 * 3. Level progression
 * 4. Streak tracking
 * 5. Class ranking
 * 6. Progress bar explanation
 * 7. Assigned quizzes
 * 8. Quiz results menu
 * 9. Leaderboard menu
 * 10. Study materials menu
 * 11. Achievements menu
 * 12. Profile management menu
 * 
 * ## How it works:
 * 
 * ### 1. Role Detection
 * The `useStudentTour` hook checks if the current user has role === 'student'
 * 
 * ### 2. First-time Detection
 * Uses localStorage with two keys:
 * - `studentTourCompleted`: Global completion flag
 * - `studentTour_${userId}`: User-specific completion flag
 * 
 * ### 3. Auto-initialization
 * Tour automatically starts when:
 * - User is a student
 * - User hasn't completed tour before
 * - Dashboard data is loaded
 * 
 * ### 4. Manual Controls
 * - TourControl component in top-right corner
 * - Help icon to restart tour
 * - Dev reset button (only in development)
 * 
 * ## Testing:
 * 
 * ### Reset Tour Status (for testing):
 * ```javascript
 * localStorage.removeItem('studentTourCompleted');
 * localStorage.removeItem('studentTour_' + userId);
 * ```
 * 
 * ### Manually Start Tour:
 * ```javascript
 * import { useStudentTour } from '@/hooks/useStudentTour';
 * const { restartTour } = useStudentTour();
 * restartTour();
 * ```
 * 
 * ## Environment Setup:
 * 
 * ### Dependencies Added:
 * - intro.js
 * - @types/intro.js
 * 
 * ### Files Created/Modified:
 * - src/hooks/useStudentTour.tsx (NEW)
 * - src/components/student/TourControl.tsx (NEW)
 * - src/components/student/FirstTimeWelcome.tsx (NEW)
 * - src/components/student/StudentDashboard.tsx (MODIFIED - added data-tour attributes)
 * - src/components/student/StudentSidebar.tsx (MODIFIED - added data-tour attributes)
 * - src/components/student/StudentLayout.tsx (MODIFIED - added TourControl)
 * - src/pages/StudentPortal.tsx (MODIFIED - added FirstTimeWelcome)
 * 
 * ## Data Tour Attributes Used:
 * - data-tour="total-points"
 * - data-tour="current-level"
 * - data-tour="streak-days" 
 * - data-tour="class-rank"
 * - data-tour="level-progress"
 * - data-tour="assigned-quizzes"
 * - data-tour="sidebar-results"
 * - data-tour="sidebar-leaderboard"
 * - data-tour="sidebar-materials"
 * - data-tour="sidebar-achievements"
 * - data-tour="sidebar-profile"
 * 
 * ## Custom Styling:
 * The tour uses custom CSS with:
 * - Purple gradient backgrounds
 * - Smooth animations
 * - Anti-aliased fonts for crisp text
 * - Responsive design
 * - Beautiful shadows and borders
 * 
 * ## Multi-role Safety:
 * - Tour only initializes for students
 * - Other roles (admin, teacher) are ignored
 * - Role detection happens in real-time
 * 
 * ## Browser Support:
 * - Modern browsers with ES6+ support
 * - localStorage support required
 * - CSS backdrop-filter support (graceful fallback)
 */

// Console utilities for testing
export const TourTestUtils = {
  // Reset tour for current user
  resetTour: (userId?: string) => {
    localStorage.removeItem('studentTourCompleted');
    if (userId) {
      localStorage.removeItem(`studentTour_${userId}`);
    }
    console.log('✅ Tour status reset');
  },

  // Check tour status
  checkTourStatus: (userId?: string) => {
    const global = localStorage.getItem('studentTourCompleted');
    const userSpecific = userId ? localStorage.getItem(`studentTour_${userId}`) : null;
    
    console.log('📊 Tour Status:', {
      globalCompleted: !!global,
      userCompleted: !!userSpecific,
      shouldShow: !global && !userSpecific
    });
    
    return {
      globalCompleted: !!global,
      userCompleted: !!userSpecific,
      shouldShow: !global && !userSpecific
    };
  },

  // List all tour elements
  checkTourElements: () => {
    const elements = [
      'total-points',
      'current-level', 
      'streak-days',
      'class-rank',
      'level-progress',
      'assigned-quizzes',
      'sidebar-results',
      'sidebar-leaderboard',
      'sidebar-materials',
      'sidebar-achievements',
      'sidebar-profile'
    ];

    console.log('🔍 Tour Elements Status:');
    elements.forEach(attr => {
      const element = document.querySelector(`[data-tour="${attr}"]`);
      console.log(`  ${attr}: ${element ? '✅ Found' : '❌ Missing'}`);
    });
  }
};

// Make available in browser console during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).TourTestUtils = TourTestUtils;
  console.log('🛠️ Tour Test Utils available as window.TourTestUtils');
}
