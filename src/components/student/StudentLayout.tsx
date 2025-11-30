
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { TourControl } from './TourControl';
import { cn } from '@/lib/utils';
import StudentSidebar from './StudentSidebar';

interface StudentLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isTakingQuiz: boolean;
}

export function StudentLayout({ children, currentPage, onPageChange, sidebarOpen, setSidebarOpen, isTakingQuiz }: StudentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <StudentSidebar activeTab={currentPage} setActiveTab={onPageChange} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-surface-raised/80 backdrop-blur-sm shadow-clay-sm border-b border-border-light">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-text-secondary hover:text-text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <TourControl 
                variant="icon" 
                onNavigateToDashboard={() => onPageChange('dashboard')}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 flex-1">
          <div className="clay-card p-6 min-h-[calc(100vh-12rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
