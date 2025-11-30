import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Award, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { name: 'Kelola Pengguna', id: 'user-management', icon: Users },
    { name: 'Kelola Kelas', id: 'class-management', icon: BookOpen },
    { name: 'Analitik', id: 'analytics', icon: BarChart3 },
    { name: 'Pencapaian', id: 'achievements', icon: Award },
    { name: 'Pengaturan', id: 'settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 p-4 flex flex-col h-full shadow-lg">
      <div className="flex items-center h-16 px-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Anna 曼达廷</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Portal Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-grow">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
      </nav>
      <div className="py-4">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
