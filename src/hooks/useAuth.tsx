import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userId: string | null;
  role: 'admin' | 'teacher' | 'student' | null;
  profileId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  }, [queryClient, navigate]);

  useEffect(() => {
    const fetchUserProfile = async (user: User | null) => {
      if (!user) {
        setRole(null);
        setProfileId(null);
        return;
      }
      try {
        // First, get the role from user_roles
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError) throw roleError;
        const userRole = roleData?.role as 'admin' | 'teacher' | 'student' || null;
        setRole(userRole);

        // If the user is a student, fetch their actual profile ID from the students table
        if (userRole === 'student') {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id') // Select the primary key of the student
            .eq('user_id', user.id) // Find the student record using the auth user ID
            .single();
          if (studentError) throw studentError;
          setProfileId(studentData?.id || null);
        } else if (userRole === 'teacher') {
            const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();
          if (teacherError) throw teacherError;
          setProfileId(teacherData?.id || null);
        } else {
          setProfileId(null); // Admins or other roles might not have a profile ID
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setRole(null);
        setProfileId(null);
      }
    };

    // onAuthStateChange fires immediately with the current session,
    // so it handles both initial load and subsequent changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Unblock the UI immediately once the session is known.
      setLoading(false); 
      // Fetch the user's profile and role in the background.
      fetchUserProfile(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true); // Set loading to true when sign-in starts
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // On success, onAuthStateChange will handle setting loading to false.
    } catch (error: any) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false); // On failure, we must manually set loading to false.
    }
  };

  const value = { session, user, userId: user?.id || null, role, profileId, loading, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
