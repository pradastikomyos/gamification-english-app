import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserCredentialsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCloseParent: () => void;
  name: string;
  role: string;
  username?: string;
  password?: string; // Optional, as teachers might not have a temporary password displayed
}

export const UserCredentialsDialog: React.FC<UserCredentialsDialogProps> = ({
  isOpen,
  onOpenChange,
  onCloseParent,
  name,
  role,
  username,
  password,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Berhasil Disalin!',
      description: `${fieldName} telah disalin ke clipboard.`,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onCloseParent) {
      onCloseParent();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-green-600">Kredensial Pengguna</DialogTitle>
          <DialogDescription>
            Salin dan berikan kredensial ini kepada {name}. Kredensial
            <span className="font-bold text-red-500"> hanya ditampilkan sekali!</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center">
            <p className="w-24 text-sm font-medium text-gray-700">Nama:</p>
            <p className="text-lg font-semibold">{name}</p>
          </div>
          <div className="flex items-center">
            <p className="w-24 text-sm font-medium text-gray-700">Peran:</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {role === 'student' ? 'Siswa' : 'Guru'}
            </span>
          </div>

          {username && (
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 text-sm font-medium text-gray-700">Username:</p>
              <Input
                id="username"
                type="text"
                value={username}
                readOnly
                className="col-span-2"
              />
              <div className="flex space-x-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(username, 'Username')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {password && (
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 text-sm font-medium text-gray-700">Password:</p>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                readOnly
                className="col-span-2"
              />
              <div className="flex space-x-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(password, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-700">
            <p className="font-bold">Catatan:</p>
            <p>Pengguna akan diminta mengganti password saat login pertama.</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
