import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Send,
  BookOpen
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface TeacherLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function TeacherLayout({ children, currentPage, onPageChange, sidebarOpen, setSidebarOpen }: TeacherLayoutProps) {
  const { signOut } = useAuth();
  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { name: 'Students', id: 'students', icon: Users },
    { name: 'Quizzes', id: 'quizzes', icon: FileText },
    { name: 'Materials', id: 'materials', icon: BookOpen },
    { name: 'Assignment', id: 'assignment', icon: Send },
    { name: 'Reports', id: 'reports', icon: BarChart3 },
    { name: 'Settings', id: 'settings', icon: Settings },
  ];

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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center h-20 px-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">Anna 曼达廷</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Teacher Portal</p>
            </div>
          </div>
        </div>

        <nav className="mt-4 px-4 flex flex-col h-[calc(100%-5rem)]">
          <div className="space-y-2 flex-grow">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-purple-100/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="py-4">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-600 dark:text-gray-300"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[calc(100vh-10rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
