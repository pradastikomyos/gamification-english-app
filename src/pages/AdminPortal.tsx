import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Target, UserCheck, TrendingUp, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/admin/AdminLayout';
import AdminSidebar from '../components/admin/AdminSidebar';

// Import all page components
import UserManagement from '../components/admin/UserManagement';
import ClassManagement from '../components/admin/ClassManagement';
import Analytics from '../components/admin/Analytics';
import Achievements from '../components/admin/Achievements';
import AdminSettings from '../components/admin/AdminSettings';

const StatCard = ({ icon, title, value, percentage, color, bgColor }) => (
  <div className={`p-6 rounded-2xl shadow-lg flex items-center justify-between ${bgColor}`}>
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <div className="flex items-center text-sm text-green-500 mt-2">
        <TrendingUp size={16} className="mr-1" />
        <span>+{percentage}%</span>
        <span className="text-gray-500 ml-1">dari minggu lalu</span>
      </div>
    </div>
    <div className={`p-4 rounded-full ${color}`}>
      {icon}
    </div>
  </div>
);

const AdminDashboard = ({ stats, setActiveTab }) => (
  <>
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Selamat pagi, Administrator</h2>
        <h1 className="text-4xl font-bold text-purple-600">Website Gamifikasi LaoShi Anna! 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Kelola platform pembelajaran dengan mudah</p>
      </div>
      <div className="flex space-x-4">
        <button onClick={() => setActiveTab('user-management')} className="bg-white dark:bg-gray-700 px-6 py-3 rounded-lg shadow-md flex items-center text-gray-700 dark:text-gray-200 font-semibold">
          <Users size={20} className="mr-2" /> Tambah Pengguna
        </button>
        <button onClick={() => setActiveTab('class-management')} className="bg-white dark:bg-gray-700 px-6 py-3 rounded-lg shadow-md flex items-center text-gray-700 dark:text-gray-200 font-semibold">
          <BookOpen size={20} className="mr-2" /> Buat Kelas
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        icon={<Users size={24} className="text-blue-500" />}
        title="Total Pengguna"
        value={stats.totalUsers}
        percentage="12"
        color="bg-blue-100"
        bgColor="bg-white dark:bg-gray-800"
      />
      <StatCard 
        icon={<BookOpen size={24} className="text-green-500" />}
        title="Total Kelas"
        value={stats.totalClasses}
        percentage="8"
        color="bg-green-100"
        bgColor="bg-white dark:bg-gray-800"
      />
      <StatCard 
        icon={<Target size={24} className="text-purple-500" />}
        title="Total Kuis"
        value={stats.totalQuizzes}
        percentage="15"
        color="bg-purple-100"
        bgColor="bg-white dark:bg-gray-800"
      />
      <StatCard 
        icon={<UserCheck size={24} className="text-orange-500" />}
        title="Guru Aktif"
        value={stats.activeTeachers}
        percentage="5"
        color="bg-orange-100"
        bgColor="bg-white dark:bg-gray-800"
      />
    </div>
  </>
);

const AdminPortal: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalQuizzes: 0,
    activeTeachers: 0,
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchStats = async () => {
      const { data: users, error: usersError } = await supabase.from('user_roles').select('id', { count: 'exact' });
      const { data: classes, error: classesError } = await supabase.from('classes').select('id', { count: 'exact' });
      const { data: quizzes, error: quizzesError } = await supabase.from('quizzes').select('id', { count: 'exact' });
      const { data: teachers, error: teachersError } = await supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'teacher');

      setStats({
        totalUsers: users?.length || 0,
        totalClasses: classes?.length || 0,
        totalQuizzes: quizzes?.length || 0,
        activeTeachers: teachers?.length || 0,
      });
    };

    fetchStats();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard stats={stats} setActiveTab={setActiveTab} />;
      case 'user-management':
        return <UserManagement />;
      case 'class-management':
        return <ClassManagement />;
      case 'analytics':
        return <Analytics />;
      case 'achievements':
        return <Achievements />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <p>Halaman tidak ditemukan.</p>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <AdminLayout>
        {renderContent()}
      </AdminLayout>
    </div>
  );
};

export default AdminPortal;
