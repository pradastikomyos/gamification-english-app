import React, { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm flex justify-end items-center h-16 px-6">
        <ThemeToggle />
      </header>
      <main className="p-6 flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
