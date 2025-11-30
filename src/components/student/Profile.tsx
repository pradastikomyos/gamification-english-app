import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { SimpleTourControl } from './SimpleTourControl';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, BarChart2, Star, Award, Edit, Camera, Lock } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  total_points: number;
  level: number;
  current_streak: number;
  avatar_url: string;
  created_at: string;
}

interface ProfileProps {
  onNavigateToDashboard?: () => void;
}

const Profile = ({ onNavigateToDashboard }: ProfileProps) => {
  const { user, profileId, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', profileId)
          .single();

        if (error) throw error;
        
        if (data) {
          setProfile(data);
        }
      } catch (err: any) {
        setError('Failed to load profile. Please try again later.');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  useEffect(() => {
    if (profile) {
      setFormData({ name: profile.name, password: '', confirmPassword: '' });
    }
  }, [profile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (profile) {
      setFormData({ name: profile.name, password: '', confirmPassword: '' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

      const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !profileId) {
      toast({ title: 'Error', description: 'Invalid confirmation or user ID.', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: profileId },
      });

      if (error) throw error;

      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      await signOut();
      // The user will be redirected to the login page by the auth hook.

    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete account.', variant: 'destructive' });
    } finally {
      setDeleteConfirmText('');
    }
  };

  const handleProfileUpdate = async () => {
    if (!profileId || !profile) return;

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      let avatarUrl = profile.avatar_url;

      // 1. Update password if provided
      if (formData.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password,
        });
        if (passwordError) throw passwordError;
      }

      // 2. Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profileId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = urlData.publicUrl;
      }

      // 3. Update student profile data
      const { data, error } = await supabase
        .from('students')
        .update({ 
          name: formData.name,
          avatar_url: avatarUrl
        })
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setIsEditing(false);
      toast({ title: 'Success', description: 'Profile updated successfully!' });

    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update profile.', variant: 'destructive' });
      console.error('Error updating profile:', err);
    } finally {
      setUploading(false);
      setAvatarFile(null);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center p-8">Could not find profile data.</div>;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="bg-gray-50 dark:bg-gray-800 p-6 relative">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url} alt={profile.name} />
                <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera className="h-4 w-4 text-white" />
                  <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <div>
              {isEditing ? (
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="text-3xl font-bold"
                />
              ) : (
                <CardTitle className="text-3xl font-bold">{profile.name}</CardTitle>
              )}
              <p className="text-md text-gray-500 dark:text-gray-400">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={handleEditToggle} variant="outline" size="sm" className="absolute top-4 right-4">
              <Edit className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6 grid gap-6">
          {!isEditing ? (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{profile.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatItem icon={BarChart2} label="Level" value={profile.level} />
                  <StatItem icon={Star} label="Total Points" value={profile.total_points} />
                  <StatItem icon={Award} label="Streak" value={`${profile.current_streak} days`} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Dashboard Tour</h3>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">
                        🎓 Panduan Dashboard
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        Pelajari cara menggunakan semua fitur dashboard Anna 曼达廷
                      </p>
                    </div>
                    <SimpleTourControl onNavigateToDashboard={onNavigateToDashboard} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Change Password</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      name="password" 
                      type="password" 
                      placeholder="New Password" 
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      name="confirmPassword" 
                      type="password" 
                      placeholder="Confirm New Password" 
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end space-x-2 p-6 bg-gray-50 dark:bg-gray-800">
            <Button variant="outline" onClick={handleEditToggle}>Cancel</Button>
            <Button onClick={handleProfileUpdate} disabled={uploading}>
              {uploading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        )}

        {/* Danger Zone */}
        {!isEditing && (
          <>
            <CardFooter className="p-6 pt-0">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </CardFooter>
            <CardContent className="p-6 pt-0">
              <h3 className="font-semibold text-lg mb-4 text-red-600">Danger Zone</h3>
              <div className="flex justify-between items-center p-4 border border-red-500 rounded-lg">
                <div>
                  <p className="font-bold">Delete Your Account</p>
                  <p className="text-sm text-gray-500">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        To confirm, please type <strong>DELETE</strong> below.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input 
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder='Type "DELETE" to confirm'
                      className="my-4"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount} 
                        disabled={deleteConfirmText !== 'DELETE'}
                      >
                        I understand, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center">
    <Icon className="h-8 w-8 text-blue-600 mr-4" />
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default Profile;
