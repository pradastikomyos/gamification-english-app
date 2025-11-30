import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

// Custom CSS for intro.js styling
const addTourStyles = () => {
  if (document.getElementById('tour-styles')) return;

  const style = document.createElement('style');
  style.id = 'tour-styles';
  style.textContent = `
    /* --- TOTAL MAKEOVER --- */
    .introjs-tooltip {
      font-family: 'Poppins', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif !important;
      border-radius: 12px !important;
      background-color: #FFFFFF !important;
      color: #2D3748 !important; /* Dark Gray */
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      border: 1px solid #E2E8F0 !important; /* Light Gray Border */
      max-width: 380px !important;
      min-width: 340px !important;
      padding: 0 !important;
      overflow: hidden !important;
      z-index: 99999999 !important;
    }

    .introjs-tooltip-header {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 16px 20px !important;
      background-color: #F7FAFC !important; /* Lighter Gray Background */
      border-bottom: 1px solid #E2E8F0 !important;
    }

    .introjs-tooltip-title {
      font-size: 18px !important;
      font-weight: 600 !important;
      margin: 0 !important;
      color: #1A202C !important; /* Almost Black */
    }

    .introjs-skipbutton {
      font-size: 13px !important;
      font-weight: 500 !important;
      color: #718096 !important; /* Medium Gray */
      background: transparent !important;
      border: none !important;
      padding: 4px 8px !important;
      border-radius: 6px !important;
      transition: background-color 0.2s ease, color 0.2s ease !important;
    }

    .introjs-skipbutton:hover {
      background-color: #EDF2F7 !important; /* Light Gray Hover */
      color: #2D3748 !important;
    }

    .introjs-tooltiptext {
      padding: 20px !important;
      font-size: 15px !important;
      line-height: 1.7 !important;
      color: #4A5568 !important; /* Darker Medium Gray */
      font-weight: 400 !important;
    }

    .introjs-progress {
      background-color: #E2E8F0 !important;
      height: 4px !important;
      border-radius: 0 !important;
      margin: 0 !important;
    }

    .introjs-progressbar {
      background-color: #48BB78 !important; /* Green */
    }

    .introjs-tooltipbuttons {
      display: flex !important;
      justify-content: flex-end !important;
      align-items: center !important;
      padding: 12px 20px !important;
      border-top: 1px solid #E2E8F0 !important;
      background-color: #F7FAFC !important;
      gap: 8px !important;
    }

    .introjs-button {
      text-decoration: none !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      padding: 9px 18px !important;
      transition: all 0.25s ease !important;
      border: 1px solid transparent !important;
      cursor: pointer !important;
      font-size: 14px !important;
      text-shadow: none !important;
    }

    .introjs-prevbutton {
      background-color: #FFFFFF !important;
      color: #4A5568 !important;
      border-color: #CBD5E0 !important; /* Gray Border */
    }

    .introjs-prevbutton:hover {
      background-color: #F7FAFC !important;
      border-color: #A0AEC0 !important;
    }

    .introjs-nextbutton, .introjs-donebutton {
      background-color: #4299E1 !important; /* Blue */
      color: white !important;
      border-color: #4299E1 !important;
    }

    .introjs-nextbutton:hover, .introjs-donebutton:hover {
      background-color: #3182CE !important; /* Darker Blue */
      box-shadow: 0 4px 12px -2px rgba(66, 153, 225, 0.4) !important;
      transform: translateY(-1px) !important;
    }

    .introjs-disabled, .introjs-disabled:hover {
      background-color: #CBD5E0 !important;
      color: #A0AEC0 !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }

    .introjs-arrow.top, .introjs-arrow.top-middle, .introjs-arrow.top-right {
      border-bottom-color: #FFFFFF !important;
    }
    .introjs-arrow.bottom, .introjs-arrow.bottom-middle, .introjs-arrow.bottom-right {
      border-top-color: #FFFFFF !important;
    }
    .introjs-arrow.left {
      border-right-color: #FFFFFF !important;
    }
    .introjs-arrow.right {
      border-left-color: #FFFFFF !important;
    }
  `;
  document.head.appendChild(style);
};

interface TourStep {
  element: string;
  intro: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const studentTourSteps: TourStep[] = [
  {
    element: 'body',
    title: 'Selamat datang di Web Gamifikasi Anna 曼达廷! 🎓',
    intro: 'Halo! Mari kita kenalan dengan dashboard kamu. Tour ini akan memandu kamu mengenal semua fitur yang tersedia untuk meningkatkan kemampuan bahasa Inggris kamu.',
    position: 'bottom'
  },
  {
    element: '[data-tour="total-points"]',
    title: 'Total Poin Kamu ⭐',
    intro: 'Ini adalah total poin yang sudah kamu kumpulin dari semua quiz yang udah dikerjakan. Semakin banyak quiz yang kamu selesaikan dengan benar, semakin banyak poin yang kamu dapat!',
    position: 'bottom'
  },
  {
    element: '[data-tour="current-level"]',
    title: 'Level Progression 🏆',
    intro: 'Level kamu saat ini! Setiap 100 poin, kamu akan naik ke level berikutnya. Keep grinding untuk mencapai level yang lebih tinggi!',
    position: 'bottom'
  },
  {
    element: '[data-tour="streak-days"]',
    title: 'Streak Days 🔥',
    intro: 'Ini adalah jumlah hari berturut-turut kamu belajar dan mengerjakan quiz. Streak yang konsisten akan membantu kamu belajar lebih efektif!',
    position: 'bottom'
  },
  {
    element: '[data-tour="class-rank"]',
    title: 'Ranking di Kelas 📊',
    intro: 'Posisi ranking kamu di dalam kelas. Ini menunjukkan seberapa baik performa kamu dibanding teman-teman sekelas. Jangan sampai turun ya!',
    position: 'bottom'
  },
  {
    element: '[data-tour="level-progress"]',
    title: 'Progress Bar Level 📈',
    intro: 'Progress bar ini menunjukkan seberapa dekat kamu dengan level berikutnya. Kerjakan lebih banyak quiz untuk mengisi bar ini sampai penuh!',
    position: 'top'
  },
  {
    element: '[data-tour="assigned-quizzes"]',
    title: 'Quiz yang Di-assign Teacher 📝',
    intro: 'Di sini kamu bisa lihat semua quiz yang di-assign sama teacher kamu. Quiz ini wajib dikerjakan dan biasanya ada deadline-nya!',
    position: 'top'
  },
  {
    element: '[data-tour="sidebar-results"]',
    title: 'Hasil Quiz Kamu 📊',
    intro: 'Klik menu ini untuk melihat semua hasil quiz yang udah kamu kerjakan. Kamu bisa review jawaban dan lihat mana yang salah atau benar.',
    position: 'right'
  },
  {
    element: '[data-tour="sidebar-leaderboard"]',
    title: 'Leaderboard 🏅',
    intro: 'Di sini kamu bisa lihat ranking semua siswa di aplikasi. Siapa tau kamu bisa masuk top 10!',
    position: 'right'
  },
  {
    element: '[data-tour="sidebar-materials"]',
    title: 'Study Materials 📚',
    intro: 'Materi belajar mandiri yang disediakan teacher. Kamu bisa belajar dari video, PDF, audio, dan materi lainnya untuk persiapan quiz.',
    position: 'right'
  },
  {
    element: '[data-tour="sidebar-achievements"]',
    title: 'Achievements 🏆',
    intro: 'Collection achievement yang udah kamu raih! Setiap pencapaian khusus akan dapat badge yang keren.',
    position: 'right'
  },
  {
    element: '[data-tour="sidebar-profile"]',
    title: 'Profile Management 👤',
    intro: 'Di menu ini kamu bisa edit profile kamu, ganti password, dan atur preferensi lainnya.',
    position: 'right'
  }
];

export const useStudentTour = () => {
  const { user, role } = useAuth();

  console.log('🎯 useStudentTour hook initialized', { user: user?.id, role });

  // Check if user is a student and hasn't seen the tour
  const checkUserRole = useCallback(() => {
    const isStudent = role === 'student';
    console.log('👤 Check user role:', { role, isStudent });
    return isStudent;
  }, [role]);

  // Check if it's student's first time or tour not completed
  const isFirstTimeStudent = useCallback(() => {
    const tourCompleted = localStorage.getItem('studentTourCompleted');
    const userSpecificTour = localStorage.getItem(`studentTour_${user?.id}`);
    const isFirstTime = !tourCompleted && !userSpecificTour;
    console.log('🔍 Check first time student:', { 
      tourCompleted, 
      userSpecificTour, 
      isFirstTime,
      userId: user?.id 
    });
    return isFirstTime;
  }, [user?.id]);

  // Store tour completion
  const markTourCompleted = useCallback(() => {
    console.log('✅ Marking tour as completed');
    localStorage.setItem('studentTourCompleted', 'true');
    if (user?.id) {
      localStorage.setItem(`studentTour_${user.id}`, 'true');
    }
  }, [user?.id]);

  // Initialize and start the tour
  const startTour = useCallback(() => {
    // Add custom styles
    addTourStyles();

    // Configure intro.js
    const intro = introJs();
    
    // Wait for elements to be available
    const checkElements = () => {
      const allElementsExist = studentTourSteps.every(step => {
        if (step.element === 'body') return true;
        return document.querySelector(step.element) !== null;
      });
      
      if (allElementsExist) {
        // Set up steps with proper data attributes
        intro.setOptions({
          steps: studentTourSteps.map(step => ({
            element: step.element,
            intro: `
              <div class="introjs-tooltip-header">
                <h3 class="introjs-tooltip-title">${step.title || ''}</h3>
              </div>
              <div class="introjs-tooltip-content">
                ${step.intro}
              </div>
            `,
            position: step.position || 'bottom'
          })),
          showProgress: true,
          showBullets: false,
          exitOnEsc: true,
          exitOnOverlayClick: false,
          disableInteraction: false,
          nextLabel: '<strong>Lanjut →</strong>',
          prevLabel: '<strong>← Kembali</strong>',
          skipLabel: '<strong>Skip Tour</strong>',
          doneLabel: '<strong>Selesai! 🎉</strong>'
        });

        // Event handlers
        intro.onbeforechange(function(targetElement) {
          // Scroll element into view if needed
          if (targetElement && targetElement !== document.body) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
          }
          return true; // Allow the step to proceed
        });

        intro.oncomplete(function() {
          markTourCompleted();
          console.log('Student tour completed!');
        });

        intro.onexit(function() {
          markTourCompleted();
          console.log('Student tour exited');
        });

        // Start the tour
        intro.start();
      } else {
        // Retry after a short delay if elements aren't ready
        setTimeout(checkElements, 500);
      }
    };

    // Initial check with a small delay to ensure DOM is ready
    setTimeout(checkElements, 100);
  }, [markTourCompleted]);

  // Main function to trigger tour if conditions are met
  const initializeTour = useCallback(() => {
    if (checkUserRole() && isFirstTimeStudent()) {
      // Add a delay to ensure the dashboard is fully rendered
      setTimeout(() => {
        startTour();
      }, 1000);
    }
  }, [checkUserRole, isFirstTimeStudent, startTour]);

  // Function to manually start tour (for testing or re-showing)
  const restartTour = useCallback(() => {
    console.log('🎯 Manual tour restart triggered');
    console.log('Current user role:', role);
    console.log('User ID:', user?.id);
    
    // Check if we're on the right page for tour
    const currentPath = window.location.pathname;
    const isOnStudentPortal = currentPath.includes('/student');
    
    console.log('Current path:', currentPath);
    console.log('Is on student portal:', isOnStudentPortal);
    
    if (!isOnStudentPortal) {
      alert('Tour hanya bisa dimulai dari Student Portal. Redirecting...');
      window.location.href = '/student';
      return;
    }
    
    // Force start tour regardless of completion status
    addTourStyles();
    
    const intro = introJs();
    
    // Check if we're on dashboard page and elements exist
    const checkElements = () => {
      // Check if we need to navigate to dashboard first
      const isDashboardActive = document.querySelector('[data-tour="total-points"]') !== null;
      
      if (!isDashboardActive) {
        console.log('📍 Not on dashboard, trying to navigate...');
        
        // Try to find and click dashboard navigation
        const dashboardButton = document.querySelector('button[aria-label="Dashboard"], button:contains("Dashboard"), [data-testid="dashboard-nav"]');
        if (dashboardButton) {
          console.log('🔄 Clicking dashboard navigation...');
          (dashboardButton as HTMLElement).click();
          setTimeout(checkElements, 1000);
          return;
        }
        
        // If no navigation found, show message
        alert('Untuk memulai tour, silakan klik menu "Dashboard" terlebih dahulu, lalu coba lagi.');
        return;
      }
      
      const requiredElements = [
        '[data-tour="total-points"]',
        '[data-tour="current-level"]', 
        '[data-tour="streak-days"]',
        '[data-tour="class-rank"]'
      ];
      
      const elementsFound = requiredElements.map(selector => {
        const element = document.querySelector(selector);
        console.log(`Element ${selector}:`, element ? 'Found ✅' : 'Missing ❌');
        return element;
      });
      
      const hasBasicElements = elementsFound.filter(Boolean).length >= 2;
      
      if (hasBasicElements) {
        console.log('✅ Starting tour with available elements');
        
        // Filter steps to only include existing elements
        const availableSteps = studentTourSteps.filter(step => {
          if (step.element === 'body') return true;
          return document.querySelector(step.element) !== null;
        });
        
        console.log(`Found ${availableSteps.length} available tour steps`);
        
        intro.setOptions({
          steps: availableSteps.map(step => ({
            element: step.element,
            intro: `
              <div class="introjs-tooltip-header">
                <h3 class="introjs-tooltip-title">${step.title || ''}</h3>
              </div>
              <div class="introjs-tooltip-content">
                ${step.intro}
              </div>
            `,
            position: step.position || 'bottom'
          })),
          showProgress: true,
          showBullets: false,
          exitOnEsc: true,
          exitOnOverlayClick: false,
          disableInteraction: false,
          nextLabel: 'Lanjut →',
          prevLabel: '← Kembali', 
          skipLabel: 'Skip Tour',
          doneLabel: 'Selesai! 🎉'
        });

        intro.onbeforechange(function(targetElement) {
          if (targetElement && targetElement !== document.body) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
          }
          return true;
        });

        intro.oncomplete(function() {
          console.log('Tour completed');
        });

        intro.onexit(function() {
          console.log('Tour exited');
        });

        try {
          intro.start();
          console.log('✅ Tour started successfully');
        } catch (error) {
          console.error('❌ Error starting tour:', error);
        }
      } else {
        console.log('❌ Not enough elements found, retrying...');
        setTimeout(checkElements, 500);
      }
    };

    setTimeout(checkElements, 100);
  }, [role, user?.id]);

  // Function to reset tour status (for testing)
  const resetTourStatus = useCallback(() => {
    console.log('🔄 Resetting tour status');
    localStorage.removeItem('studentTourCompleted');
    if (user?.id) {
      localStorage.removeItem(`studentTour_${user.id}`);
    }
    console.log('✅ Tour status reset complete');
  }, [user?.id]);

  return {
    initializeTour,
    restartTour,
    resetTourStatus,
    isFirstTimeStudent: isFirstTimeStudent(),
    isStudent: checkUserRole()
  };
};
