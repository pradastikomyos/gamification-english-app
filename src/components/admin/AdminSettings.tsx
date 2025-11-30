import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

const APP_NAME = 'Anna 曼达廷';
const APP_VERSION = '1.0.0';

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Ganti email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });
    setLoading(false);
    if (error) {
      toast({ title: 'Gagal update email', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email berhasil diupdate', description: 'Cek inbox email baru untuk verifikasi.' });
    }
  };

  // Ganti password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Gagal update password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password berhasil diupdate', description: 'Password baru sudah aktif.' });
      setPassword('');
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold">Pengaturan Admin</h1>
      {/* Ganti Email */}
      <form onSubmit={handleChangeEmail} className="space-y-2 bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Ganti Email</h2>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Button type="submit" disabled={loading}>Update Email</Button>
      </form>
      {/* Ganti Password */}
      <form onSubmit={handleChangePassword} className="space-y-2 bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Ganti Password</h2>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
        <Button type="submit" disabled={loading}>Update Password</Button>
      </form>
      {/* Tema */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <h2 className="font-semibold">Tema</h2>
        <ThemeToggle />
      </div>
      {/* Info Aplikasi */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <h2 className="font-semibold">Info Aplikasi</h2>
        <p>Nama: {APP_NAME}</p>
        <p>Versi: {APP_VERSION}</p>
      </div>
    </div>
  );
};

export default AdminSettings;
